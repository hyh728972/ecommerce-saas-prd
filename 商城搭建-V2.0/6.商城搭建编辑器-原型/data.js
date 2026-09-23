/**
 * 商城搭建系统 - 原型演示用 mock 数据
 */

/** @type {Array<{id: string, name: string, status: 'draft'|'published'|'pushed', terminal: 'mp'|'pc', tags: string[], updatedAt: string, useCount: number}>} */
const MOCK_TEMPLATES = [
  { id: 'pc1', name: 'PC 美妆旗舰首页', status: 'published', terminal: 'pc', tags: ['美妆'], updatedAt: '2025-03-15 16:20', useCount: 8 },
  { id: 't1', name: '美妆小程序标准店', status: 'pushed', terminal: 'mp', tags: ['美妆', '618大促'], updatedAt: '2025-03-15 14:30', useCount: 12 },
  { id: 'pc7', name: 'PC 美妆专柜楼层页', status: 'pushed', terminal: 'pc', tags: ['美妆', '618大促'], updatedAt: '2025-03-15 11:00', useCount: 6 },
  { id: 't2', name: '生鲜到家首页', status: 'published', terminal: 'mp', tags: ['食品'], updatedAt: '2025-03-14 10:00', useCount: 3 },
  { id: 'pc2', name: 'PC 食品生鲜频道', status: 'draft', terminal: 'pc', tags: ['食品'], updatedAt: '2025-03-14 11:30', useCount: 0 },
  { id: 'pc3', name: 'PC 服饰大促会场', status: 'pushed', terminal: 'pc', tags: ['服饰', '618大促'], updatedAt: '2025-03-13 09:45', useCount: 14 },
  { id: 't3', name: '服饰穿搭分类页', status: 'draft', terminal: 'mp', tags: ['服饰'], updatedAt: '2025-03-13 16:45', useCount: 0 },
  { id: 'pc8', name: 'PC 服饰搭配专题', status: 'published', terminal: 'pc', tags: ['服饰'], updatedAt: '2025-03-13 08:20', useCount: 4 },
  { id: 't4', name: '618大促会场页', status: 'pushed', terminal: 'mp', tags: ['618大促'], updatedAt: '2025-03-12 09:20', useCount: 28 },
  { id: 'pc4', name: 'PC 通用品牌馆', status: 'published', terminal: 'pc', tags: ['美妆', '服饰'], updatedAt: '2025-03-12 14:10', useCount: 5 },
  { id: 'pc9', name: 'PC 新客礼包落地页', status: 'draft', terminal: 'pc', tags: ['美妆'], updatedAt: '2025-03-12 10:05', useCount: 0 },
  { id: 't5', name: '新品首发闪购页', status: 'draft', terminal: 'mp', tags: ['美妆'], updatedAt: '2025-03-11 11:00', useCount: 0 },
  { id: 'pc5', name: 'PC 会员日活动页', status: 'draft', terminal: 'pc', tags: ['美妆'], updatedAt: '2025-03-11 18:00', useCount: 0 },
  { id: 't6', name: '双11服饰主会场', status: 'published', terminal: 'mp', tags: ['服饰', '618大促'], updatedAt: '2025-03-10 09:00', useCount: 5 },
  { id: 'pc6', name: 'PC 618 主会场', status: 'pushed', terminal: 'pc', tags: ['618大促'], updatedAt: '2025-03-10 10:25', useCount: 22 },
  { id: 'pc10', name: 'PC 双11服饰主会场', status: 'published', terminal: 'pc', tags: ['服饰', '618大促'], updatedAt: '2025-03-10 08:40', useCount: 9 },
  { id: 't7', name: '食品限时秒杀页', status: 'draft', terminal: 'mp', tags: ['食品'], updatedAt: '2025-03-09 15:20', useCount: 0 },
  { id: 't8', name: '品牌馆双列集合', status: 'published', terminal: 'mp', tags: ['美妆', '服饰'], updatedAt: '2025-03-08 18:10', useCount: 7 },
  { id: 't9', name: '新客专享礼包页', status: 'draft', terminal: 'mp', tags: ['美妆'], updatedAt: '2025-03-07 13:40', useCount: 0 },
  { id: 't10', name: '会员日打卡活动', status: 'pushed', terminal: 'mp', tags: ['美妆'], updatedAt: '2025-03-06 19:30', useCount: 15 },
  { id: 't11', name: '服饰联名营销页', status: 'published', terminal: 'mp', tags: ['服饰'], updatedAt: '2025-03-05 10:15', useCount: 2 },
];

/** @deprecated 已合并入 MOCK_TEMPLATES，保留空数组避免旧引用报错 */
const MOCK_PC_TEMPLATES = [];

/** @type {Array<{id: string, name: string}>} */
const MOCK_BRANDS = [
  { id: 'b1', name: '品牌A - 美妆' },
  { id: 'b2', name: '品牌B - 食品' },
  { id: 'b3', name: '品牌C - 服饰' },
  { id: 'b4', name: '品牌D - 美妆' },
  { id: 'b5', name: '品牌E - 综合' },
];

