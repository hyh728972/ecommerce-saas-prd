/**
 * 商城搭建系统 - 原型演示用 mock 数据
 */

/** 当前商城商品状态（使用带数据模板时校验上架商品） */
const CURRENT_MALL_PRODUCT_STATUS = {
  hasOnShelfProducts: true,
  onShelfCount: 3,
};

/** @type {Array<{id: string, name: string, status: 'draft'|'published'|'pushed', terminal: 'mp'|'pc', tags: string[], updatedAt: string, useCount: number, hasProducts?: boolean, pushConfig?: {copyProducts: boolean, priceMode: 'default'|'supplier', priceCoeff: number, pageNames: string[]}}>} */
const MOCK_TEMPLATES = [
  {
    id: 't1',
    name: '美妆品牌标准店',
    status: 'pushed',
    terminal: 'mp',
    tags: ['美妆', '618大促'],
    updatedAt: '2025-03-16 14:30',
    useCount: 12,
    hasProducts: true,
    pushConfig: {
      copyProducts: true,
      priceMode: 'default',
      priceCoeff: 1.2,
      pageNames: ['首页（默认）', '会员专区页', '新年主视觉海报', '我的 - 会员中心'],
    },
  },
  {
    id: 'pc1',
    name: '美妆旗舰首页',
    status: 'published',
    terminal: 'pc',
    tags: ['美妆'],
    updatedAt: '2025-03-16 11:20',
    useCount: 8,
    hasProducts: true,
    pushConfig: {
      copyProducts: true,
      priceMode: 'default',
      priceCoeff: 1.2,
      pageNames: ['首页', '品牌馆', '会员中心'],
    },
  },
  { id: 't2', name: '食品生鲜首页', status: 'published', terminal: 'mp', tags: ['食品'], updatedAt: '2025-03-15 10:00', useCount: 3 },
  { id: 'pc2', name: '食品生鲜频道', status: 'published', terminal: 'pc', tags: ['食品'], updatedAt: '2025-03-15 09:30', useCount: 4 },
  { id: 't3', name: '服饰类目模板', status: 'draft', terminal: 'mp', tags: ['服饰'], updatedAt: '2025-03-14 16:45', useCount: 0 },
  {
    id: 't4',
    name: '通用促销落地页',
    status: 'pushed',
    terminal: 'mp',
    tags: ['618大促'],
    updatedAt: '2025-03-14 09:20',
    useCount: 28,
    hasProducts: true,
    pushConfig: {
      copyProducts: true,
      priceMode: 'supplier',
      priceCoeff: 1.15,
      pageNames: ['大促主会场', '会场主 KV 海报', '活动页 - 福利专区'],
    },
  },
  {
    id: 'pc3',
    name: '服饰大促会场',
    status: 'pushed',
    terminal: 'pc',
    tags: ['服饰', '618大促'],
    updatedAt: '2025-03-13 18:45',
    useCount: 14,
    hasProducts: true,
    pushConfig: {
      copyProducts: true,
      priceMode: 'supplier',
      priceCoeff: 1.1,
      pageNames: ['大促主会场', '服饰频道', '会场楼层'],
    },
  },
  { id: 't5', name: '新品首发布局', status: 'draft', terminal: 'mp', tags: ['美妆'], updatedAt: '2025-03-13 11:00', useCount: 0 },
  { id: 't6', name: '双11大促主会场', status: 'published', terminal: 'mp', tags: ['服饰', '618大促'], updatedAt: '2025-03-12 09:00', useCount: 5 },
  { id: 'pc4', name: '通用品牌馆', status: 'published', terminal: 'pc', tags: ['美妆', '服饰'], updatedAt: '2025-03-12 14:10', useCount: 5 },
  { id: 't7', name: '食品秒杀专题页', status: 'draft', terminal: 'mp', tags: ['食品'], updatedAt: '2025-03-11 15:20', useCount: 0 },
  { id: 't8', name: '品牌馆集合页', status: 'published', terminal: 'mp', tags: ['美妆', '服饰'], updatedAt: '2025-03-10 18:10', useCount: 7 },
  { id: 't9', name: '新客专享礼包页', status: 'draft', terminal: 'mp', tags: ['美妆'], updatedAt: '2025-03-09 13:40', useCount: 0 },
  {
    id: 't10',
    name: '会员日活动页',
    status: 'pushed',
    terminal: 'mp',
    tags: ['美妆'],
    updatedAt: '2025-03-08 19:30',
    useCount: 15,
    hasProducts: true,
    pushConfig: {
      copyProducts: true,
      priceMode: 'default',
      priceCoeff: 1.2,
      pageNames: ['首页（默认）', '会员专区页'],
    },
  },
  { id: 't11', name: '品牌联合营销页', status: 'published', terminal: 'mp', tags: ['服饰'], updatedAt: '2025-03-07 10:15', useCount: 2 },
  {
    id: 'pc5',
    name: '618 主会场',
    status: 'pushed',
    terminal: 'pc',
    tags: ['618大促'],
    updatedAt: '2025-03-07 16:25',
    useCount: 22,
    hasProducts: true,
    pushConfig: {
      copyProducts: true,
      priceMode: 'default',
      priceCoeff: 1.2,
      pageNames: ['主会场', '分会场', '会场楼层'],
    },
  },
];

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
  { id: 'p1', templateName: '美妆品牌标准店', brands: '品牌A、品牌D', pushType: '模板', operator: 'ops@platform.com', time: '2025-03-15 14:35', brandStatus: '已上线' },
  { id: 'p2', templateName: '通用促销落地页', brands: '品牌E', pushType: '模板', operator: 'ops@platform.com', time: '2025-03-14 11:00', brandStatus: '已接收' },
  { id: 'p3', templateName: '通用促销落地页', brands: '品牌B、品牌C', pushType: '模板', operator: 'admin@platform.com', time: '2025-03-12 09:25', brandStatus: '已上线' },
];

