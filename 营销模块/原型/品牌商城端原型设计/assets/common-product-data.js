// ============================================================
// 苏银商城 · 在售商品共享数据 (common-product-data.js)
// 各页面统一引用，保证商品名称/编码/价格一致。
//
// 数据模型：SPU(主) → SKU(次) → 渠道(苏银商城)。
// 苏银商城为「分销」商城：
//   price     = 渠道价（平台 ↔ 品牌商城结算价）
//   mallPrice = 商城价（C 端售价，分销模式下高于渠道价）
//   mallPrice / linePrice(划线价) / ecomRefPrice(电商参考价)
//   由文末 normalize 一次性派生，无需手填。
// ============================================================

var productData = [
  { id:'p1', name:'不锈钢保温杯', spu:'S001A00004', type:'physical', supplyPrice:'¥82', totalStock:500, tags:[{label:'热销款',cls:'tag-orange'},{label:'品质优选',cls:'tag-green'}],
    skus:[
      { sku:'S001A00004001', spec:'500ml', channels:[ { ch:'苏银商城', price:'¥99', supplier:'鑫泰商贸', logistics:'顺丰/中通 - 24h', sellable:'on' } ] },
      { sku:'S001A00004002', type:'gift', spec:'不锈钢保温杯500ml + 定制杯套礼盒', displayName:'杯具熊 不锈钢保温杯 感恩礼盒套装', channels:[ { ch:'苏银商城', price:'¥129', supplier:'鑫泰商贸', logistics:'顺丰 - 24h', sellable:'on' } ] },
    ] },
  { id:'p2', name:'男士商务休闲皮鞋', spu:'S001A00006', type:'physical', supplyPrice:'¥100', totalStock:75, tags:[{label:'品质优选',cls:'tag-green'}],
    skus:[
      { sku:'S001A00006001', spec:'黑色42码', channels:[ { ch:'苏银商城', price:'¥88', supplier:'博源供应链', logistics:'顺丰 - 48h', sellable:'on' } ] },
    ] },
  { id:'p3', name:'家庭营养过年礼包', spu:'C001A00001', type:'combo', supplyPrice:'¥73', totalStock:1200, tags:[{label:'新品推荐',cls:'tag-orange'},{label:'员工福利',cls:'tag-green'}],
    skus:[
      { sku:'C001A00001001', spec:'主件(天润 新疆纯牛奶200ml*12)×1 + 搭配件(北大荒 有机黑木耳200g)×1', displayName:'天润 家庭营养过年礼包 组合套装A', channels:[ { ch:'苏银商城', price:'¥99', supplier:'恒通供应链', logistics:'等2个供应商', sellable:'on' } ] },
      { sku:'C001A00001002', spec:'主件(天润 新疆纯牛奶200ml*12)×1 + 搭配件(天润 新疆纯牛奶200ml*12)×1 + 搭配件(北大荒 有机黑木耳200g)×2', displayName:'天润 家庭营养元宵礼包 组合套装B', channels:[ { ch:'苏银商城', price:'¥189', supplier:'恒通供应链', logistics:'等3个供应商', sellable:'on' } ] },
    ] },
  { id:'p4', name:'智能蓝牙体脂秤', spu:'S001A00003', type:'physical', supplyPrice:'¥95', totalStock:270, tags:[{label:'新品上市',cls:'tag-blue'}],
    skus:[
      { sku:'S001A00003001', spec:'白色', channels:[ { ch:'苏银商城', price:'¥129', supplier:'华茂通', logistics:'京东物流 - 48h', sellable:'on' } ] },
    ] },
  { id:'p5', name:'夏季纯棉圆领T恤', spu:'S001A00002', type:'physical', supplyPrice:'¥50', totalStock:0, tags:[{label:'热销款',cls:'tag-orange'},{label:'限时促销',cls:'tag-orange'}],
    skus:[
      { sku:'S001A00002001', spec:'白色 M', channels:[ { ch:'苏银商城', price:'¥45', supplier:'鑫泰商贸', logistics:'中通/圆通 - 24h', sellable:'locked' } ] },
      { sku:'S001A00002002', spec:'黑色 L', channels:[ { ch:'苏银商城', price:'¥45', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'locked' } ] },
    ] },
  { id:'p6', name:'儿童运动跑鞋', spu:'S001A00007', type:'physical', supplyPrice:'¥65', totalStock:463, tags:[{label:'最优性价比',cls:'tag-green'}],
    skus:[
      { sku:'S001A00007001', spec:'28码', channels:[ { ch:'苏银商城', price:'¥58', supplier:'华茂通', logistics:'韵达/中通 - 24h', sellable:'on' } ] },
      { sku:'S001A00007002', spec:'30码', channels:[ { ch:'苏银商城', price:'¥59', supplier:'博源供应链', logistics:'顺丰/中通 - 24h', sellable:'on' } ] },
    ] },
  { id:'p7', name:'女士直筒休闲长裤', spu:'S001A00005', type:'physical', supplyPrice:'¥78', totalStock:230, tags:[{label:'稳定供货',cls:'tag-green'},{label:'品质优选',cls:'tag-green'}],
    skus:[
      { sku:'S001A00005001', spec:'S码', channels:[ { ch:'苏银商城', price:'¥95', supplier:'华茂通', logistics:'韵达/中通 - 24h', sellable:'on' } ] },
    ] },
  { id:'p8', name:'无线降噪耳机', spu:'S001A00008', type:'physical', supplyPrice:'¥220', totalStock:144, tags:[{label:'热销款',cls:'tag-orange'},{label:'品质优选',cls:'tag-green'}],
    skus:[
      { sku:'S001A00008001', spec:'黑色', channels:[ { ch:'苏银商城', price:'¥299', supplier:'鑫泰商贸', logistics:'顺丰 - 24h', sellable:'on' } ] },
    ] },
  { id:'p9', name:'有机绿茶礼盒装', spu:'S001A00009', type:'physical', supplyPrice:'¥68', totalStock:560, tags:[{label:'品质优选',cls:'tag-green'},{label:'产地直供',cls:'tag-green'}],
    skus:[
      { sku:'S001A00009001', spec:'200g', channels:[ { ch:'苏银商城', price:'¥128', supplier:'博源供应链', logistics:'韵达/中通 - 24h', sellable:'on' } ] },
    ] },
  { id:'p10', name:'纳米喷雾补水仪', spu:'S001A00010', type:'physical', supplyPrice:'¥35', totalStock:166, tags:[{label:'限时特惠',cls:'tag-red'}],
    skus:[
      { sku:'S001A00010001', spec:'标准款', channels:[ { ch:'苏银商城', price:'¥72', supplier:'华茂通', logistics:'韵达/中通 - 24h', sellable:'off' } ] },
    ] },
  { id:'p11', name:'折叠旅行背包', spu:'S001A00011', type:'physical', supplyPrice:'¥45', totalStock:0, tags:[{label:'新品上市',cls:'tag-blue'}],
    skus:[
      { sku:'S001A00011001', spec:'20L', channels:[ { ch:'苏银商城', price:'¥79', supplier:'鑫泰商贸', logistics:'中通/圆通 - 48h', sellable:'off' } ] },
    ] },
  { id:'p12', name:'腾讯视频VIP会员季卡', spu:'X001A00001', type:'virtual', supplyPrice:'¥38', totalStock:-1, tags:[{label:'虚拟卡券',cls:'tag-gray'}],
    skus:[
      { sku:'X001A00001001', spec:'季卡', channels:[ { ch:'苏银商城', price:'¥58', supplier:'星辰商贸', logistics:'自动发货 - 即时', sellable:'on' } ] },
    ] },
  { id:'p13', name:'星巴克电子礼品卡', spu:'X001A00002', type:'virtual', supplyPrice:'¥80', totalStock:-1, tags:[{label:'虚拟卡券',cls:'tag-gray'}],
    skus:[
      { sku:'X001A00002001', spec:'面值100元', channels:[ { ch:'苏银商城', price:'¥95', supplier:'华茂通', logistics:'自动发货 - 即时', sellable:'on' } ] },
    ] },
];

