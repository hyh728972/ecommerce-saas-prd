/**
 * common-jicai-order-data.js
 * 集采直发订单（12/12a）主数据 — 列表与详情共用单源（主订单/配货单两级）
 * 商品信息经供应链SKU（-JC 履约后缀）join common-goods-data.js，本文件只存订单域数据
 * 固定时钟 NOW：原型内一切"剩余交货时间/今日"口径以此为基准，不取系统时间
 *
 * 口径拍板（2026-09-02）：
 * - 主订单状态 = 待发货/已发货/已完成 + 中止·退运营端（与运营端集采订单列表 4 态词汇对齐，8-28 六态作废）
 * - 部分发货不设独立状态，由主单头「发货 n/m」进度承载
 * - 配货单按锁定供方拆分（报价生成时锁定，不再二次择优），无改派场景
 * - 履约模型（2026-09-02 BOSS 拍板）＝先分单：先按锁定供方拆配货单，再按分发计划收货地址
 *   分票发货——集采履约方式与一件代发一致（供方发货→运单回传→逐行签收），只是多了不同收货地址
 * - 下推前提：运营端填完收货地址（分发计划）并校验锁定后才自动下推供应链，
 *   待填地址的集采订单不进本列表（归运营端处理）
 * - 供方无法履约 → 优先改派供应商（整单换供）/ 拆单发货（多供分摊）自救；
 *   仍无法履约才中止履约退运营平台人工处理（2026-09-03 拍板，修订 8-28「无法履约=只能中止退A端」为兜底）
 * - 改派模型（参考一件代发 E11 同款）：原配货单作废留痕 + 新配货单下发并标记「换供」；
 *   约定交期沿用客户报价口径（deliveryDeadline/deliveryDays 不随供方变更，2026-09-03 拍板）
 * - 拆单发货：数量+收货人数两行手填（新供方侧自动补齐），新单同样标「换供」
 * - 交期口径：报价定价时敲定约定交期（deliveryDays 工作日 → deliveryDeadline），
 *   待发货=剩余交货时间（≤48h 橙 / 已超期 红）；发货后=实际发货时间
 * - 分发进度（配货单级，收货人行级，对齐运营端集采订单列表）＝未发完显示「发货 n/N」、
 *   全部发货后显示「签收 k/N」；shippedRows/signedRows = 已发货/已签收收货人行数
 * - 协议销售单价 agreePrice = 成交时报价快照（每单议定，mock 统一取整上浮）；
 *   供货价不存 item 级、由商品池 join 派生（单源）；主单头双显 协议金额+供货价合计
 * - waybills = 代表性运单样例（12a 详情展示用，列表页不展示运单号）
 */