/**
 * 我的应用 Mock 数据
 * status 规则：同一时刻最多只有一个 `published`
 * mode: single=单端应用，multi=多端应用
 * @type {Array<{id: string, name: string, brandName: string, templateId: string, status: 'draft'|'published', mode: 'single'|'multi', terminal?: 'mp'|'pc', createdAt: string}>}
 */
const MOCK_MALLS = [
  { id: 'm1', name: '品牌A美妆旗舰店', brandName: '品牌A - 美妆', templateId: 't1', status: 'published', mode: 'single', terminal: 'mp', createdAt: '2025-03-15 14:35' },
  { id: 'm2', name: '品牌B食品商城', brandName: '品牌B - 食品', templateId: 't2', status: 'draft', mode: 'single', terminal: 'mp', createdAt: '2025-03-14 11:00' },
  { id: 'm3', name: '品牌C服饰官方店', brandName: '品牌C - 服饰', templateId: 't6', status: 'draft', mode: 'single', terminal: 'mp', createdAt: '2025-03-13 09:20' },
  { id: 'm4', name: '品牌D美妆专营店', brandName: '品牌D - 美妆', templateId: 't8', status: 'draft', mode: 'single', terminal: 'mp', createdAt: '2025-03-12 16:00' },
  { id: 'm5', name: '品牌E综合商城', brandName: '品牌E - 综合', templateId: 't11', status: 'draft', mode: 'single', terminal: 'mp', createdAt: '2025-03-10 10:15' },
  { id: 'm6', name: '美妆品牌标准店', brandName: '品牌A - 美妆', templateId: 't10', status: 'draft', mode: 'single', terminal: 'mp', createdAt: '2025-03-08 18:30' },
  { id: 'm7', name: '食品生鲜直营店', brandName: '品牌B - 食品', templateId: 't2', status: 'draft', mode: 'single', terminal: 'mp', createdAt: '2025-03-05 14:00' },
  { id: 'm8', name: '美妆旗舰店', brandName: '品牌A - 美妆', templateId: 'pc1', status: 'draft', mode: 'single', terminal: 'pc', createdAt: '2025-03-16 10:00' },
  { id: 'm9', name: '服饰品牌馆', brandName: '品牌C - 服饰', templateId: 'pc4', status: 'draft', mode: 'single', terminal: 'pc', createdAt: '2025-03-15 09:30' },
  { id: 'm10', name: '食品生鲜频道', brandName: '品牌B - 食品', templateId: 'pc2', status: 'draft', mode: 'single', terminal: 'pc', createdAt: '2025-03-14 16:20' },
  { id: 'ma1', name: '品牌A双端旗舰店', brandName: '品牌A - 美妆', templateId: 't1', status: 'draft', mode: 'multi', createdAt: '2025-03-16 11:20' },
  { id: 'ma2', name: '品牌C双端服饰馆', brandName: '品牌C - 服饰', templateId: 't6', status: 'draft', mode: 'multi', createdAt: '2025-03-15 15:40' },
  { id: 'ma3', name: '品牌B双端生鲜店', brandName: '品牌B - 食品', templateId: 't2', status: 'draft', mode: 'multi', createdAt: '2025-03-14 08:50' },
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

/** 营销弹窗 - 投放页面选项 */
const POPUP_DELIVERY_PAGE_LABELS = {
  home: '首页',
  category: '分类页',
  cart: '购物车',
  mine: '我的',
};

/** 营销弹窗 - 跳转目标选项（按跳转行为分组） */
const POPUP_JUMP_TARGETS = {
  activity: [
    { value: 'act-main', label: '大促主会场' },
    { value: 'act-welfare', label: '活动页 - 福利专区' },
    { value: 'act-member', label: '会员专区页' },
    { value: 'act-newcomer', label: '新人大礼包活动' },
    { value: 'act-season', label: '换季清仓专场' },
    { value: 'act-brand', label: '品牌联盟日' },
    { value: 'act-flash', label: '限时闪购专场' },
    { value: 'act-points', label: '积分兑换活动' },
  ],
  product: [
    { value: 'prod-001', label: '精华液套装 - 商品详情' },
    { value: 'prod-002', label: '面膜礼盒 - 商品详情' },
    { value: 'prod-003', label: '限时秒杀商品 - 商品详情' },
  ],
};

/** 营销弹窗 - 商品搜索列表 */
const MOCK_PRODUCT_LIST = [
  { value: 'prod-001', label: '精华液套装', spu: 'SPU10001', price: '299.00', thumb: 'linear-gradient(135deg, #ff6b6b 0%, #ff9f7f 100%)' },
  { value: 'prod-002', label: '面膜礼盒', spu: 'SPU10002', price: '159.00', thumb: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' },
  { value: 'prod-003', label: '限时秒杀商品', spu: 'SPU10003', price: '99.00', thumb: 'linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)' },
  { value: 'prod-004', label: '氨基酸洁面乳', spu: 'SPU10004', price: '89.00', thumb: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' },
  { value: 'prod-005', label: '保湿修护面霜', spu: 'SPU10005', price: '199.00', thumb: 'linear-gradient(135deg, #9254de 0%, #c792ea 100%)' },
  { value: 'prod-006', label: '防晒隔离乳 SPF50+', spu: 'SPU10006', price: '129.00', thumb: 'linear-gradient(135deg, #eb2f96 0%, #ff85c0 100%)' },
  { value: 'prod-007', label: '胶原蛋白眼霜', spu: 'SPU10007', price: '259.00', thumb: 'linear-gradient(135deg, #13c2c2 0%, #5cdbd3 100%)' },
  { value: 'prod-008', label: '玫瑰精油身体乳', spu: 'SPU10008', price: '79.00', thumb: 'linear-gradient(135deg, #f759ab 0%, #ffadd2 100%)' },
  { value: 'prod-009', label: '男士控油洁面啫喱', spu: 'SPU10009', price: '69.00', thumb: 'linear-gradient(135deg, #2f54eb 0%, #85a5ff 100%)' },
  { value: 'prod-010', label: '焕亮精华面膜', spu: 'SPU10010', price: '149.00', thumb: 'linear-gradient(135deg, #fa541c 0%, #ffbb96 100%)' },
];

/** 目标用户 - 用户搜索列表 */
const MOCK_USER_LIST = [
  { id: 'uid-001', name: '张明远', phone: '138****1234', avatar: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' },
  { id: 'uid-002', name: '李芳华', phone: '139****5678', avatar: 'linear-gradient(135deg, #ff6b6b 0%, #ff9f7f 100%)' },
  { id: 'uid-003', name: '王思远', phone: '150****9012', avatar: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' },
  { id: 'uid-004', name: '赵雪琳', phone: '186****3456', avatar: 'linear-gradient(135deg, #9254de 0%, #c792ea 100%)' },
  { id: 'uid-005', name: '陈建国', phone: '137****7890', avatar: 'linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)' },
  { id: 'uid-006', name: '刘雨桐', phone: '159****2345', avatar: 'linear-gradient(135deg, #13c2c2 0%, #5cdbd3 100%)' },
  { id: 'uid-007', name: '周志强', phone: '188****6789', avatar: 'linear-gradient(135deg, #eb2f96 0%, #ff85c0 100%)' },
  { id: 'uid-008', name: '吴小雅', phone: '131****0123', avatar: 'linear-gradient(135deg, #2f54eb 0%, #85a5ff 100%)' },
  { id: 'uid-009', name: '孙浩然', phone: '155****4567', avatar: 'linear-gradient(135deg, #fa541c 0%, #ffbb96 100%)' },
  { id: 'uid-010', name: '郑雅文', phone: '176****8901', avatar: 'linear-gradient(135deg, #f759ab 0%, #ffadd2 100%)' },
  { id: 'uid-011', name: '唐俊杰', phone: '133****2345', avatar: 'linear-gradient(135deg, #08979c 0%, #5cdbd3 100%)' },
  { id: 'uid-012', name: '黄丽丽', phone: '158****6789', avatar: 'linear-gradient(135deg, #7c3aed 0%, #c4b5fd 100%)' },
];

/**
 * 素材库 Mock 数据
 * @type {Array<{id: string, name: string, thumb: string}>}
 */
const MOCK_MATERIAL_IMAGES = [
  { id: 'mat1', name: '618 大促主视觉', thumb: 'linear-gradient(135deg, #ff6b6b 0%, #ff9f7f 100%)' },
  { id: 'mat2', name: '新客礼包弹窗', thumb: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' },
  { id: 'mat3', name: '会员日专属', thumb: 'linear-gradient(135deg, #9254de 0%, #c792ea 100%)' },
  { id: 'mat4', name: '限时秒杀', thumb: 'linear-gradient(135deg, #fa8c16 0%, #ffc53d 100%)' },
  { id: 'mat5', name: '品牌联合推广', thumb: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' },
  { id: 'mat6', name: '满减活动', thumb: 'linear-gradient(135deg, #eb2f96 0%, #ff85c0 100%)' },
];

/**
 * 营销弹窗 Mock 数据
 * @type {Array<Object>}
 */
const MOCK_MARKETING_POPUPS = [
  {
    id: 'pop1',
    name: '618 大促领券弹窗',
    timeStart: '2025-06-01T00:00',
    timeEnd: '2025-06-18T23:59',
    deliveryPages: ['home', 'category'],
    jumpBehavior: 'activity',
    jumpTarget: 'act-main',
    jumpPageLabel: '大促主会场',
    trigger: 'enter',
    triggerDelay: 3,
    triggerBehavior: null,
    browseSeconds: null,
    frequency: 'daily',
    targetUser: 'all',
    targetUserIds: '',
    closeOverlay: true,
    closeButton: true,
    closeCountdown: false,
    closeSeconds: 5,
    imageSource: 'library',
    materialId: 'mat1',
    imageName: '618 大促主视觉',
    status: 'active',
    updatedAt: '2025-06-10 14:30',
  },
  {
    id: 'pop2',
    name: '新客首单礼包',
    timeStart: '2025-06-15T00:00',
    timeEnd: '2025-07-15T23:59',
    deliveryPages: ['home', 'mine'],
    jumpBehavior: 'activity',
    jumpTarget: 'act-welfare',
    jumpPageLabel: '活动页 - 福利专区',
    trigger: 'enter',
    triggerDelay: null,
    triggerBehavior: null,
    browseSeconds: null,
    frequency: 'first',
    targetUser: 'new',
    targetUserIds: '',
    closeOverlay: true,
    closeButton: true,
    closeCountdown: true,
    closeSeconds: 8,
    imageSource: 'library',
    materialId: 'mat2',
    imageName: '新客礼包弹窗',
    status: 'scheduled',
    updatedAt: '2025-06-12 09:00',
  },
  {
    id: 'pop3',
    name: '浏览商品推荐弹窗',
    timeStart: '2025-05-01T00:00',
    timeEnd: '2025-05-31T23:59',
    deliveryPages: ['home', 'category'],
    jumpBehavior: 'product',
    jumpTarget: 'prod-001',
    jumpPageLabel: '精华液套装 - 商品详情',
    trigger: 'behavior',
    triggerDelay: null,
    triggerBehavior: 'browse',
    browseSeconds: 15,
    frequency: 'weekly',
    targetUser: 'old',
    targetUserIds: '',
    closeOverlay: false,
    closeButton: true,
    closeCountdown: false,
    closeSeconds: 5,
    imageSource: 'library',
    materialId: 'mat3',
    imageName: '会员日专属',
    status: 'ended',
    updatedAt: '2025-05-28 16:20',
  },
  {
    id: 'pop4',
    name: '加购挽留弹窗',
    timeStart: '2025-06-20T00:00',
    timeEnd: '2025-06-30T23:59',
    deliveryPages: ['cart', 'home'],
    jumpBehavior: 'activity',
    jumpTarget: 'act-welfare',
    jumpPageLabel: '活动页 - 福利专区',
    trigger: 'behavior',
    triggerDelay: null,
    triggerBehavior: 'add_cart',
    browseSeconds: null,
    frequency: 'every',
    targetUser: 'specific',
    targetUserIds: '10001,10002,10003',
    closeOverlay: true,
    closeButton: true,
    closeCountdown: true,
    closeSeconds: 10,
    imageSource: 'library',
    materialId: 'mat4',
    imageName: '限时秒杀',
    status: 'draft',
    updatedAt: '2025-06-14 11:45',
  },
];