/** @type {Array<{id: string, templateName: string, brands: string, pushType: string, operator: string, time: string, brandStatus: string}>} */
const MOCK_PUSH_RECORDS = [
  { id: 'p1', templateName: '美妆小程序标准店', brands: '品牌A、品牌D', pushType: '模板', operator: 'ops@platform.com', time: '2025-03-15 14:35', brandStatus: '已上线' },
  { id: 'p2', templateName: '618大促会场页', brands: '品牌E', pushType: '模板', operator: 'ops@platform.com', time: '2025-03-14 11:00', brandStatus: '已接收' },
  { id: 'p3', templateName: '618大促会场页', brands: '品牌B、品牌C', pushType: '模板', operator: 'admin@platform.com', time: '2025-03-12 09:25', brandStatus: '已上线' },
];

/** @type {Array<{id: string, name: string, pageCount: number}>} */
const MOCK_CHANNEL_MALLS = [
  { id: 'cm1', name: '华夏-银行', pageCount: 6 },
  { id: 'cm522', name: '522品牌商城', pageCount: 5 },
  { id: 'cmtest', name: '测试商城A', pageCount: 4 },
  { id: 'cm2', name: '品牌A美妆旗舰店', pageCount: 4 },
  { id: 'cm3', name: '品牌B食品商城', pageCount: 5 },
  { id: 'cm4', name: '品牌E综合商城', pageCount: 3 },
];

/** @type {Array<{id: string, name: string, defaultChecked: boolean}>} */
const MOCK_BUILD_PAGES = [
  { id: 'home', name: '首页', defaultChecked: true },
  { id: 'category', name: '分类', defaultChecked: true },
  { id: 'mine', name: '我的', defaultChecked: true },
  { id: 'cart', name: '购物车', defaultChecked: false },
  { id: 'activity', name: '活动页', defaultChecked: false },
  { id: 'member', name: '会员中心', defaultChecked: false },
];

/** @type {Array<{id: string, name: string}>} */
const MOCK_PUSH_CHANNELS = [
  { id: 'ch1', name: '华夏-银行' },
  { id: 'ch2', name: '522品牌商城' },
  { id: 'ch3', name: '测试商城A' },
];

/** @type {Array<{id: string, appId: string, pushName: string, channelIds: string[], channelNames: string[], channelCount: number, operator: string, pushedAt: string}>} */
const MOCK_APP_PUSH_RECORDS = [
  {
    id: 'pr1',
    appId: 'a1',
    pushName: '华夏银行专属应用',
    channelIds: ['ch2'],
    channelNames: ['522品牌商城'],
    channelCount: 1,
    operator: 'admin',
    pushedAt: '2026-06-02 12:00:00',
  },
];

/** @type {Array<{id: string, name: string, status: 'published'|'draft', terminal: 'mp'|'pc', sourceChannel: string, sourceMallId?: string, updatedAt: string, previewTags?: string[], pushTargets?: string[], pushConfig?: object}>} */
const MOCK_APPS = [
  {
    id: 'a1',
    name: '华夏银行美妆小程序',
    status: 'published',
    terminal: 'mp',
    sourceChannel: '华夏-银行',
    sourceMallId: 'cm1',
    updatedAt: '2026-06-02 11:20:00',
    previewTags: ['美妆', '618大促'],
    pushTargets: ['522品牌商城'],
    pushConfig: {
      pageMode: 'custom',
      pageIds: ['home', 'category', 'mine', 'cart'],
      copyProducts: true,
      priceMode: 'supplier',
      priceCoeff: 1.2,
      pushChannelMode: 'custom',
      pushChannelIds: ['ch2'],
    },
  },
  {
    id: 'a2',
    name: '522服饰穿搭小程序',
    status: 'draft',
    terminal: 'mp',
    sourceChannel: '522品牌商城',
    sourceMallId: 'cm522',
    updatedAt: '2026-06-01 09:15:00',
    previewTags: ['服饰'],
    pushConfig: {
      pageMode: 'all',
      pageIds: ['home', 'category', 'mine', 'cart', 'activity'],
      copyProducts: true,
      priceMode: 'default',
      priceCoeff: 1.2,
      pushChannelMode: 'custom',
      pushChannelIds: ['ch2'],
    },
  },
  { id: 'a3', name: '测试商城生鲜到家', status: 'published', terminal: 'mp', sourceChannel: '测试商城A', sourceMallId: 'cmtest', updatedAt: '2025-03-13 09:20:00', previewTags: ['食品'] },
  { id: 'a4', name: '品牌D 618大促应用', status: 'published', terminal: 'mp', sourceChannel: '522品牌商城', sourceMallId: 'cm522', updatedAt: '2025-03-12 16:00:00', previewTags: ['服饰', '618大促'] },
  { id: 'a5', name: '新客礼包引流应用', status: 'draft', terminal: 'mp', sourceChannel: '华夏-银行', sourceMallId: 'cm1', updatedAt: '2025-03-10 10:15:00', previewTags: ['美妆'] },
  { id: 'pa1', name: '华夏银行 PC 旗舰店', status: 'published', terminal: 'pc', sourceChannel: '华夏-银行', sourceMallId: 'cm1', updatedAt: '2026-06-02 14:10:00', previewTags: ['美妆'] },
  { id: 'pa2', name: '522服饰 PC 品牌馆', status: 'draft', terminal: 'pc', sourceChannel: '522品牌商城', sourceMallId: 'cm522', updatedAt: '2026-06-01 16:40:00', previewTags: ['服饰'] },
  { id: 'pa3', name: '测试商城 PC 生鲜频道', status: 'published', terminal: 'pc', sourceChannel: '测试商城A', sourceMallId: 'cmtest', updatedAt: '2025-03-14 11:00:00', previewTags: ['食品'] },
  { id: 'pa4', name: '品牌D PC 618会场', status: 'published', terminal: 'pc', sourceChannel: '522品牌商城', sourceMallId: 'cm522', updatedAt: '2025-03-12 18:20:00', previewTags: ['服饰', '618大促'] },
  { id: 'pa5', name: '新客礼包 PC 落地页', status: 'draft', terminal: 'pc', sourceChannel: '华夏-银行', sourceMallId: 'cm1', updatedAt: '2025-03-11 09:30:00', previewTags: ['美妆'] },
];