var productMetaMap = {
  p1: { brand:'杯具熊', category:'居家生活 > 杯壶水具 > 保温杯' },
  p2: { brand:'奥康', category:'男装 > 鞋靴 > 商务皮鞋' },
  p3: { brand:'天润', category:'食品饮料 > 乳制品 > 牛奶；节日礼盒 > 春节礼盒 > 食品礼包' },
  p4: { brand:'云麦', category:'数码 > 智能健康 > 体脂秤' },
  p5: { brand:'蕉内', category:'男装 > 上装 > T恤；女装 > 上装 > T恤' },
  p6: { brand:'安踏儿童', category:'运动户外 > 童鞋 > 运动跑鞋' },
  p7: { brand:'优衣库', category:'女装 > 下装 > 休闲裤' },
  p8: { brand:'倍思', category:'数码 > 影音娱乐 > 耳机' },
  p9: { brand:'谢裕大', category:'食品饮料 > 茶饮冲调 > 绿茶；节日礼盒 > 春节礼盒 > 食品礼包' },
  p10:{ brand:'金稻', category:'个护美妆 > 美容仪器 > 补水仪' },
  p11:{ brand:'探路者', category:'运动户外 > 户外装备 > 背包' },
  p12:{ brand:'腾讯视频', category:'虚拟卡券 > 视频会员 > 季卡' },
  p13:{ brand:'星巴克', category:'虚拟卡券 > 礼品卡 > 电子卡' },
};