(function () {
  'use strict';

  var NOW = '2026-09-01 10:00';
  var TODAY = '2026-09-01';

  /** 权威供方集（编码用于配货单号 PH-{供方编码}{流水}） */
  var supplierMap = {
    '星辰商贸': { code: 'A001' },
    '恒通供应链': { code: 'A002' },
    '鹏程优品': { code: 'A003' },
    '京东物流': { code: 'C001' },
    '顺丰供应链': { code: 'C002' }
  };

  /** 主订单状态 */
  var orderStatusMeta = {
    waiting: { label: '待发货', cls: 'tag-blue' },
    shipped: { label: '已发货', cls: 'tag-green' },
    completed: { label: '已完成', cls: 'tag-gray' },
    aborted: { label: '中止·退运营端', cls: 'tag-red' }
  };

  /** 履约状态（配货单级） */
  var phStatusMeta = {
    waiting: { label: '待发货', cls: 'tag-blue' },
    shipped: { label: '已发货', cls: 'tag-green' },
    signed: { label: '已签收', cls: 'tag-gray' },
    cancelled: { label: '已取消', cls: 'tag-gray' }
  };

  /**
   * 改派/拆单候选供方（key=供应链SKU基础码，改派目标=同款商品其他可供方）
   * jcPrice=该供方集采供货价（改派/拆单后按此口径对账）；leadTimeDays 仅供参考展示，
   * 约定交期沿用客户报价口径不随供方变更
   */
  var dispatchCandidates = {
    'HZ-A00001-002': [
      { supplier: '星辰商贸', jcPrice: 17.5, moq: 100, stock: 5000, leadTimeDays: 3 },
      { supplier: '鹏程优品', jcPrice: 16.2, moq: 200, stock: 3000, leadTimeDays: 5 }
    ],
    'HZ-A00004-001': [
      { supplier: '恒通供应链', jcPrice: 36, moq: 50, stock: 2000, leadTimeDays: 3 },
      { supplier: '鹏程优品', jcPrice: 35.8, moq: 100, stock: 1200, leadTimeDays: 5 }
    ],
    'HZ-A00015-001': [
      { supplier: '恒通供应链', jcPrice: 29.5, moq: 50, stock: 800, leadTimeDays: 3 },
      { supplier: '星辰商贸', jcPrice: 30, moq: 50, stock: 600, leadTimeDays: 4 }
    ],
    'HZ-A00023-001': [
      { supplier: '顺丰供应链', jcPrice: 1450, moq: 10, stock: 40, leadTimeDays: 7 }
    ],
    'HZ-A00024-001': [
      { supplier: '京东物流', jcPrice: 930, moq: 30, stock: 200, leadTimeDays: 7 }
    ]
  };

  /**
   * 主订单覆盖矩阵（14 单）：
   * 今日成交待发货（今日采购金额口径）/ 临近交期≤48h(橙) / 3供方3配货单·客户备注 /
   * 已超期未发货(红) / 发货进度1/2（主状态仍待发货·进度承载）/ 中止退运营端（供方无法履约·2配货单冻结）/
   * 今日已发货×2（回传运单口径，其一 部分回传 发货12/20）/ MOQ大批量（冰箱MOQ10·手机MOQ30）/
   * 部分签收（签收14/22）与全签收（签收22/22）/ 已完成·全签收（签收15/15）/
   * 窗口外3单（已完成07-20 / 已发货08-08 / 待发货08-18 — 验证默认近7天筛选排除，拉宽时间可查）
   * 与运营端集采订单列表同号复用：JC20260829002 / JC20260818001 / JC20260808004 / JC20260720005
   * （运营端 JC20260831001 为待填收货地址未下推，不进供应链列表）
   * agreePrice 快照：口罩21.00 / 保温杯42.00 / 山茶油35.00 / 冰箱1599 / 手机1080
   */
  var orders = [
    {
      mainNo: 'JC20260901006', quoteId: 'XQ20260830006', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-09-01 09:10', pushTime: '2026-09-01 09:12', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0011201', supplier: '星辰商贸', status: 'waiting',
          items: [{ subNo: 'JC2026090100601', sku: 'HZ-A00004-001-JC', qty: 300, agreePrice: 42 }],
          recipientCount: 9, shippedRows: 0, signedRows: 0, deliveryDays: 10, deliveryDeadline: '2026-09-11 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-09-01 09:05', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-09-01 09:12', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260830006', quoteId: 'XQ20260829006', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-08-30 15:40', pushTime: '2026-08-30 15:45', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0021101', supplier: '恒通供应链', status: 'waiting',
          items: [{ subNo: 'JC2026083000601', sku: 'HZ-A00001-002-JC', qty: 600, agreePrice: 21 }],
          recipientCount: 12, shippedRows: 0, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-02 08:00',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-30 15:36', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-30 15:45', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260829002', quoteId: 'XQ20260828002', quoteVersion: 'V2',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-08-29 14:26', pushTime: '2026-08-29 14:31', status: 'waiting',
      remark: '中秋员工福利集采', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0021091', supplier: '恒通供应链', status: 'waiting',
          items: [{ subNo: 'JC2026082900201', sku: 'HZ-A00001-002-JC', qty: 800, agreePrice: 21 }],
          recipientCount: 16, shippedRows: 0, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-05 23:59',
          shipTime: '', express: '', waybills: [] },
        { phNo: 'PH-A0011092', supplier: '星辰商贸', status: 'waiting',
          items: [{ subNo: 'JC2026082900202', sku: 'HZ-A00004-001-JC', qty: 200, agreePrice: 42 }],
          recipientCount: 16, shippedRows: 0, signedRows: 0, deliveryDays: 10, deliveryDeadline: '2026-09-08 23:59',
          shipTime: '', express: '', waybills: [] },
        { phNo: 'PH-A0031093', supplier: '鹏程优品', status: 'waiting',
          items: [{ subNo: 'JC2026082900203', sku: 'HZ-A00015-001-JC', qty: 200, agreePrice: 35 }],
          recipientCount: 16, shippedRows: 0, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-05 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-29 14:20', node: '报价单 V2 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-29 14:31', node: '分发计划校验锁定，自动下推供应链', type: 'sys' },
        { ts: '2026-08-29 14:31', node: '按锁定供方拆 3 个配货单下发', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260829013', quoteId: 'XQ20260827013', quoteVersion: 'V1',
      customer: '金陵数科信息技术有限公司', customerShort: '金陵数科',
      buyer: { name: '沈一鸣', phone: '159****6602' }, sales: '李想',
      dealTime: '2026-08-29 09:15', pushTime: '2026-08-29 09:18', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-C0021081', supplier: '顺丰供应链', status: 'waiting',
          items: [{ subNo: 'JC2026082901301', sku: 'HZ-A00024-001-JC', qty: 90, agreePrice: 1080 }],
          recipientCount: 3, shippedRows: 0, signedRows: 0, deliveryDays: 5, deliveryDeadline: '2026-09-04 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-29 09:10', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-29 09:18', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260828007', quoteId: 'XQ20260826007', quoteVersion: 'V1',
      customer: '金陵数科信息技术有限公司', customerShort: '金陵数科',
      buyer: { name: '沈一鸣', phone: '159****6602' }, sales: '李想',
      dealTime: '2026-08-28 11:05', pushTime: '2026-08-28 11:10', status: 'waiting',
      remark: '周年庆员工礼品，交期敏感', abortReason: '',
      dispatches: [
        { phNo: 'PH-C0021071', supplier: '顺丰供应链', status: 'waiting',
          items: [{ subNo: 'JC2026082800701', sku: 'HZ-A00024-001-JC', qty: 60, agreePrice: 1080 }],
          recipientCount: 2, shippedRows: 0, signedRows: 0, deliveryDays: 5, deliveryDeadline: '2026-08-31 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-28 11:00', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-28 11:10', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260827008', quoteId: 'XQ20260825008', quoteVersion: 'V3',
      customer: '苏泰控股集团有限公司', customerShort: '苏泰控股',
      buyer: { name: '周晓岚', phone: '187****3308' }, sales: '张晗',
      dealTime: '2026-08-27 16:20', pushTime: '2026-08-27 16:26', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-C0011061', supplier: '京东物流', status: 'waiting',
          items: [{ subNo: 'JC2026082700801', sku: 'HZ-A00023-001-JC', qty: 20, agreePrice: 1599 }],
          recipientCount: 4, shippedRows: 0, signedRows: 0, deliveryDays: 14, deliveryDeadline: '2026-09-10 23:59',
          shipTime: '', express: '', waybills: [] },
        { phNo: 'PH-C0021062', supplier: '顺丰供应链', status: 'shipped',
          items: [{ subNo: 'JC2026082700802', sku: 'HZ-A00024-001-JC', qty: 30, agreePrice: 1080 }],
          recipientCount: 4, shippedRows: 4, signedRows: 1, deliveryDays: 5, deliveryDeadline: '2026-09-01 23:59',
          shipTime: '2026-08-31 14:12', express: '顺丰速运',
          waybills: [{ express: '顺丰速运', no: 'SF1388229045617' }] }
      ],
      timeline: [
        { ts: '2026-08-27 16:15', node: '报价单 V3 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-27 16:26', node: '按锁定供方拆 2 个配货单下发', type: 'sys' },
        { ts: '2026-08-31 14:12', node: '顺丰供应链回传运单（分发明细 4/4 已发货）', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260826010', quoteId: 'XQ20260824010', quoteVersion: 'V1',
      customer: '苏泰控股集团有限公司', customerShort: '苏泰控股',
      buyer: { name: '周晓岚', phone: '187****3308' }, sales: '李想',
      dealTime: '2026-08-26 09:30', pushTime: '2026-08-26 09:33', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-C0011051', supplier: '京东物流', status: 'waiting',
          items: [{ subNo: 'JC2026082601001', sku: 'HZ-A00023-001-JC', qty: 10, agreePrice: 1599 }],
          recipientCount: 2, shippedRows: 0, signedRows: 0, deliveryDays: 14, deliveryDeadline: '2026-09-09 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-26 09:26', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-26 09:33', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260826009', quoteId: 'XQ20260824009', quoteVersion: 'V2',
      customer: '金陵数科信息技术有限公司', customerShort: '金陵数科',
      buyer: { name: '沈一鸣', phone: '159****6602' }, sales: '李想',
      dealTime: '2026-08-26 10:50', pushTime: '2026-08-26 10:55', status: 'aborted',
      remark: '供应商大会物资', abortReason: '锁定供方鹏程优品库存不足无法履约，分发计划冻结，退运营平台人工处理',
      dispatches: [
        { phNo: 'PH-A0031041', supplier: '鹏程优品', status: 'cancelled',
          items: [{ subNo: 'JC2026082600901', sku: 'HZ-A00015-001-JC', qty: 500, agreePrice: 35 }],
          recipientCount: 8, shippedRows: 0, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-02 23:59',
          shipTime: '', express: '', waybills: [] },
        { phNo: 'PH-A0011042', supplier: '星辰商贸', status: 'cancelled',
          items: [{ subNo: 'JC2026082600902', sku: 'HZ-A00004-001-JC', qty: 400, agreePrice: 42 }],
          recipientCount: 8, shippedRows: 0, signedRows: 0, deliveryDays: 10, deliveryDeadline: '2026-09-05 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-26 10:46', node: '报价单 V2 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-26 10:55', node: '按锁定供方拆 2 个配货单下发', type: 'sys' },
        { ts: '2026-08-27 09:02', node: '鹏程优品反馈无法履约，中止下推，退运营平台处理', type: 'human' }
      ],
      opLogs: [
        { ts: '2026-08-27 09:02', who: '系统', action: '中止履约', target: 'JC20260826009', reason: '锁定供方鹏程优品库存不足无法履约' }
      ]
    },
    {
      mainNo: 'JC20260825003', quoteId: 'XQ20260823003', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-08-25 11:08', pushTime: '2026-08-25 11:12', status: 'shipped',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0021031', supplier: '恒通供应链', status: 'shipped',
          items: [{ subNo: 'JC2026082500301', sku: 'HZ-A00001-002-JC', qty: 1000, agreePrice: 21 }],
          recipientCount: 20, shippedRows: 12, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-01 23:59',
          shipTime: '2026-09-01 08:05', express: '中通快递',
          waybills: [{ express: '中通快递', no: 'ZTO884107220031' }, { express: '中通快递', no: 'ZTO884107220032' }] },
        { phNo: 'PH-A0031032', supplier: '鹏程优品', status: 'shipped',
          items: [{ subNo: 'JC2026082500302', sku: 'HZ-A00015-001-JC', qty: 300, agreePrice: 35 }],
          recipientCount: 20, shippedRows: 20, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-01 23:59',
          shipTime: '2026-09-01 09:20', express: '圆通速递',
          waybills: [{ express: '圆通速递', no: 'YT2178449200756' }] }
      ],
      timeline: [
        { ts: '2026-08-25 11:03', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-25 11:12', node: '按锁定供方拆 2 个配货单下发', type: 'sys' },
        { ts: '2026-09-01 08:05', node: '恒通供应链回传运单（分发明细 12/20 已发货）', type: 'sys' },
        { ts: '2026-09-01 09:20', node: '鹏程优品回传运单（分发明细 20/20 已发货）', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260825012', quoteId: 'XQ20260823012', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-08-25 16:30', pushTime: '2026-08-25 16:34', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-C0011021', supplier: '京东物流', status: 'waiting',
          items: [{ subNo: 'JC2026082501201', sku: 'HZ-A00023-001-JC', qty: 15, agreePrice: 1599 }],
          recipientCount: 5, shippedRows: 0, signedRows: 0, deliveryDays: 14, deliveryDeadline: '2026-09-08 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-25 16:26', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-25 16:34', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260824011', quoteId: 'XQ20260822011', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '李想',
      dealTime: '2026-08-24 17:45', pushTime: '2026-08-24 17:50', status: 'waiting',
      remark: '季度劳保用品补货', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0021011', supplier: '恒通供应链', status: 'waiting',
          items: [{ subNo: 'JC2026082401101', sku: 'HZ-A00001-002-JC', qty: 1000, agreePrice: 21 }],
          recipientCount: 18, shippedRows: 0, signedRows: 0, deliveryDays: 7, deliveryDeadline: '2026-09-03 23:59',
          shipTime: '', express: '', waybills: [] },
        { phNo: 'PH-A0011012', supplier: '星辰商贸', status: 'waiting',
          items: [{ subNo: 'JC2026082401102', sku: 'HZ-A00004-001-JC', qty: 400, agreePrice: 42 }],
          recipientCount: 18, shippedRows: 0, signedRows: 0, deliveryDays: 10, deliveryDeadline: '2026-09-06 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-24 17:40', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-24 17:50', node: '按锁定供方拆 2 个配货单下发', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260818001', quoteId: 'XQ20260816001', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-08-18 14:12', pushTime: '2026-08-18 14:16', status: 'waiting',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0030981', supplier: '鹏程优品', status: 'waiting',
          items: [{ subNo: 'JC2026081800101', sku: 'HZ-A00015-001-JC', qty: 500, agreePrice: 35 }],
          recipientCount: 10, shippedRows: 0, signedRows: 0, deliveryDays: 14, deliveryDeadline: '2026-09-04 23:59',
          shipTime: '', express: '', waybills: [] }
      ],
      timeline: [
        { ts: '2026-08-18 14:08', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-18 14:16', node: '分发计划校验锁定，自动下推供应链', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260808004', quoteId: 'XQ20260806004', quoteVersion: 'V2',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-08-08 10:22', pushTime: '2026-08-08 10:26', status: 'shipped',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0020901', supplier: '恒通供应链', status: 'shipped',
          items: [{ subNo: 'JC2026080800401', sku: 'HZ-A00001-002-JC', qty: 2000, agreePrice: 21 }],
          recipientCount: 22, shippedRows: 22, signedRows: 14, deliveryDays: 7, deliveryDeadline: '2026-08-30 23:59',
          shipTime: '2026-08-28 16:40', express: '中通快递',
          waybills: [{ express: '中通快递', no: 'ZTO883922610081' }, { express: '中通快递', no: 'ZTO883922610082' }, { express: '中通快递', no: 'ZTO883922610083' }] },
        { phNo: 'PH-A0010902', supplier: '星辰商贸', status: 'signed',
          items: [{ subNo: 'JC2026080800402', sku: 'HZ-A00004-001-JC', qty: 600, agreePrice: 42 }],
          recipientCount: 22, shippedRows: 22, signedRows: 22, deliveryDays: 10, deliveryDeadline: '2026-09-01 23:59',
          shipTime: '2026-08-29 10:15', express: '韵达快递',
          waybills: [{ express: '韵达快递', no: 'YD4001887225601' }] }
      ],
      timeline: [
        { ts: '2026-08-08 10:18', node: '报价单 V2 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-08-08 10:26', node: '按锁定供方拆 2 个配货单下发', type: 'sys' },
        { ts: '2026-08-29 10:15', node: '供方回传运单 2/2', type: 'sys' },
        { ts: '2026-08-31 18:00', node: '星辰商贸分发明细全部签收', type: 'sys' }
      ],
      opLogs: []
    },
    {
      mainNo: 'JC20260720005', quoteId: 'XQ20260718005', quoteVersion: 'V1',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      buyer: { name: '王启航', phone: '138****1234' }, sales: '张晗',
      dealTime: '2026-07-20 09:40', pushTime: '2026-07-20 09:44', status: 'completed',
      remark: '', abortReason: '',
      dispatches: [
        { phNo: 'PH-A0030811', supplier: '鹏程优品', status: 'signed',
          items: [{ subNo: 'JC2026072000501', sku: 'HZ-A00015-001-JC', qty: 800, agreePrice: 35 }],
          recipientCount: 15, shippedRows: 15, signedRows: 15, deliveryDays: 14, deliveryDeadline: '2026-08-03 23:59',
          shipTime: '2026-08-01 09:30', express: '圆通速递',
          waybills: [{ express: '圆通速递', no: 'YT2176910358821' }] }
      ],
      timeline: [
        { ts: '2026-07-20 09:36', node: '报价单 V1 客户确认，转集采订单', type: 'sys' },
        { ts: '2026-07-20 09:44', node: '分发计划校验锁定，自动下推供应链', type: 'sys' },
        { ts: '2026-08-05 11:20', node: '分发明细全部签收，订单完成', type: 'sys' }
      ],
      opLogs: []
    }
  ];

  window.SupplyJicaiData = {
    NOW: NOW,
    TODAY: TODAY,
    supplierMap: supplierMap,
    orderStatusMeta: orderStatusMeta,
    phStatusMeta: phStatusMeta,
    dispatchCandidates: dispatchCandidates,
    orders: orders
  };
})();