/** @type {Array<{id: string, name: string, status: 'published'|'draft', terminals: Array<'mp'|'pc'>, sourceChannel: string, sourceMallId?: string, updatedAt: string, previewTags?: string[]}>} */
const MOCK_MULTI_APPS = [
  { id: 'ma1', name: '华夏银行双端旗舰店', status: 'published', terminals: ['mp', 'pc'], sourceChannel: '华夏-银行', sourceMallId: 'cm1', updatedAt: '2026-06-03 10:00:00', previewTags: ['美妆'] },
  { id: 'ma2', name: '522服饰双端品牌馆', status: 'draft', terminals: ['mp', 'pc'], sourceChannel: '522品牌商城', sourceMallId: 'cm522', updatedAt: '2026-06-02 15:20:00', previewTags: ['服饰'] },
  { id: 'ma3', name: '618 双端主会场应用', status: 'published', terminals: ['mp', 'pc'], sourceChannel: '522品牌商城', sourceMallId: 'cm522', updatedAt: '2025-03-15 09:40:00', previewTags: ['618大促'] },
];

/**
 * 每个模板下的页面列表，用于模拟「页面管理」中间页
 * key 为模板 id，value 为页面数组
 * type: home | category | activity | mine | product-detail
 * @type {Record<string, Array<{id: string, title: string, type: 'home'|'category'|'activity'|'mine'|'product-detail', status: 'draft'|'published', updatedAt: string}>>}
 */
const MOCK_TEMPLATE_PAGES = {
  t1: [
    { id: 'p-t1-1', title: '首页（默认）', type: 'home', status: 'published', updatedAt: '2026-01-08 08:41:26' },
    { id: 'p-t1-2', title: '会员专区页', type: 'home', status: 'draft', updatedAt: '2025-12-20 17:31:03' },
    { id: 'p-t1-3', title: '新年主视觉海报', type: 'activity', status: 'published', updatedAt: '2025-12-01 10:00:00' },
    { id: 'p-t1-4', title: '品牌故事文章页', type: 'activity', status: 'draft', updatedAt: '2025-11-20 09:30:00' },
    { id: 'p-t1-5', title: '我的 - 会员中心', type: 'mine', status: 'draft', updatedAt: '2025-11-18 13:20:00' },
    { id: 'p-t1-6', title: '商品详情 - 标准版', type: 'product-detail', status: 'draft', updatedAt: '2025-11-16 10:10:00' },
  ],
  t2: [
    { id: 'p-t2-1', title: '食品频道首页', type: 'home', status: 'published', updatedAt: '2025-03-14 10:00:00' },
    { id: 'p-t2-2', title: '今日秒杀海报', type: 'activity', status: 'draft', updatedAt: '2025-03-13 20:00:00' },
    { id: 'p-t2-3', title: '我的 - 订单列表', type: 'mine', status: 'draft', updatedAt: '2025-03-13 12:05:00' },
  ],
  t3: [
    { id: 'p-t3-1', title: '服饰列表页', type: 'category', status: 'draft', updatedAt: '2025-03-13 16:45:00' },
    { id: 'p-t3-2', title: '商品详情 - 服饰版', type: 'product-detail', status: 'draft', updatedAt: '2025-03-13 16:50:00' },
  ],
  t4: [
    { id: 'p-t4-1', title: '大促主会场', type: 'home', status: 'published', updatedAt: '2025-03-12 09:20:00' },
    { id: 'p-t4-2', title: '会场子页面 - 会玩专区', type: 'home', status: 'draft', updatedAt: '2025-03-11 18:05:00' },
    { id: 'p-t4-3', title: '会场主 KV 海报', type: 'activity', status: 'published', updatedAt: '2025-03-10 12:00:00' },
    { id: 'p-t4-4', title: '活动页 - 福利专区', type: 'activity', status: 'draft', updatedAt: '2025-03-10 09:10:00' },
  ],
};