function getProductMeta(p) { return productMetaMap[p.id] || { brand:'—', category:'未分类' }; }
function getDisplayProductName(p) {
  const meta = getProductMeta(p);
  if (!meta.brand || meta.brand === '—' || p.name.indexOf(meta.brand) === 0) return p.name;
  return meta.brand + ' ' + p.name;
}
function getDisplaySkuName(p, sku) {
  if (sku.displayName) return sku.displayName;
  const name = getDisplayProductName(p);
  return sku.spec ? name + ' ' + sku.spec : name;
}

// 渠道模式：苏银商城 = 分销
var channelModeMap = { '苏银商城': 'distribution' };
function isDistributionChannel(channelName) { return channelModeMap[channelName] === 'distribution'; }
function getChannelMode(c) { return isDistributionChannel(c.ch) ? 'distribution' : 'direct'; }
function getMallPrice(c) { return getChannelMode(c) === 'distribution' ? (c.mallPrice || c.price) : c.price; }

// 客户编码映射（部分SKU已映射到客户内部编码，未映射则留空）
var customerCodeMap = {
  'S001A00004001':'JSB-200312',
  'S001A00006001':'JSB-200318',
  'S001A00003001':'JSB-201005',
  'S001A00007001':'JSB-201127',
  'S001A00005001':'JSB-210301',
  'S001A00009001':'JSB-220114',
  'X001A00001001':'JSB-230607',
};

// 一次性派生：客户编码回填、商城价(分销=渠道价×1.15)、划线价、电商参考价
(function () {
  function num(s) { return parseFloat((s || '').replace(/[^0-9.]/g, '')) || 0; }
  function yen(n) { return '¥' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ''); }
  productData.forEach(p => p.skus.forEach(s => {
    if (s.customerCode === undefined) s.customerCode = customerCodeMap[s.sku] || '';
    s.channels.forEach(c => {
      if (getChannelMode(c) === 'distribution' && c.mallPrice === undefined) c.mallPrice = yen(num(c.price) * 1.15);
      if (!c.linePrice) c.linePrice = yen(num(getMallPrice(c)) + 30);
      if (!c.ecomRefPrice) c.ecomRefPrice = yen(num(c.price) + 20);
    });
  }));
})();
