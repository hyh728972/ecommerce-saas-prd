/**
 * 电影票次卡静态演示数据（对接接口后可改为请求结果）。
 * @typedef {{ time: string, desc: string, deductLabel: string }} MoviePassUsage
 */

/**
 * @typedef {{
 *   id: string,
 *   listSubtitle: string,
 *   listMeta: string,
 *   status: 'normal'|'exhausted'|'expiring',
 *   name: string,
 *   cardNo: string,
 *   total: number,
 *   used: number,
 *   remain: number,
 *   expireText: string,
 *   creditedAt: string,
 *   scope: string,
 *   statusDetail: string,
 *   desc: string,
 *   usages: MoviePassUsage[],
 *   batchCardName: string,
 *   usageRule: string,
 *   maxSingleUseSpec: string,
 *   maxSingleUseAmountText: string
 * }} MoviePassCard
 */

/** @type {MoviePassCard[]} */
var MOVIE_PASS_CARDS = [
  {
    id: 'mv1',
    listSubtitle: '苏银豆联名 · 尾号 8810',
    listMeta: '剩余 7 次 · 有效期至 2027-04-17',
    status: 'normal',
    name: '苏银豆联名·全国观影次卡',
    batchCardName: '批次 A-2026Q2 苏银豆联名观影卡',
    cardNo: 'MV-2026-04-8810****',
    total: 10,
    used: 3,
    remain: 7,
    expireText: '2027-04-17 23:59',
    creditedAt: '2026-04-18 10:26',
    scope: '合作影院在线选座（以购票页为准）',
    statusDetail: '正常 · C端已到账',
    desc: '当前持有「苏银豆联名·全国观影次卡」，可在合作影院在线选座扣次；有效期至 2027-04-17。',
    usageRule: '限合作影院在线选座使用；须在有效期内使用完毕；不可转让、不可提现；退票成功后次数按平台规则退回。',
    maxSingleUseSpec: '单笔订单最多扣 2 次（按实际出票张数折算，2 张票即扣 2 次）',
    maxSingleUseAmountText: '¥200/单（单笔订单票面合计上限，含服务费以结算页为准）',
    usages: [
      { time: '2026-05-02 19:40', desc: '万达影城（CBD店）·《流浪地球3》·2 张', deductLabel: '扣 2 次' },
      { time: '2026-04-26 14:15', desc: '金逸影城（朝阳店）·《哪吒之魔童闹海》·1 张', deductLabel: '扣 1 次' }
    ]
  },
  {
    id: 'mv2',
    listSubtitle: '活动赠送 · 尾号 2201',
    listMeta: '剩余 0 次 · 2026-08-30 到期',
    status: 'exhausted',
    name: '新客专享·观影 4 次卡',
    batchCardName: '批次 B-2026 新客关怀 4 次卡',
    cardNo: 'MV-2026-03-2201****',
    total: 4,
    used: 4,
    remain: 0,
    expireText: '2026-08-30 23:59',
    creditedAt: '2026-03-01 09:00',
    scope: '指定城市合作影院（以购票页为准）',
    statusDetail: '已用尽',
    desc: '该卡次数已全部使用完毕，仅可查看历史记录；到期后卡片将自动归档。',
    usageRule: '仅首单/新客可领；每自然日最多使用 2 次；到期未用完次数作废；仅限指定城市合作影院。',
    maxSingleUseSpec: '单笔订单最多扣 2 次',
    maxSingleUseAmountText: '¥120/单',
    usages: [
      { time: '2026-04-10 20:10', desc: 'CGV 影城（国贸店）·《飞驰人生3》·1 张', deductLabel: '扣 1 次' },
      { time: '2026-04-02 14:00', desc: 'CGV 影城（国贸店）·《飞驰人生3》·1 张', deductLabel: '扣 1 次' },
      { time: '2026-03-15 16:00', desc: '博纳影城 ·《热辣滚烫》重映 · 1 张', deductLabel: '扣 1 次' },
      { time: '2026-03-15 18:30', desc: '博纳影城 ·《热辣滚烫》重映 · 1 张', deductLabel: '扣 1 次' }
    ]
  },
  {
    id: 'mv4',
    listSubtitle: '老客回馈 · 尾号 6612',
    listMeta: '共 2 次已用尽 · 2026-06-01 到期',
    status: 'exhausted',
    name: '老客回馈·观影 2 次卡',
    batchCardName: '批次 D-2026 老客回馈 2 次卡',
    cardNo: 'MV-2026-01-6612****',
    total: 2,
    used: 2,
    remain: 0,
    expireText: '2026-06-01 23:59',
    creditedAt: '2026-01-10 10:00',
    scope: '同城合作影院（以购票页为准）',
    statusDetail: '已用尽',
    desc: '本卡 2 次已全部扣完，可在下方查看完整扣次详情记录；卡片在有效期内仍可核对信息。',
    usageRule: '同城合作影院适用；须在有效期内使用；过期不可使用；不可与其他优惠叠加（以购票页为准）。',
    maxSingleUseSpec: '单笔订单最多扣 2 次（一场两人票可一次扣完）',
    maxSingleUseAmountText: '¥180/单',
    usages: [
      { time: '2026-03-28 15:20', desc: '卢米埃影城 ·《沙丘 2》·2 张', deductLabel: '扣 2 次' }
    ]
  },
  {
    id: 'mv3',
    listSubtitle: 'VIP 尊享 · 尾号 9902',
    listMeta: '剩余 15 次 · 2026-12-31 到期',
    status: 'expiring',
    name: 'VIP 尊享·全国观影次卡',
    batchCardName: '批次 VIP-2025 尊享卡（含 IMAX）',
    cardNo: 'MV-2025-12-9902****',
    total: 20,
    used: 5,
    remain: 15,
    expireText: '2026-12-31 23:59',
    creditedAt: '2025-12-20 11:18',
    scope: '全国合作影院 IMAX / 普通厅（以购票页为准）',
    statusDetail: '正常 · C端已到账',
    desc: '次数较多，建议在有效期内分批使用；临近到期前系统将推送提醒。',
    usageRule: '全国合作影院通用；IMAX / 特殊厅按页面公示倍数计次；临期请优先使用；不可转赠。',
    maxSingleUseSpec: '单日最多扣 4 次；IMAX 单场最高扣 2 次；普通厅单场最高扣 2 次',
    maxSingleUseAmountText: '¥350/单（IMAX 等特殊厅以购票页折算后为准）',
    usages: [
      { time: '2026-05-01 10:00', desc: '英皇电影城 ·《奥本海默》重映 · 1 张', deductLabel: '扣 1 次' }
    ]
  }
];

/**
 * 按 id 取次卡；无匹配时返回第一张，避免空白页。
 * @param {string} [id]
 * @returns {MoviePassCard}
 */
function getMoviePassCardById(id) {
  if (!id) return MOVIE_PASS_CARDS[0];
  var found = MOVIE_PASS_CARDS.filter(function(c) { return c.id === id; })[0];
  return found || MOVIE_PASS_CARDS[0];
}

/**
 * 是否已用尽（无剩余次数或状态为 exhausted）。
 * @param {MoviePassCard} c
 * @returns {boolean}
 */
function isMoviePassExhausted(c) {
  if (!c) return false;
  if (c.status === 'exhausted') return true;
  return c.remain === 0;
}

/**
 * 是否仍可用（有剩余次数且非仅归档态）。
 * @param {MoviePassCard} c
 * @returns {boolean}
 */
function isMoviePassAvailable(c) {
  return !!c && !isMoviePassExhausted(c);
}

/**
 * 从当前页 URL 读取次卡 id。
 * @returns {string}
 */
function getMoviePassIdFromQuery() {
  return new URLSearchParams(window.location.search).get('id') || '';
}
