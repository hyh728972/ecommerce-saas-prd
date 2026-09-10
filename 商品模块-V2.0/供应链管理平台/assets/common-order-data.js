/**
 * common-order-data.js
 * 一件代发订单（11/11a）主数据 — 列表与详情共用单源（主订单/配货单两级）
 * 商品/供方信息经供应链SKU join common-goods-data.js，本文件只存订单域数据
 * 固定时钟 NOW：原型内一切"剩余发货时间/今日"口径以此为基准，不取系统时间
 */
(function () {
  'use strict';

  var NOW = '2026-08-25 10:00';
  var TODAY = '2026-08-25';
  var SHIP_PROMISE_HOURS = 24;

  /** 权威供方集（编码用于配货单号 PH-{供方编码}{流水}） */
  var supplierMap = {
    '星辰商贸': { code: 'A001', grade: '核心' },
    '恒通供应链': { code: 'A002', grade: '核心' },
    '鹏程优品': { code: 'A003', grade: '普通' },
    '环球优选': { code: 'A004', grade: '核心' },
    'OPPO官方旗舰店': { code: 'B003', grade: '战略' },
    '数字服务商A': { code: 'KM01', grade: '核心' }
  };

  /** 渠道枚举取品牌商城主数据（含停用渠道，历史订单可查） */
  var mallOptions = [
    { name: '锦程员工福利商城' },
    { name: '锦程积分商城' },
    { name: '泡泡玛特官方商城' },
    { name: '泡泡玛特企业购' },
    { name: '社区公益点' },
    { name: '悦享生活精选', disabled: true }
  ];

  /** 分单状态（主订单级） */
  var dispatchStatusMeta = {
    pending: { label: '待分单', cls: 'tag-gray' },
    dispatching: { label: '分单中', cls: 'tag-blue' },
    done: { label: '已分单', cls: 'tag-green' },
    confirm: { label: '主供缺货待确认', cls: 'tag-orange' },
    failed: { label: '分单失败', cls: 'tag-red' }
  };

  /** 履约状态（配货单级） */
  var phStatusMeta = {
    waiting: { label: '待发货', cls: 'tag-blue' },
    shipped: { label: '已发货', cls: 'tag-green' },
    signed: { label: '已签收', cls: 'tag-gray' },
    cancelled: { label: '已取消', cls: 'tag-gray' },
    closed: { label: '已关闭', cls: 'tag-gray' }
  };

  /** 售后协同（只读标签） */
  var afterSaleMeta = {
    none: { label: '—', cls: '' },
    return: { label: '退货协同中', cls: 'tag-orange' },
    done: { label: '退货完成', cls: 'tag-green' }
  };

  /**
   * 主订单覆盖矩阵：
   * 待分单 / 分单中(超时重试) / 分单失败(部分失败 N/M：1 项熔断 + 1 项已分单) /
   * 主供缺货待确认(N/M·待确认) / 主供缺货超时已通知客服 /
   * 部分发货(3子项2配货单·已发货行含多运单) / 待发货+换供 /
   * 即将超时 / 已超时+换供+L1升级 / 已发货完整轨迹+积分抵扣 /
   * 单商品已签收 / 已签收+退款协同 / 已取消(拦截) /
   * 停用渠道8天前已关闭(验证默认近7天筛选排除) / 虚拟商品(接口取卡中) /
   * 组合套装(BOM 主件+配件·拆2供方) / 营销买赠(主件+赠品) / 手动补单 /
   * 已签收+退货完成+补发换货配货单挂原单下（共用原子订单号）
   */
  var orders = [
    {
      mainNo: 'ORD20260825001', mall: '锦程员工福利商城', traceId: 'TRC-20260825-0101',
      customer: { name: '张三', phone: '138****8888' },
      orderTime: '2026-08-25 09:50', payTime: '2026-08-25 09:52',
      sales: { paid: 108.00, coupon: 10.00, points: 0 },
      remark: '',
      dispatchStatus: 'pending',
      receiver: { name: '张三', phoneMasked: '138****8888', phoneFull: '13812348888', address: '江苏省南京市玄武区中山东路 100 号 5 栋 802 室' },
      subs: [
        { subNo: 'ORD2026082500101', sku: 'HZ-A00015-001-DF', qty: 2, primarySupplier: '恒通供应链', reason: '' }
      ],
      phs: [],
      decisionLogs: [
        { sub: 'ORD2026082500101', steps: [
          { ts: '2026-08-25 09:52', type: 'sys', text: '订单接入：携带主供供应商（恒通供应链 · 商城·供应商指定）' },
          { ts: '2026-08-25 09:52', type: 'sys', text: '进入分单队列，等待引擎处理' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-25 09:50', node: 'C端下单（锦程员工福利商城）', type: 'sys' },
        { ts: '2026-08-25 09:52', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-25 09:52', node: '商城侧预占库存', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260825002', mall: '泡泡玛特官方商城', traceId: 'TRC-20260825-0202',
      customer: { name: '王芳', phone: '136****2209' },
      orderTime: '2026-08-25 09:38', payTime: '2026-08-25 09:40',
      sales: { paid: 1288.00, coupon: 0, points: 0 },
      remark: '尽快发货',
      dispatchStatus: 'dispatching', dispatchNote: '引擎决策超时，自动重试（第 2 次）',
      receiver: { name: '王芳', phoneMasked: '136****2209', phoneFull: '13612342209', address: '上海市浦东新区张江路 300 弄 12 号 501 室' },
      subs: [
        { subNo: 'ORD2026082500201', sku: 'HZ-A00014-001-DF', qty: 1, primarySupplier: '星辰商贸', reason: '' }
      ],
      phs: [],
      decisionLogs: [
        { sub: 'ORD2026082500201', steps: [
          { ts: '2026-08-25 09:40', type: 'sys', text: '订单接入：携带主供供应商（星辰商贸 · 商城·最低价优先当次主供）' },
          { ts: '2026-08-25 09:40', type: 'sys', text: '引擎处理中：查询同款备选池（2 家供方）' },
          { ts: '2026-08-25 09:43', type: 'sys', text: '决策超时（>3s），自动跳过并重试（第 2 次）' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-25 09:38', node: 'C端下单（泡泡玛特官方商城）', type: 'sys' },
        { ts: '2026-08-25 09:40', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-25 09:40', node: '分单引擎受理', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260824003', mall: '社区公益点', traceId: 'TRC-20260824-0303',
      customer: { name: '赵敏', phone: '137****9012' },
      orderTime: '2026-08-24 16:18', payTime: '2026-08-24 16:20',
      sales: { paid: 898.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'failed',
      receiver: { name: '赵敏', phoneMasked: '137****9012', phoneFull: '13712349012', address: '浙江省杭州市西湖区文三路 25 号 3 幢 1601 室' },
      subs: [
        { subNo: 'ORD2026082400301', sku: 'HZ-A00017-001-DF', qty: 1, primarySupplier: '', reason: '候选供方均已熔断，无法自动分单' }
      ],
      phs: [
        { phNo: 'PH-A0040003', supplier: '环球优选', primary: true, status: 'waiting',
          items: [{ sku: 'HZ-A00016-001-DF', qty: 1, subNo: 'ORD2026082400302' }],
          deadline: '2026-08-25 16:20',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082400301', steps: [
          { ts: '2026-08-24 16:20', type: 'sys', text: '订单接入：未携带主供供应商 → 走自动智能分单（三级决策链）' },
          { ts: '2026-08-24 16:20', type: 'sys', text: '① 供应商等级：鹏程优品（普通）命中，唯一候选' },
          { ts: '2026-08-24 16:20', type: 'sys', text: '② 利润差额 / ③ 供方评级：跳过（无并列候选）' },
          { ts: '2026-08-24 16:20', type: 'sys', text: '命中熔断：鹏程优品在途异常 → 顺延下一候选' },
          { ts: '2026-08-24 16:20', type: 'sys', text: '候选穷尽，子项分单失败；待人工改派' }
        ] },
        { sub: 'ORD2026082400302', steps: [
          { ts: '2026-08-24 16:20', type: 'sys', text: '订单接入：未携带主供供应商 → 走自动智能分单（三级决策链）' },
          { ts: '2026-08-24 16:20', type: 'sys', text: '① 供应商等级：环球优选（核心）命中；库存充足' },
          { ts: '2026-08-24 16:20', type: 'sys', text: '生成配货单 PH-A0040003 下发环球优选' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 16:18', node: 'C端下单（社区公益点）', type: 'sys' },
        { ts: '2026-08-24 16:20', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 16:20', node: '子项2 自动分单完成，配货单下发', type: 'sys' },
        { ts: '2026-08-24 16:20', node: '子项1 自动智能分单失败（候选穷尽）', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260824004', mall: '锦程员工福利商城', traceId: 'TRC-20260824-0404',
      customer: { name: '陈浩', phone: '135****7780' },
      orderTime: '2026-08-24 15:03', payTime: '2026-08-24 15:05',
      sales: { paid: 338.00, coupon: 0, points: 8.00 },
      remark: '',
      dispatchStatus: 'confirm', confirmProgress: '待确认',
      receiver: { name: '陈浩', phoneMasked: '135****7780', phoneFull: '13512347780', address: '江苏省南京市建邺区江东中路 108 号 2 单元 903 室' },
      subs: [
        { subNo: 'ORD2026082400401', sku: 'HZ-A00006-001-DF', qty: 1, primarySupplier: '恒通供应链', reason: '主供 恒通供应链：无可售库存' }
      ],
      phs: [
        { phNo: 'PH-A0020007', supplier: '恒通供应链', primary: true, status: 'shipped',
          items: [{ sku: 'HZ-A00019-001-DF', qty: 1 }],
          deadline: '2026-08-25 15:05', shipTime: '2026-08-25 09:12',
          express: '中通快递', waybills: [{ express: '中通快递', no: 'ZTO8829100456' }],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082400401', steps: [
          { ts: '2026-08-24 15:05', type: 'sys', text: '主供指派：恒通供应链（商城·供应商指定）；查询可售库存 0' },
          { ts: '2026-08-24 15:05', type: 'sys', text: '主供彻底无货 → 子项置「主供缺货待确认」（主订单 N/M：1/2 待确认）' },
          { ts: '2026-08-24 15:05', type: 'sys', text: '已通知操作人：站内消息 + 企业微信（商品信息 / 备用供方 2 家 / 30 分钟时限）' },
          { ts: '2026-08-24 15:05', type: 'human', text: '等待操作人确认是否换供；超时默认转客服通道' }
        ] },
        { sub: 'ORD2026082400402', steps: [
          { ts: '2026-08-24 15:05', type: 'sys', text: '主供指派：恒通供应链（商城·最低价优先当次主供）；库存 9,600 充足' },
          { ts: '2026-08-24 15:05', type: 'sys', text: '生成配货单 PH-A0020007 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 15:03', node: 'C端下单（锦程员工福利商城）', type: 'sys' },
        { ts: '2026-08-24 15:05', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 15:05', node: '子项1 主供缺货，通知操作人确认', type: 'sys' },
        { ts: '2026-08-24 15:05', node: '子项2 分单完成，配货单下发', type: 'sys' },
        { ts: '2026-08-25 09:12', node: '子项2 供方回传运单，已发货', type: 'sys' }
      ],
      tracks: { 'ZTO8829100456': [
        { ts: '2026-08-25 09:10', node: '中通快递 已揽收（南京）' },
        { ts: '2026-08-25 09:40', node: '到达 南京转运中心' }
      ] },
      opLogs: []
    },
    {
      mainNo: 'ORD20260824005', mall: '锦程积分商城', traceId: 'TRC-20260824-0505',
      customer: { name: '李四', phone: '139****6621' },
      orderTime: '2026-08-24 11:28', payTime: '2026-08-24 11:30',
      sales: { paid: 854.00, coupon: 20.00, points: 30.00 },
      remark: '杯子和耳机分开发',
      dispatchStatus: 'done',
      receiver: { name: '李四', phoneMasked: '139****6621', phoneFull: '13912346621', address: '江苏省南京市鼓楼区中山北路 88 号 3 栋 1201 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010012', supplier: '星辰商贸', primary: true, status: 'waiting',
          items: [{ sku: 'HZ-A00004-001-DF', qty: 2 }, { sku: 'HZ-A00010-001-DF', qty: 1 }],
          deadline: '2026-08-25 11:30',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null },
        { phNo: 'PH-A0040013', supplier: '环球优选', primary: true, status: 'shipped',
          items: [{ sku: 'HZ-A00012-001-DF', qty: 1 }],
          deadline: '2026-08-25 11:30', shipTime: '2026-08-24 18:30',
          express: '顺丰速运', waybills: [
            { express: '顺丰速运', no: 'SF13344556677' },
            { express: '顺丰速运', no: 'SF13344556688' }
          ],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082400501', steps: [
          { ts: '2026-08-24 11:30', type: 'sys', text: '主供指派：星辰商贸（商城·供应商指定）；库存充足' },
          { ts: '2026-08-24 11:30', type: 'sys', text: '同供方 2 个子项合并生成配货单 PH-A0010012' }
        ] },
        { sub: 'ORD2026082400503', steps: [
          { ts: '2026-08-24 11:30', type: 'sys', text: '主供指派：环球优选（商城·供应商指定）；库存充足' },
          { ts: '2026-08-24 11:30', type: 'sys', text: '生成配货单 PH-A0040013 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 11:28', node: 'C端下单（锦程积分商城）', type: 'sys' },
        { ts: '2026-08-24 11:30', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 11:30', node: '分单完成：2 个配货单下发（星辰商贸 / 环球优选）', type: 'sys' },
        { ts: '2026-08-24 18:30', node: 'PH-A0040013 供方回传运单（2 个），已发货', type: 'sys' }
      ],
      tracks: {
        'SF13344556677': [
          { ts: '2026-08-24 18:26', node: '顺丰速运 已揽收（北京）' },
          { ts: '2026-08-24 23:41', node: '到达 北京顺义集散中心' },
          { ts: '2026-08-25 06:12', node: '到达 南京江宁集散中心' },
          { ts: '2026-08-25 08:30', node: '派送中（南京鼓楼区）' }
        ],
        'SF13344556688': [
          { ts: '2026-08-24 18:40', node: '顺丰速运 已揽收（北京·配件单独打包）' },
          { ts: '2026-08-25 07:10', node: '到达 南京江宁集散中心' },
          { ts: '2026-08-25 09:05', node: '派送中（南京鼓楼区）' }
        ]
      },
      opLogs: []
    },
    {
      mainNo: 'ORD20260824006', mall: '泡泡玛特企业购', traceId: 'TRC-20260824-0606',
      customer: { name: '周杰', phone: '138****1122' },
      orderTime: '2026-08-24 17:38', payTime: '2026-08-24 17:40',
      sales: { paid: 1995.00, coupon: 0, points: 0 },
      remark: '企业团购，周一前必须到',
      dispatchStatus: 'done',
      receiver: { name: '周杰', phoneMasked: '138****1122', phoneFull: '13812341122', address: '广东省深圳市南山区科技园南区 6 栋 4 层' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010013', supplier: '星辰商贸', primary: true, status: 'cancelled',
          items: [{ sku: 'HZ-A00001-002-DF', qty: 50 }],
          deadline: '2026-08-25 17:40',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null,
          cancelNote: '换供作废：星辰商贸 → 恒通供应链（主供缺货，确认切换备用）' },
        { phNo: 'PH-A0020014', supplier: '恒通供应链', primary: false, status: 'waiting',
          items: [{ sku: 'HZ-A00001-002-DF', qty: 50 }],
          deadline: '2026-08-25 17:40',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null, reassignedFrom: '星辰商贸' }
      ],
      decisionLogs: [
        { sub: 'ORD2026082400601', steps: [
          { ts: '2026-08-24 17:40', type: 'sys', text: '主供指派：星辰商贸（商城·供应商指定）；大额团购可售库存不足' },
          { ts: '2026-08-24 17:40', type: 'sys', text: '主供缺货 → 通知操作人（站内 + 企微，30 分钟时限）' },
          { ts: '2026-08-24 17:52', type: 'human', text: '操作人确认切换；备用按三级决策链排序：①供应商等级 恒通供应链（核心）优先' },
          { ts: '2026-08-24 17:52', type: 'sys', text: '主供配货单 PH-A0010013 作废留痕，生成新配货单 PH-A0020014 下发恒通供应链，标记「非主供发货」并回传商城' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 17:38', node: 'C端下单（泡泡玛特企业购）', type: 'sys' },
        { ts: '2026-08-24 17:40', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 17:40', node: '主供缺货，通知操作人确认', type: 'sys' },
        { ts: '2026-08-24 17:52', node: '操作人确认换供：星辰商贸 → 恒通供应链', type: 'human' },
        { ts: '2026-08-24 17:52', node: '主供配货单 PH-A0010013 作废，新配货单 PH-A0020014 下发恒通供应链', type: 'sys' }
      ],
      tracks: {},
      opLogs: [
        { ts: '2026-08-24 17:52', who: '履约调度专员', action: '换供确认', target: 'PH-A0020014', reason: '主供缺货，确认切换备用（恒通供应链）' }
      ]
    },
    {
      mainNo: 'ORD20260825007', mall: '锦程员工福利商城', traceId: 'TRC-20260825-0707',
      customer: { name: '吴磊', phone: '137****3344' },
      orderTime: '2026-08-24 11:10', payTime: '2026-08-24 11:12',
      sales: { paid: 149.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '吴磊', phoneMasked: '137****3344', phoneFull: '13712343344', address: '江苏省苏州市工业园区星湖街 328 号 16 幢 505 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0030015', supplier: '鹏程优品', primary: true, status: 'waiting',
          items: [{ sku: 'HZ-A00013-001-DF', qty: 1 }],
          deadline: '2026-08-25 11:12',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082500701', steps: [
          { ts: '2026-08-24 11:12', type: 'sys', text: '主供指派：鹏程优品（商城·供应商指定）；库存 6,800 充足' },
          { ts: '2026-08-24 11:12', type: 'sys', text: '生成配货单 PH-A0030015 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 11:10', node: 'C端下单（锦程员工福利商城）', type: 'sys' },
        { ts: '2026-08-24 11:12', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 11:12', node: '分单完成，配货单下发鹏程优品', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260825008', mall: '社区公益点', traceId: 'TRC-20260825-0808',
      customer: { name: '郑爽', phone: '139****8877' },
      orderTime: '2026-08-24 06:58', payTime: '2026-08-24 07:00',
      sales: { paid: 299.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '郑爽', phoneMasked: '139****8877', phoneFull: '13912348877', address: '四川省成都市高新区天府三街 199 号 8 栋 1102 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0030024', supplier: '鹏程优品', primary: true, status: 'cancelled',
          items: [{ sku: 'HZ-A00020-001-DF', qty: 1 }],
          deadline: '2026-08-25 07:00',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null,
          cancelNote: '换供作废：鹏程优品 → 恒通供应链（主供缺货，确认切换备用）' },
        { phNo: 'PH-A0020016', supplier: '恒通供应链', primary: false, status: 'waiting',
          items: [{ sku: 'HZ-A00020-001-DF', qty: 1 }],
          deadline: '2026-08-25 07:00',
          express: '', waybills: [],
          afterSale: 'none', abnormal: { level: 'L1', note: '已超时 2 小时，通知责任调度专员', ts: '2026-08-25 09:02' }, reassignedFrom: '鹏程优品' }
      ],
      decisionLogs: [
        { sub: 'ORD2026082500801', steps: [
          { ts: '2026-08-24 07:00', type: 'sys', text: '主供指派：鹏程优品（商城·供应商指定）；查询可售库存不足' },
          { ts: '2026-08-24 07:00', type: 'sys', text: '主供缺货 → 通知操作人（站内 + 企微，30 分钟时限）' },
          { ts: '2026-08-24 07:20', type: 'human', text: '操作人确认切换；备用按三级决策链排序：①供应商等级 恒通供应链（核心）优先' },
          { ts: '2026-08-24 07:20', type: 'sys', text: '主供配货单 PH-A0030024 作废留痕，生成新配货单 PH-A0020016 下发恒通供应链，标记「非主供发货」并回传商城' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 06:58', node: 'C端下单（社区公益点）', type: 'sys' },
        { ts: '2026-08-24 07:00', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 07:00', node: '主供缺货，通知操作人确认', type: 'sys' },
        { ts: '2026-08-24 07:20', node: '操作人确认换供：鹏程优品 → 恒通供应链', type: 'human' },
        { ts: '2026-08-24 07:20', node: '主供配货单 PH-A0030024 作废，新配货单 PH-A0020016 下发恒通供应链', type: 'sys' }
      ],
      tracks: {},
      opLogs: [
        { ts: '2026-08-24 07:20', who: '履约调度专员', action: '换供确认', target: 'PH-A0020016', reason: '主供缺货，确认切换备用（恒通供应链）' },
        { ts: '2026-08-25 09:02', who: '系统', action: '异常升级 L1', target: 'PH-A0020016', reason: '发货超时 2 小时，通知责任调度专员' }
      ]
    },
    {
      mainNo: 'ORD20260823009', mall: '锦程积分商城', traceId: 'TRC-20260823-0909',
      customer: { name: '孙俪', phone: '136****9900' },
      orderTime: '2026-08-23 14:16', payTime: '2026-08-23 14:18',
      sales: { paid: 4000.00, coupon: 200.00, points: 99.00 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '孙俪', phoneMasked: '136****9900', phoneFull: '13612349900', address: '湖北省武汉市洪山区珞喻路 766 号 1 栋 2001 室' },
      subs: [],
      phs: [
        { phNo: 'PH-B0030017', supplier: 'OPPO官方旗舰店', primary: true, status: 'shipped',
          items: [{ sku: 'HZ-B00003-002-DF', qty: 1 }],
          deadline: '2026-08-24 14:18', shipTime: '2026-08-23 16:20',
          express: '顺丰速运', waybills: [{ express: '顺丰速运', no: 'SF88776655443' }],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082300901', steps: [
          { ts: '2026-08-23 14:18', type: 'sys', text: '主供指派：OPPO官方旗舰店（商城·审批指定）；库存充足' },
          { ts: '2026-08-23 14:18', type: 'sys', text: '生成配货单 PH-B0030017 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-23 14:16', node: 'C端下单（锦程积分商城）', type: 'sys' },
        { ts: '2026-08-23 14:18', node: '支付完成（含苏银豆抵扣 ¥99），事件接入供应链', type: 'sys' },
        { ts: '2026-08-23 14:18', node: '分单完成，配货单下发 OPPO官方旗舰店', type: 'sys' },
        { ts: '2026-08-23 16:20', node: '供方回传运单 SF88776655443，已发货并回传商城', type: 'sys' }
      ],
      tracks: { 'SF88776655443': [
        { ts: '2026-08-23 16:15', node: '顺丰速运 已揽收（东莞）' },
        { ts: '2026-08-23 21:33', node: '到达 东莞塘厦集散点' },
        { ts: '2026-08-24 03:15', node: '到达 武汉江夏中转场' },
        { ts: '2026-08-25 08:10', node: '派送中（武汉洪山区）' }
      ] },
      opLogs: []
    },
    {
      mainNo: 'ORD20260822010', mall: '锦程员工福利商城', traceId: 'TRC-20260822-1010',
      customer: { name: '钱进', phone: '138****5566' },
      orderTime: '2026-08-22 09:24', payTime: '2026-08-22 09:26',
      sales: { paid: 359.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '钱进', phoneMasked: '138****5566', phoneFull: '13812345566', address: '安徽省合肥市蜀山区长江西路 299 号 6 幢 304 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010018', supplier: '星辰商贸', primary: true, status: 'signed',
          items: [{ sku: 'HZ-A00018-001-DF', qty: 1 }],
          deadline: '2026-08-23 09:26', shipTime: '2026-08-22 15:40',
          express: '圆通快递', waybills: [{ express: '圆通快递', no: 'YT11881899999' }],
          afterSale: 'return', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082201001', steps: [
          { ts: '2026-08-22 09:26', type: 'sys', text: '主供指派：星辰商贸（商城·供应商指定）；库存充足' },
          { ts: '2026-08-22 09:26', type: 'sys', text: '生成配货单 PH-A0010018 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-22 09:24', node: 'C端下单（锦程员工福利商城）', type: 'sys' },
        { ts: '2026-08-22 09:26', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-22 09:26', node: '分单完成，配货单下发星辰商贸', type: 'sys' },
        { ts: '2026-08-22 15:40', node: '供方回传运单，已发货', type: 'sys' },
        { ts: '2026-08-24 15:10', node: '消费者确认签收，触发对账', type: 'sys' },
        { ts: '2026-08-25 09:15', node: '商城侧换货审核通过；供应链按退货协同，等待退货入库', type: 'sys' }
      ],
      tracks: { 'YT11881899999': [
        { ts: '2026-08-22 15:36', node: '圆通快递 已揽收（上海）' },
        { ts: '2026-08-23 02:20', node: '到达 合肥转运中心' },
        { ts: '2026-08-23 08:02', node: '派送中（合肥蜀山区）' },
        { ts: '2026-08-24 15:10', node: '已签收（本人）' }
      ] },
      opLogs: []
    },
    {
      mainNo: 'ORD20260821011', mall: '泡泡玛特官方商城', traceId: 'TRC-20260821-1111',
      customer: { name: '冯巩', phone: '135****2433' },
      orderTime: '2026-08-21 19:42', payTime: '2026-08-21 19:44',
      sales: { paid: 899.00, coupon: 0, points: 0 },
      remark: '投影仪画面有瑕疵，申请退款',
      dispatchStatus: 'done',
      receiver: { name: '冯巩', phoneMasked: '135****2433', phoneFull: '13512342433', address: '福建省厦门市思明区软件园二期观日路 18 号 601 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0030019', supplier: '鹏程优品', primary: true, status: 'signed',
          items: [{ sku: 'HZ-A00007-001-DF', qty: 1 }],
          deadline: '2026-08-22 19:44', shipTime: '2026-08-22 10:05',
          express: '京东物流', waybills: [{ express: '京东物流', no: 'JD00077766655' }],
          afterSale: 'return', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082101101', steps: [
          { ts: '2026-08-21 19:44', type: 'sys', text: '主供指派：鹏程优品（商城·供应商指定）；库存充足' },
          { ts: '2026-08-21 19:44', type: 'sys', text: '生成配货单 PH-A0030019 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-21 19:42', node: 'C端下单（泡泡玛特官方商城）', type: 'sys' },
        { ts: '2026-08-21 19:44', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-21 19:44', node: '分单完成，配货单下发鹏程优品', type: 'sys' },
        { ts: '2026-08-22 10:05', node: '供方回传运单，已发货', type: 'sys' },
        { ts: '2026-08-23 14:20', node: '消费者签收', type: 'sys' },
        { ts: '2026-08-24 20:11', node: 'C端申请退款，商城审核通过，售后协同中', type: 'sys' }
      ],
      tracks: { 'JD00077766655': [
        { ts: '2026-08-22 10:01', node: '京东物流 已揽收（深圳）' },
        { ts: '2026-08-22 22:14', node: '到达 厦门集散中心' },
        { ts: '2026-08-23 09:30', node: '派送中（厦门思明区）' },
        { ts: '2026-08-23 14:20', node: '已签收（本人）' }
      ] },
      opLogs: []
    },
    {
      mainNo: 'ORD20260820012', mall: '泡泡玛特企业购', traceId: 'TRC-20260820-1212',
      customer: { name: '褚楚', phone: '137****6688' },
      orderTime: '2026-08-20 11:58', payTime: '2026-08-20 12:00',
      sales: { paid: 99.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '褚楚', phoneMasked: '137****6688', phoneFull: '13712346688', address: '山东省青岛市市南区香港中路 76 号 1208 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0040020', supplier: '环球优选', primary: true, status: 'cancelled',
          items: [{ sku: 'HZ-A00016-001-DF', qty: 1 }],
          deadline: '2026-08-21 12:00',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082001201', steps: [
          { ts: '2026-08-20 12:00', type: 'sys', text: '主供指派：环球优选（商城·供应商指定）；库存充足' },
          { ts: '2026-08-20 12:00', type: 'sys', text: '生成配货单 PH-A0040020 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-20 11:58', node: 'C端下单（泡泡玛特企业购）', type: 'sys' },
        { ts: '2026-08-20 12:00', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-20 12:00', node: '分单完成，配货单下发环球优选', type: 'sys' },
        { ts: '2026-08-20 13:05', node: '商城侧发起交易取消，供应链拦截未发货配货单并释放占用库存', type: 'sys' }
      ],
      tracks: {},
      opLogs: [
        { ts: '2026-08-20 13:05', who: '系统（商城指令）', action: '取消配货单', target: 'PH-A0040020', reason: '商城侧交易取消，执行拦截' }
      ]
    },
    {
      mainNo: 'ORD20260817013', mall: '悦享生活精选', traceId: 'TRC-20260817-1313',
      customer: { name: '何雨', phone: '139****1020' },
      orderTime: '2026-08-17 10:20', payTime: '2026-08-17 10:22',
      sales: { paid: 128.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '何雨', phoneMasked: '139****1020', phoneFull: '13912341020', address: '湖南省长沙市岳麓区麓谷大道 658 号西栋 902 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0040021', supplier: '环球优选', primary: true, status: 'closed',
          items: [{ sku: 'HZ-A00021-001-DF', qty: 1 }],
          deadline: '2026-08-18 10:22', shipTime: '2026-08-17 18:22',
          express: '韵达快递', waybills: [{ express: '韵达快递', no: 'YD5566778899' }],
          afterSale: 'done', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026081701301', steps: [
          { ts: '2026-08-17 10:22', type: 'sys', text: '主供指派：环球优选（商城·供应商指定）；库存充足' },
          { ts: '2026-08-17 10:22', type: 'sys', text: '生成配货单 PH-A0040021 下发主供' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-17 10:20', node: 'C端下单（悦享生活精选）', type: 'sys' },
        { ts: '2026-08-17 10:22', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-17 18:22', node: '供方回传运单，已发货', type: 'sys' },
        { ts: '2026-08-18 14:00', node: '消费者签收', type: 'sys' },
        { ts: '2026-08-19 18:20', node: '全额退款完成，配货单置「已关闭」', type: 'sys' }
      ],
      tracks: { 'YD5566778899': [
        { ts: '2026-08-17 18:18', node: '韵达快递 已揽收（上海）' },
        { ts: '2026-08-18 08:44', node: '已签收（长沙）' }
      ] },
      opLogs: []
    },
    {
      mainNo: 'ORD20260824014', mall: '锦程员工福利商城', traceId: 'TRC-20260824-1414',
      customer: { name: '林悦', phone: '138****7799' },
      orderTime: '2026-08-24 18:03', payTime: '2026-08-24 18:05',
      sales: { paid: 365.00, coupon: 0, points: 0 },
      remark: '给孩子的暑期课',
      dispatchStatus: 'done', virtual: true,
      receiver: { name: '林悦', phoneMasked: '138****7799', phoneFull: '13812347799', address: '' },
      subs: [],
      phs: [
        { phNo: 'PH-KM01024', supplier: '数字服务商A', primary: true, status: 'waiting', virtual: true,
          items: [{ sku: 'HZXN-A00001-001-KM', qty: 1 }],
          deadline: '2026-08-25 18:05',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082401401', steps: [
          { ts: '2026-08-24 18:05', type: 'sys', text: '主供指派：数字服务商A（商城·供应商指定）；虚拟商品双通道供货' },
          { ts: '2026-08-24 18:05', type: 'sys', text: '集采卡密池查询：池内无卡 → 自动调用主供接口（同供方切换，非换供）' },
          { ts: '2026-08-24 18:05', type: 'sys', text: '接口下单成功，等待取卡回传' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 18:03', node: 'C端下单（锦程员工福利商城·虚拟商品）', type: 'sys' },
        { ts: '2026-08-24 18:05', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 18:05', node: '集采池空，自动调用主供接口取卡', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260824015', mall: '锦程积分商城', traceId: 'TRC-20260824-1515',
      customer: { name: '罗成', phone: '136****3355' },
      orderTime: '2026-08-24 12:38', payTime: '2026-08-24 12:40',
      sales: { paid: 29.90, coupon: 0, points: 10.00 },
      remark: '',
      dispatchStatus: 'done', combo: { mode: 'combo', spu: 'ZDZH-A00001', sku: 'HZZH-A00001-001-DF', name: '3M防护标准套装', version: '下单时快照' },
      receiver: { name: '罗成', phoneMasked: '136****3355', phoneFull: '13612343355', address: '江苏省南京市雨花台区软件大道 109 号 4 幢 1101 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010022', supplier: '星辰商贸', primary: true, status: 'waiting',
          items: [
            { sku: 'HZ-A00081-001-DF', qty: 1, role: '主件' },
            { sku: 'HZ-A00081-001-DF', qty: 1, role: '配件' }
          ],
          deadline: '2026-08-25 12:40',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null },
        { phNo: 'PH-A0020023', supplier: '恒通供应链', primary: true, status: 'waiting',
          items: [{ sku: 'HZ-A00001-002-DF', qty: 1, role: '配件' }],
          deadline: '2026-08-25 12:40',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082401501', steps: [
          { ts: '2026-08-24 12:40', type: 'sys', text: '组合商品按 BOM 快照（ZDZH-A00001 v3）展开 3 子件，子项级主供独立判定' },
          { ts: '2026-08-24 12:40', type: 'sys', text: '子件1（主件）+ 子件3（配件）同供方星辰商贸 → PH-A0010022' },
          { ts: '2026-08-24 12:40', type: 'sys', text: '子件2（配件）主供：恒通供应链（最低价）→ PH-A0020023；同主订单共用承诺截止时间' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 12:38', node: 'C端下单（锦程积分商城·组合商品）', type: 'sys' },
        { ts: '2026-08-24 12:40', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 12:40', node: 'BOM 快照展开 3 子件（主件/配件），子件库存预占', type: 'sys' },
        { ts: '2026-08-24 12:40', node: '按子件供方拆 2 个配货单下发', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260824016', mall: '锦程员工福利商城', traceId: 'TRC-20260824-1616',
      customer: { name: '周宁', phone: '137****4410' },
      orderTime: '2026-08-24 09:16', payTime: '2026-08-24 09:18',
      sales: { paid: 59.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done', combo: { mode: 'gift', spu: 'ZD-A00001', sku: 'HZZH-A00002-001-DF', name: '3M夏季清凉防护礼包', version: '下单时快照' },
      receiver: { name: '周宁', phoneMasked: '137****4410', phoneFull: '13712344410', address: '江苏省苏州市工业园区星湖街 328 号 2 幢 501 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010028', supplier: '星辰商贸', primary: true, status: 'waiting',
          items: [
            { sku: 'HZ-A00081-001-DF', qty: 1, role: '主件' },
            { sku: 'HZ-A00104-001-DF', qty: 2, role: '赠品' }
          ],
          deadline: '2026-08-25 09:18',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026082401601', steps: [
          { ts: '2026-08-24 09:18', type: 'sys', text: '营销买赠按 BOM 快照（HZZH-A00002-001）展开 主件+赠品，同供方星辰商贸 → PH-A0010028' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 09:16', node: 'C端下单（锦程员工福利商城·营销买赠）', type: 'sys' },
        { ts: '2026-08-24 09:18', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 09:18', node: 'BOM 快照展开主件/赠品，配货单下发', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD202608250016', source: 'manual', mall: '锦程员工福利商城', traceId: 'TRC-20260825-1616',
      customer: { name: '苏晓', phone: '135****0099' },
      orderTime: '2026-08-25 09:20', payTime: null, sales: null,
      remark: '客服通道补录：客户线下复购，无支付环节',
      dispatchStatus: 'done',
      receiver: { name: '苏晓', phoneMasked: '135****0099', phoneFull: '13512340099', address: '江苏省南京市秦淮区夫子庙贡院街 152 号 7 幢 206 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010025', supplier: '星辰商贸', primary: true, status: 'waiting',
          items: [{ sku: 'HZ-A00004-001-DF', qty: 1 }],
          deadline: '2026-08-26 09:20',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'MAN2026082501601', steps: [
          { ts: '2026-08-25 09:20', type: 'human', text: '手动补单创建：操作人指定供方 星辰商贸（人工指定即主供），跳过智能分单与支付' },
          { ts: '2026-08-25 09:20', type: 'sys', text: '生成配货单 PH-A0010025 直接下发；发货时效基准=订单创建时间+24h（2026-08-26 09:20）' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-25 09:20', type: 'human', node: '履约调度专员手动补单创建（指定供方：星辰商贸）' },
        { ts: '2026-08-25 09:20', type: 'sys', node: '配货单 PH-A0010025 下发，跳过支付与智能分单' }
      ],
      tracks: {},
      opLogs: [
        { ts: '2026-08-25 09:20', who: '履约调度专员', action: '手动补单', target: 'ORD202608250016', reason: '客服通道补录：客户线下复购' }
      ]
    },
    {
      mainNo: 'ORD20260824017', mall: '锦程员工福利商城', traceId: 'TRC-20260824-1717',
      customer: { name: '唐宁', phone: '136****4410' },
      orderTime: '2026-08-24 08:18', payTime: '2026-08-24 08:20',
      sales: { paid: 399.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'confirm', confirmProgress: '已通知客服',
      receiver: { name: '唐宁', phoneMasked: '136****4410', phoneFull: '13612344410', address: '江苏省无锡市滨湖区蠡湖大道 2000 号 3 幢 1202 室' },
      subs: [
        { subNo: 'ORD2026082401701', sku: 'HZ-A00011-001-DF', qty: 1, primarySupplier: '恒通供应链', reason: '主供缺货超时未确认，已转客服通道' }
      ],
      phs: [],
      decisionLogs: [
        { sub: 'ORD2026082401701', steps: [
          { ts: '2026-08-24 08:20', type: 'sys', text: '主供指派：恒通供应链（商城·供应商指定）；查询可售库存 0' },
          { ts: '2026-08-24 08:20', type: 'sys', text: '主供彻底无货 → 子项置「主供缺货待确认」；已通知操作人（站内 + 企微，30 分钟时限）' },
          { ts: '2026-08-24 08:50', type: 'sys', text: '超时未确认，默认转客服通道；行内处置进度「已通知客服」' },
          { ts: '2026-08-24 08:50', type: 'human', text: '等待商城客服联系客户协商：接受备用 / 等待补货 / 协助退单' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-24 08:18', node: 'C端下单（锦程员工福利商城）', type: 'sys' },
        { ts: '2026-08-24 08:20', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-24 08:20', node: '主供缺货，通知操作人确认', type: 'sys' },
        { ts: '2026-08-24 08:50', node: '超时未确认，转客服通道', type: 'sys' }
      ],
      tracks: {}, opLogs: []
    },
    {
      mainNo: 'ORD20260819019', mall: '锦程员工福利商城', traceId: 'TRC-20260819-1919',
      customer: { name: '刘畅', phone: '138****2208' },
      orderTime: '2026-08-19 14:10', payTime: '2026-08-19 14:12',
      sales: { paid: 369.00, coupon: 0, points: 0 },
      remark: '',
      dispatchStatus: 'done',
      receiver: { name: '刘畅', phoneMasked: '138****2208', phoneFull: '13812342208', address: '江苏省南京市栖霞区仙林大道 163 号 8 幢 503 室' },
      subs: [],
      phs: [
        { phNo: 'PH-A0010026', supplier: '星辰商贸', primary: true, status: 'signed',
          items: [{ sku: 'HZ-A00018-002-DF', qty: 1, subNo: 'ORD2026081901901' }],
          deadline: '2026-08-20 14:12', shipTime: '2026-08-19 18:40',
          express: '圆通快递', waybills: [{ express: '圆通快递', no: 'YT2200881199' }],
          afterSale: 'done', abnormal: null },
        { phNo: 'PH-A0010027', supplier: '星辰商贸', primary: true, status: 'waiting', reship: true,
          reshipMainNo: 'ORD20260825018',
          items: [{ sku: 'HZ-A00018-002-DF', qty: 1, subNo: 'ORD2026081901901' }],
          deadline: '2026-08-26 09:40', dispatchTime: '2026-08-25 09:40',
          express: '', waybills: [],
          afterSale: 'none', abnormal: null }
      ],
      decisionLogs: [
        { sub: 'ORD2026081901901', steps: [
          { ts: '2026-08-19 14:12', type: 'sys', text: '主供指派：星辰商贸（商城·供应商指定）；库存充足' },
          { ts: '2026-08-19 14:12', type: 'sys', text: '生成配货单 PH-A0010026 下发主供' },
          { ts: '2026-08-25 09:40', type: 'sys', text: '原单退货收货完成；生成补发换货配货单 PH-A0010027，指定原供方星辰商贸，无新支付；子订单号沿用 ORD2026081901901' }
        ] }
      ],
      timeline: [
        { ts: '2026-08-19 14:10', node: 'C端下单（锦程员工福利商城）', type: 'sys' },
        { ts: '2026-08-19 14:12', node: '支付完成，事件接入供应链', type: 'sys' },
        { ts: '2026-08-19 18:40', node: '供方回传运单，已发货', type: 'sys' },
        { ts: '2026-08-21 11:00', node: '消费者签收', type: 'sys' },
        { ts: '2026-08-23 10:20', node: '商城侧换货审核通过；供应链按退货协同收货', type: 'sys' },
        { ts: '2026-08-25 09:30', node: '退货入库完成，原单退货完成', type: 'sys' },
        { ts: '2026-08-25 09:40', node: '补发换货配货单 PH-A0010027 下发星辰商贸（挂原单，子订单号不变）', type: 'sys' }
      ],
      tracks: { 'YT2200881199': [
        { ts: '2026-08-19 18:36', node: '圆通快递 已揽收（上海）' },
        { ts: '2026-08-21 11:00', node: '已签收（本人）' }
      ] },
      opLogs: [
        { ts: '2026-08-25 09:40', who: '系统', action: '生成补发换货配货单', target: 'PH-A0010027', reason: '原单退货完成，子订单号沿用 ORD2026081901901' }
      ]
    }
  ];

  window.SupplyOrderData = {
    NOW: NOW,
    TODAY: TODAY,
    SHIP_PROMISE_HOURS: SHIP_PROMISE_HOURS,
    supplierMap: supplierMap,
    mallOptions: mallOptions,
    dispatchStatusMeta: dispatchStatusMeta,
    phStatusMeta: phStatusMeta,
    afterSaleMeta: afterSaleMeta,
    orders: orders
  };
})();
