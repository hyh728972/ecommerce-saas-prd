/**
 * database.js — 模拟后端数据库
 *
 * 说明:
 * - 顶层 const 声明:跨 <script> 可见,但不挂到 window —— 数据库不直接暴露给页面,
 *   页面一律通过 api.js 的 MallAPI 接口取数(前后端分离语义)
 * - 真实系统:此处为服务端数据库,数据经 HTTP 接口返回
 * - 数据基准:01.供应链商品池 主数据;各页冲突值已按主数据统一
 *   (供应商体系:星辰商贸/恒通供应链/鹏程优品/环球优选/数字服务商A/B)
 *
 * 主流程数据谱系(建库围绕的商品流转链路,各表按此串联而非独立成表):
 *   供应链同步 → supplyProducts 商品池(主数据唯一存一份,含一品多商跟卖行)
 *     → selectionItems 选品清单条目(引用 supplySku,只存清单态)
 *       → 定价推品(02a,取数经 localStorage 会话) → channelProducts 渠道商品(supplySpu 关联主数据)
 *   流程中的异常选品 → pendingData 待处理选品(引用供应链 SKU 编码)
 *
 * 命名规范(DB 初始化末尾统一盖章派生字段):
 *   SPU名称 spuName = 品牌 + 产品名称 + 型号(品牌/型号与名称重复时去重)
 *   SKU名称 skuName = spuName + 规格
 */

const MallDB = {

  // ============================================================
  // 表:供应链商品池 SKU(主数据)
  // 履约支持标记:一件代发 = 实物 SKU 带 -DF 履约后缀(组合/买赠仅支持一件代发);集采直发 = 实物商品行级 jc:true;虚拟(-KM/-ZC)不分履约链路,两池均显示(池内展示编码仅实物 -DF 行转 -JC 后缀)
  // 一品多商口径:不同供应商的同款申报 = 各自独立 SPU/SKU(中段流水号不同,商品名语序可不同),经 sameGroup(同款组,SKU级=同款同规格)关联,参考 E.关联商品管理
  // ============================================================
  supplyProducts: [
    { id:101, name:'3M KN95口罩 9001V', model:'9001V', spec:'白色,常规', spu:'ZD-A00081', sku:'HZ-A00081-001-DF', sameGroup:'SG-MASK-001', jc:true, jcPrice:'¥15.80', jcMoq:100, type:'physical', catL3:'劳保用品 > 防护口罩 > KN95口罩', brand:'3M', supplier:'星辰商贸', tags:[0,2,4], supplyPrice:'¥17.50', ecomPrice:'¥39.90', stock:5000, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2025-06-20 08:30', preferred:true },
    { id:102, name:'3M 9001V KN95口罩', model:'9001V', spec:'白色,常规', spu:'ZD-A00001', sku:'HZ-A00001-002-DF', sameGroup:'SG-MASK-001', jc:true, jcPrice:'¥15.20', jcMoq:100, type:'physical', catL3:'劳保用品 > 防护口罩 > KN95口罩', brand:'3M', supplier:'恒通供应链', tags:[0,4], supplyPrice:'¥16.80', ecomPrice:'¥36.90', stock:8000, shipping:'京东物流', logisticsNote:'48h内发货', createdAt:'2025-06-21 14:20' },
    { id:103, name:'OPPO Find X8', model:'Find X8', spec:'星野黑,12+256GB', spu:'ZD-B00003', sku:'HZ-B00003-001-DF', jc:true, jcPrice:'¥3,850.00', jcMoq:10, type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'OPPO', supplier:'OPPO官方旗舰店', tags:[0,1,2], supplyPrice:'¥3,999.00', ecomPrice:'¥4,299.00', stock:500, shipping:'顺丰', logisticsNote:'1天内发货', createdAt:'2025-06-25 09:00', preferred:true },
    { id:104, name:'不锈钢保温杯500ml', model:'CUP-330', spec:'银色,500ml', spu:'ZD-A00004', sku:'HZ-A00004-001-DF', jc:true, jcPrice:'¥31.00', jcMoq:60, type:'physical', catL3:'家居 > 杯具 > 保温杯', brand:'富光', supplier:'星辰商贸', tags:[2,3], supplyPrice:'¥34.50', ecomPrice:'¥68.00', stock:5200, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-01-10 16:00' },
    { id:105, name:'加厚保暖羽绒服', model:'DOWN-401', spec:'黑色,M', spu:'ZD-A00008', sku:'HZ-A00008-001-DF', jc:true, jcPrice:'¥165.00', jcMoq:30, type:'physical', catL3:'男装 > 外套 > 羽绒服', brand:'波司登', supplier:'环球优选', tags:[0,5], supplyPrice:'¥180.00', ecomPrice:'¥359.00', stock:320, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-05-20 11:45' },
    { id:106, name:'男士商务休闲皮鞋', model:'SHOE-552', spec:'黑色,41码', spu:'ZD-A00006', sku:'HZ-A00006-001-DF', type:'physical', catL3:'鞋靴 > 男鞋 > 商务鞋', brand:'奥康', supplier:'恒通供应链', tags:[2,4], supplyPrice:'¥100.00', ecomPrice:'¥259.00', stock:0, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-02-28 08:30' },
    { id:107, name:'4K超清智能投影仪', model:'PROJ-120', spec:'标准版', spu:'ZD-A00007', sku:'HZ-A00007-001-DF', type:'physical', catL3:'数码 > 投影设备 > 智能投影仪', brand:'极米', supplier:'鹏程优品', tags:[0,1,2], supplyPrice:'¥520.00', ecomPrice:'¥899.00', stock:156, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-01 13:00', preferred:true },
    { id:108, name:'在线教育VIP年卡', model:'EDU-VIP-12M', spec:'12个月', spu:'ZDXN-A00001', sku:'HZXN-A00001-001-KM', type:'virtual', catL3:'虚拟商品 > 教育 > 会员卡', brand:'学而思', supplier:'数字服务商A', tags:[1,5], supplyPrice:'¥199.00', ecomPrice:'¥365.00', stock:-1, shipping:'自动发货', logisticsNote:'即时到账', createdAt:'2025-04-18 10:00' },
    { id:109, name:'视频平台会员季卡', model:'VIDEO-VIP-3M', spec:'季卡', spu:'ZDXN-A00002', sku:'HZXN-A00002-001-ZC', type:'virtual', catL3:'虚拟商品 > 影音娱乐 > 会员卡', brand:'腾讯视频', supplier:'数字服务商B', tags:[5], supplyPrice:'¥45.00', ecomPrice:'¥78.00', stock:-1, shipping:'自动发货', logisticsNote:'即时到账', createdAt:'2025-04-20 15:30' },
    { id:110, name:'云存储空间1TB/年', model:'CLOUD-1T-Y', spec:'1TB', spu:'ZDXN-A00003', sku:'HZXN-A00003-001-ZC', type:'virtual', catL3:'虚拟商品 > 云服务 > 存储', brand:'阿里云', supplier:'数字服务商A', tags:[2,3], supplyPrice:'¥88.00', ecomPrice:'¥158.00', stock:-1, shipping:'自动开通', logisticsNote:'即时生效', createdAt:'2025-03-05 09:00' },
    { id:111, name:'无线降噪蓝牙耳机', model:'BUD-990', spec:'黑色', spu:'ZD-A00010', sku:'HZ-A00010-001-DF', jc:true, jcPrice:'¥122.00', jcMoq:50, type:'physical', catL3:'数码 > 音频设备 > 蓝牙耳机', brand:'漫步者', supplier:'星辰商贸', tags:[0,2,4], supplyPrice:'¥135.00', ecomPrice:'¥269.00', stock:4320, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-05-10 14:15' },
    { id:112, name:'电子书阅读器青春版', model:'EREAD-7', spec:'黑色,6英寸', spu:'ZD-A00011', sku:'HZ-A00011-001-DF', type:'physical', catL3:'数码 > 阅读设备 > 电子书', brand:'掌阅', supplier:'恒通供应链', tags:[1,3], supplyPrice:'¥220.00', ecomPrice:'¥399.00', stock:0, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-05-15 10:45' },
    { id:113, name:'户外防水冲锋衣', model:'JKT-880', spec:'藏青,L', spu:'ZD-A00012', sku:'HZ-A00012-001-DF', jc:true, jcPrice:'¥238.00', jcMoq:20, type:'physical', catL3:'男装 > 外套 > 冲锋衣', brand:'探路者', supplier:'环球优选', tags:[0,3,4], supplyPrice:'¥260.00', ecomPrice:'¥499.00', stock:1200, shipping:'顺丰/京东', logisticsNote:'24h内发货', createdAt:'2025-06-05 16:30' },
    { id:114, name:'女士防晒皮肤衣', model:'UV-335', spec:'樱花粉,均码', spu:'ZD-A00013', sku:'HZ-A00013-001-DF', type:'physical', catL3:'女装 > 外套 > 防晒衣', brand:'蕉下', supplier:'鹏程优品', tags:[0,1], supplyPrice:'¥72.00', ecomPrice:'¥149.00', stock:6800, shipping:'中通/韵达', logisticsNote:'24h内发货', createdAt:'2025-06-12 08:00' },
    { id:115, name:'智能手表GT4', model:'WATCH-GT4', spec:'46mm,幻夜黑', spu:'ZD-A00014', sku:'HZ-A00014-001-DF', type:'physical', catL3:'数码 > 穿戴设备 > 智能手表', brand:'华为', supplier:'星辰商贸', tags:[0,1,2], supplyPrice:'¥680.00', ecomPrice:'¥1288.00', stock:450, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-18 11:20' },
    { id:116, name:'有机山茶油500ml', model:'OIL-021', spec:'500ml', spu:'ZD-A00015', sku:'HZ-A00015-001-DF', sameGroup:'SG-OIL-001', jc:true, jcPrice:'¥25.50', jcMoq:200, type:'physical', catL3:'家居 > 食品 > 食用油', brand:'金龙鱼', supplier:'恒通供应链', tags:[3,4], supplyPrice:'¥28.00', ecomPrice:'¥59.00', stock:15000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-02-10 09:45' },
    { id:117, name:'电子礼品卡100元', model:'GIFT-100', spec:'100元面值', spu:'ZDXN-A00004', sku:'HZXN-A00004-001-KM', type:'virtual', catL3:'虚拟商品 > 礼品卡 > 电子卡', brand:'京东', supplier:'数字服务商B', tags:[5], supplyPrice:'¥90.00', ecomPrice:'¥100.00', stock:-1, shipping:'自动发放', logisticsNote:'即时到账', createdAt:'2025-03-22 13:30' },
    { id:118, name:'男士速干运动短裤', model:'SHORT-662', spec:'黑色,XL', spu:'ZD-A00016', sku:'HZ-A00016-001-DF', type:'physical', catL3:'男装 > 裤子 > 运动裤', brand:'安踏', supplier:'环球优选', tags:[0,3], supplyPrice:'¥48.00', ecomPrice:'¥99.00', stock:3800, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-05-28 10:00' },
    { id:119, name:'家用空气净化器', model:'AIR-P300', spec:'白色', spu:'ZD-A00017', sku:'HZ-A00017-001-DF', type:'physical', catL3:'家居 > 电器 > 净化器', brand:'美的', supplier:'鹏程优品', tags:[0,1,4], supplyPrice:'¥420.00', ecomPrice:'¥799.00', stock:0, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-08 15:00' },
    { id:120, name:'真皮手提商务包', model:'BAG-881', spec:'黑色', spu:'ZD-A00018', sku:'HZ-A00018-001-DF', jc:true, jcPrice:'¥160.00', jcMoq:20, type:'physical', catL3:'鞋靴 > 箱包 > 商务包', brand:'金利来', supplier:'星辰商贸', tags:[2,3,4], supplyPrice:'¥175.00', ecomPrice:'¥359.00', stock:560, shipping:'顺丰/京东', logisticsNote:'24h内发货', createdAt:'2025-04-25 14:00' },
    { id:121, name:'音乐平台会员年卡', model:'MUSIC-VIP-Y', spec:'年卡', spu:'ZDXN-A00005', sku:'HZXN-A00005-001-ZC', type:'virtual', catL3:'虚拟商品 > 影音娱乐 > 会员卡', brand:'网易云音乐', supplier:'数字服务商A', tags:[5], supplyPrice:'¥68.00', ecomPrice:'¥128.00', stock:-1, shipping:'自动发货', logisticsNote:'即时到账', createdAt:'2025-04-28 11:00' },
    { id:122, name:'女士帆布休闲鞋', model:'CANVAS-112', spec:'白色,37码', spu:'ZD-A00019', sku:'HZ-A00019-001-DF', jc:true, jcPrice:'¥34.50', jcMoq:80, type:'physical', catL3:'鞋靴 > 女鞋 > 帆布鞋', brand:'回力', supplier:'恒通供应链', tags:[0,2,3], supplyPrice:'¥38.00', ecomPrice:'¥79.00', stock:9600, shipping:'中通/韵达', logisticsNote:'24h内发货', createdAt:'2025-03-18 08:30' },
    { id:123, name:'便携式蓝牙音箱', model:'SPK-550', spec:'黑色', spu:'ZD-A00020', sku:'HZ-A00020-001-DF', type:'physical', catL3:'数码 > 音频设备 > 蓝牙音箱', brand:'JBL', supplier:'鹏程优品', tags:[0,1,5], supplyPrice:'¥155.00', ecomPrice:'¥299.00', stock:780, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-15 16:00' },
    { id:124, name:'有机绿茶礼盒装', model:'TEA-200', spec:'250g礼盒', spu:'ZD-A00021', sku:'HZ-A00021-001-DF', jc:true, jcPrice:'¥51.00', jcMoq:50, type:'physical', catL3:'家居 > 食品 > 茶叶', brand:'八马', supplier:'环球优选', tags:[2,4], supplyPrice:'¥56.00', ecomPrice:'¥128.00', stock:3400, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-03-30 09:30' },
    { id:125, name:'儿童防蓝光眼镜', model:'GLASS-K01', spec:'蓝,通用', spu:'ZD-A00022', sku:'HZ-A00022-001-DF', type:'physical', catL3:'家居 > 眼镜 > 防蓝光镜', brand:'可得', supplier:'星辰商贸', tags:[1,4], supplyPrice:'¥62.00', ecomPrice:'¥139.00', stock:2100, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-05-05 10:15' },
    // SKU variants — 丰富案例
    { id:126, name:'不锈钢保温杯500ml', model:'CUP-330', spec:'黑色,500ml', spu:'ZD-A00004', sku:'HZ-A00004-002-DF', jc:true, jcPrice:'¥32.50', jcMoq:60, type:'physical', catL3:'家居 > 杯具 > 保温杯', brand:'富光', supplier:'星辰商贸', tags:[2,3], supplyPrice:'¥36.00', ecomPrice:'¥72.00', stock:3100, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-01-12 09:00' },
    { id:127, name:'不锈钢保温杯500ml', model:'CUP-330', spec:'白色,500ml', spu:'ZD-A00091', sku:'HZ-A00091-001-DF', jc:true, jcPrice:'¥30.00', jcMoq:60, type:'physical', catL3:'家居 > 杯具 > 保温杯', brand:'富光', supplier:'鹏程优品', tags:[3], supplyPrice:'¥33.00', ecomPrice:'¥65.00', stock:1800, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-02-20 14:30' },
    { id:128, name:'加厚保暖羽绒服', model:'DOWN-401', spec:'黑色,L', spu:'ZD-A00008', sku:'HZ-A00008-002-DF', type:'physical', catL3:'男装 > 外套 > 羽绒服', brand:'波司登', supplier:'环球优选', tags:[0,5], supplyPrice:'¥190.00', ecomPrice:'¥379.00', stock:180, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-05-22 08:20' },
    { id:129, name:'加厚保暖羽绒服', model:'DOWN-401', spec:'黑色,XL', spu:'ZD-A00092', sku:'HZ-A00092-001-DF', jc:true, jcPrice:'¥160.00', jcMoq:30, type:'physical', catL3:'男装 > 外套 > 羽绒服', brand:'波司登', supplier:'恒通供应链', tags:[0], supplyPrice:'¥175.00', ecomPrice:'¥349.00', stock:250, shipping:'顺丰/京东', logisticsNote:'24h内发货', createdAt:'2025-06-01 16:10' },
    { id:130, name:'加厚保暖羽绒服', model:'DOWN-401', spec:'藏青,XXL', spu:'ZD-A00008', sku:'HZ-A00008-004-DF', type:'physical', catL3:'男装 > 外套 > 羽绒服', brand:'波司登', supplier:'环球优选', tags:[5], supplyPrice:'¥200.00', ecomPrice:'¥399.00', stock:95, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-10 11:00' },
    { id:131, name:'OPPO Find X8', spec:'漫步云端,12+256GB', model:'Find X8', spu:'ZD-B00003', sku:'HZ-B00003-002-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'OPPO', supplier:'OPPO官方旗舰店', tags:[0,1], supplyPrice:'¥3,999.00', ecomPrice:'¥4,299.00', stock:320, shipping:'顺丰', logisticsNote:'1天内发货', createdAt:'2025-06-25 14:00' },
    { id:132, name:'OPPO Find X8', spec:'星野黑,16+256GB', model:'Find X8', spu:'ZD-B00003', sku:'HZ-B00003-003-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'OPPO', supplier:'OPPO官方旗舰店', tags:[0,1,2], supplyPrice:'¥4,599.00', ecomPrice:'¥4,999.00', stock:200, shipping:'顺丰', logisticsNote:'2天内发货', createdAt:'2025-06-26 10:30', preferred:true },
    { id:141, name:'OPPO Find X8', spec:'漫步云端,16+512GB', model:'Find X8', spu:'ZD-B00003', sku:'HZ-B00003-004-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'OPPO', supplier:'OPPO官方旗舰店', tags:[0,1], supplyPrice:'¥4,599.00', ecomPrice:'¥4,999.00', stock:150, shipping:'顺丰', logisticsNote:'2天内发货', createdAt:'2025-06-26 16:00' },
    { id:142, name:'OPPO Find X8', spec:'星野黑,16+1TB', model:'Find X8', spu:'ZD-B00003', sku:'HZ-B00003-005-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'OPPO', supplier:'OPPO官方旗舰店', tags:[0], supplyPrice:'¥5,299.00', ecomPrice:'¥5,999.00', stock:80, shipping:'顺丰', logisticsNote:'3天内发货', createdAt:'2025-06-27 08:00', preferred:true },
    { id:133, name:'无线降噪蓝牙耳机', model:'BUD-990', spec:'白色', spu:'ZD-A00010', sku:'HZ-A00010-002-DF', sameGroup:'SG-BUD-001', type:'physical', catL3:'数码 > 音频设备 > 蓝牙耳机', brand:'漫步者', supplier:'星辰商贸', tags:[0,2], supplyPrice:'¥140.00', ecomPrice:'¥279.00', stock:2100, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-05-12 09:00' },
    { id:134, name:'无线降噪蓝牙耳机', model:'BUD-990', spec:'白色', spu:'ZD-A00082', sku:'HZ-A00082-001-DF', sameGroup:'SG-BUD-001', type:'physical', catL3:'数码 > 音频设备 > 蓝牙耳机', brand:'漫步者', supplier:'鹏程优品', tags:[2,4], supplyPrice:'¥128.00', ecomPrice:'¥259.00', stock:890, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-05-18 14:20' },
    { id:135, name:'无线降噪蓝牙耳机', model:'BUD-990', spec:'蓝色', spu:'ZD-A00010', sku:'HZ-A00010-004-DF', type:'physical', catL3:'数码 > 音频设备 > 蓝牙耳机', brand:'漫步者', supplier:'星辰商贸', tags:[0,4], supplyPrice:'¥145.00', ecomPrice:'¥289.00', stock:560, shipping:'中通/京东', logisticsNote:'24h内发货', createdAt:'2025-06-05 16:30', preferred:true },
    { id:136, name:'4K超清智能投影仪', model:'PROJ-120', spec:'Pro增强版', spu:'ZD-A00093', sku:'HZ-A00093-001-DF', type:'physical', catL3:'数码 > 投影设备 > 智能投影仪', brand:'极米', supplier:'恒通供应链', tags:[0,1,2], supplyPrice:'¥580.00', ecomPrice:'¥999.00', stock:88, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-05 11:30', preferred:true },
    { id:137, name:'男士商务休闲皮鞋', model:'SHOE-552', spec:'棕色,42码', spu:'ZD-A00094', sku:'HZ-A00094-001-DF', type:'physical', catL3:'鞋靴 > 男鞋 > 商务鞋', brand:'奥康', supplier:'星辰商贸', tags:[2,4], supplyPrice:'¥105.00', ecomPrice:'¥269.00', stock:350, shipping:'顺丰', logisticsNote:'24h内发货', createdAt:'2025-03-05 15:00', preferred:true },
    { id:138, name:'男士商务休闲皮鞋', model:'SHOE-552', spec:'棕色,43码', spu:'ZD-A00006', sku:'HZ-A00006-003-DF', type:'physical', catL3:'鞋靴 > 男鞋 > 商务鞋', brand:'奥康', supplier:'恒通供应链', tags:[4], supplyPrice:'¥98.00', ecomPrice:'¥249.00', stock:120, shipping:'京东物流', logisticsNote:'48h内发货', createdAt:'2025-03-08 09:30' },
    { id:139, name:'真皮手提商务包', model:'BAG-881', spec:'棕色', spu:'ZD-A00018', sku:'HZ-A00018-002-DF', type:'physical', catL3:'鞋靴 > 箱包 > 商务包', brand:'金利来', supplier:'星辰商贸', tags:[2,3,4], supplyPrice:'¥180.00', ecomPrice:'¥369.00', stock:280, shipping:'顺丰/京东', logisticsNote:'24h内发货', createdAt:'2025-04-28 10:00', preferred:true },
    { id:140, name:'家用空气净化器', model:'AIR-P300', spec:'灰色', spu:'ZD-A00095', sku:'HZ-A00095-001-DF', type:'physical', catL3:'家居 > 电器 > 净化器', brand:'美的', supplier:'环球优选', tags:[0,1], supplyPrice:'¥430.00', ecomPrice:'¥829.00', stock:180, shipping:'顺丰', logisticsNote:'48h内发货', createdAt:'2025-06-10 10:00' },
    { id:201, name:"3M防护标准套装", model:"COMBO-001", spec:"标准套装", spu:"ZDZH-A00001", sku:"HZZH-A00001-001", type:"combo", catL3:"劳保用品 > 防护口罩 > KN95口罩", brand:"3M", supplier:"星辰商贸", tags:[0,2], supplyPrice:"¥51.80", ecomPrice:"¥39.90", stock:1200, comboComponents:[{role:"主件",qty:1,name:"3M KN95口罩 9001V（白色常规）"},{role:"配件",qty:1,name:"3M KN95口罩 9001V（白色常规）"},{role:"配件",qty:1,name:"3M 9001V KN95口罩（蓝色常规）"}], shipping:"顺丰/中通", logisticsNote:"24h内发货", createdAt:"2026-06-20 10:00", preferred:true },
    { id:202, name:"夏季清凉防护礼包", model:"GIFT-001", spec:"买赠:3M口罩+赠品×3", spu:"ZD-A00001", sku:"HZZH-A00002-001", type:"gift", catL3:"劳保用品 > 防护口罩 > KN95口罩", brand:"3M", supplier:"恒通供应链", tags:[0], supplyPrice:"¥28.50", ecomPrice:"¥59.00", stock:800, shipping:"京东物流", logisticsNote:"48h内发货", createdAt:"2026-06-22 14:30", comboComponents:[{role:"主件",qty:1,name:"3M 9001V KN95口罩"},{role:"赠品",qty:2,name:"舒肤佳湿巾 80抽"}] },
  { id:203, name:'COLMO 天镜系列挂机空调 KFR-35GW/N1A1 1.5匹', model:'KFR-35GW/N1A1', spec:'陨石黑,1.5匹', spu:'ZD-A00043', sku:'HZ-A00043-001-DF', type:'physical', catL3:'家电 > 大家电 > 空调', brand:'美的', supplier:'美的制冷设备有限公司', tags:[], supplyPrice:'¥3299.00', ecomPrice:'¥4599.00', stock:300, shipping:'德邦/京东', logisticsNote:'48h内发货', createdAt:'2026-03-12 10:20', preferred:false, spuName:'美的 COLMO 天镜系列挂机空调 KFR-35GW/N1A1 1.5匹', skuName:'美的 COLMO 天镜系列挂机空调 KFR-35GW/N1A1 1.5匹 陨石黑,1.5匹' },
  { id:204, name:'小天鹅 滚筒洗衣机 TG100V88WMUIADY 10kg', model:'TG100V88WMUIADY', spec:'银灰色,10kg', spu:'ZD-A00044', sku:'HZ-A00044-001-DF', type:'physical', catL3:'家电 > 大家电 > 洗衣机', brand:'美的', supplier:'小天鹅电器有限公司', tags:[], supplyPrice:'¥2599.00', ecomPrice:'¥3699.00', stock:500, shipping:'德邦/京东', logisticsNote:'48h内发货', createdAt:'2026-03-18 14:05', preferred:false, spuName:'美的 小天鹅 滚筒洗衣机 TG100V88WMUIADY 10kg', skuName:'美的 小天鹅 滚筒洗衣机 TG100V88WMUIADY 10kg 银灰色,10kg' },
  { id:205, name:'华凌 新一级能效挂机空调 KFR-26GW/N8HA1 大1匹', model:'KFR-26GW/N8HA1', spec:'白色,大1匹', spu:'ZD-A00045', sku:'HZ-A00045-001-DF', type:'physical', catL3:'家电 > 大家电 > 空调', brand:'美的', supplier:'京东物流', tags:[], supplyPrice:'¥1899.00', ecomPrice:'¥2699.00', stock:800, shipping:'中通/圆通', logisticsNote:'48h内发货', createdAt:'2026-03-25 09:40', preferred:false, spuName:'美的 华凌 新一级能效挂机空调 KFR-26GW/N8HA1 大1匹', skuName:'美的 华凌 新一级能效挂机空调 KFR-26GW/N8HA1 大1匹 白色,大1匹' },
  { id:206, name:'卡萨帝 原石系列冰箱 BCD-500WLCU48WU1 500L', model:'BCD-500WLCU48WU1', spec:'星岩灰,500L', spu:'ZD-A00046', sku:'HZ-A00046-001-DF', type:'physical', catL3:'家电 > 大家电 > 冰箱', brand:'海尔', supplier:'海尔供应链', tags:[], supplyPrice:'¥8999.00', ecomPrice:'¥12999.00', stock:120, shipping:'德邦/日日顺', logisticsNote:'72h内发货', createdAt:'2026-04-02 11:30', preferred:false, spuName:'海尔 卡萨帝 原石系列冰箱 BCD-500WLCU48WU1 500L', skuName:'海尔 卡萨帝 原石系列冰箱 BCD-500WLCU48WU1 500L 星岩灰,500L' },
  { id:207, name:'Leader 统帅两门冰箱 BCD-218LSTCU1 218L', model:'BCD-218LSTCU1', spec:'白色,218L', spu:'ZD-A00023', sku:'HZ-A00023-001-DF', type:'physical', catL3:'家电 > 大家电 > 冰箱', brand:'海尔', supplier:'京东物流', tags:[], supplyPrice:'¥1399.00', ecomPrice:'¥1999.00', stock:600, shipping:'中通/圆通', logisticsNote:'48h内发货', createdAt:'2026-04-10 15:20', preferred:false, spuName:'海尔 Leader 统帅两门冰箱 BCD-218LSTCU1 218L', skuName:'海尔 Leader 统帅两门冰箱 BCD-218LSTCU1 218L 白色,218L' },
  { id:208, name:'Redmi Note14 5G智能手机 8GB+256GB', model:'Note14', spec:'子夜黑,8GB+256GB', spu:'ZD-A00024', sku:'HZ-A00024-001-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'小米', supplier:'顺丰供应链', tags:[], supplyPrice:'¥899.00', ecomPrice:'¥1299.00', stock:2000, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-04-18 10:10', preferred:false, spuName:'小米 Redmi Note14 5G智能手机 8GB+256GB', skuName:'小米 Redmi Note14 5G智能手机 8GB+256GB 子夜黑,8GB+256GB' },
  { id:209, name:'米家扫地机器人 S20+ 扫拖一体', model:'S20+', spec:'白色,扫拖一体', spu:'ZD-A00025', sku:'HZ-A00025-001-DF', type:'physical', catL3:'家居 > 电器 > 智能清洁', brand:'小米', supplier:'菜鸟供应链', tags:[], supplyPrice:'¥1299.00', ecomPrice:'¥1799.00', stock:800, shipping:'中通/圆通', logisticsNote:'48h内发货', createdAt:'2026-04-26 16:45', preferred:false, spuName:'小米 米家扫地机器人 S20+ 扫拖一体', skuName:'小米 米家扫地机器人 S20+ 扫拖一体 白色,扫拖一体' },
  { id:210, name:'格力 Free家中央空调 FGR5Pd/C1Na 5匹一拖四', model:'FGR5Pd/C1Na', spec:'白色,5匹一拖四', spu:'ZD-A00026', sku:'HZ-A00026-001-DF', type:'physical', catL3:'家电 > 大家电 > 中央空调', brand:'格力', supplier:'格力供应链', tags:[], supplyPrice:'¥12999.00', ecomPrice:'¥17999.00', stock:60, shipping:'德邦/日日顺', logisticsNote:'72h内发货', createdAt:'2026-05-06 09:15', preferred:false, spuName:'格力 Free家中央空调 FGR5Pd/C1Na 5匹一拖四', skuName:'格力 Free家中央空调 FGR5Pd/C1Na 5匹一拖四 白色,5匹一拖四' },
  { id:211, name:'晶弘 对开门冰箱 BCD-451WPUA 451L', model:'BCD-451WPUA', spec:'流沙金,451L', spu:'ZD-A00027', sku:'HZ-A00027-001-DF', type:'physical', catL3:'家电 > 大家电 > 冰箱', brand:'格力', supplier:'格力供应链', tags:[], supplyPrice:'¥2899.00', ecomPrice:'¥3999.00', stock:200, shipping:'德邦/日日顺', logisticsNote:'48h内发货', createdAt:'2026-05-14 13:50', preferred:false, spuName:'格力 晶弘 对开门冰箱 BCD-451WPUA 451L', skuName:'格力 晶弘 对开门冰箱 BCD-451WPUA 451L 流沙金,451L' },
  { id:212, name:'华为 Mate70 Pro智能手机 12GB+512GB', model:'Mate70 Pro', spec:'曜金黑,12GB+512GB', spu:'ZD-A00028', sku:'HZ-A00028-001-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'华为', supplier:'华为终端供应链', tags:[], supplyPrice:'¥6499.00', ecomPrice:'¥7999.00', stock:400, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-05-22 10:30', preferred:false, spuName:'华为 Mate70 Pro智能手机 12GB+512GB', skuName:'华为 Mate70 Pro智能手机 12GB+512GB 曜金黑,12GB+512GB' },
  { id:213, name:'海飞丝 经典去屑洗发水 750ml×2瓶', model:'经典去屑', spec:'750ml×2瓶', spu:'ZD-A00029', sku:'HZ-A00029-001-DF', type:'physical', catL3:'个护美妆 > 洗发护发 > 洗发水', brand:'宝洁', supplier:'宝洁中国供应链', tags:[], supplyPrice:'¥59.00', ecomPrice:'¥99.00', stock:5000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-05-30 09:00', preferred:false, spuName:'宝洁 海飞丝 经典去屑洗发水 750ml×2瓶', skuName:'宝洁 海飞丝 经典去屑洗发水 750ml×2瓶 750ml×2瓶' },
  { id:214, name:'飘柔 丝质柔顺洗发露 750ml×2瓶', model:'丝质柔顺', spec:'750ml×2瓶', spu:'ZD-A00030', sku:'HZ-A00030-001-DF', type:'physical', catL3:'个护美妆 > 洗发护发 > 洗发水', brand:'宝洁', supplier:'宝洁中国供应链', tags:[], supplyPrice:'¥49.00', ecomPrice:'¥89.00', stock:6000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-06-05 14:25', preferred:false, spuName:'宝洁 飘柔 丝质柔顺洗发露 750ml×2瓶', skuName:'宝洁 飘柔 丝质柔顺洗发露 750ml×2瓶 750ml×2瓶' },
  { id:215, name:'潘婷 乳液修护洗发乳 500ml×2瓶', model:'乳液修护', spec:'500ml×2瓶', spu:'ZD-A00031', sku:'HZ-A00031-001-DF', type:'physical', catL3:'个护美妆 > 洗发护发 > 洗发水', brand:'宝洁', supplier:'宝洁中国供应链', tags:[], supplyPrice:'¥55.00', ecomPrice:'¥95.00', stock:5500, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-06-12 10:40', preferred:false, spuName:'宝洁 潘婷 乳液修护洗发乳 500ml×2瓶', skuName:'宝洁 潘婷 乳液修护洗发乳 500ml×2瓶 500ml×2瓶' },
  { id:216, name:'沙宣 轻盈控油洗发水 500ml×2瓶', model:'轻盈控油', spec:'500ml×2瓶', spu:'ZD-A00032', sku:'HZ-A00032-001-DF', type:'physical', catL3:'个护美妆 > 洗发护发 > 洗发水', brand:'宝洁', supplier:'顺丰供应链', tags:[], supplyPrice:'¥65.00', ecomPrice:'¥109.00', stock:3000, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-06-19 15:10', preferred:false, spuName:'宝洁 沙宣 轻盈控油洗发水 500ml×2瓶', skuName:'宝洁 沙宣 轻盈控油洗发水 500ml×2瓶 500ml×2瓶' },
  { id:217, name:'汰渍 全效洗衣液 3kg×2袋', model:'全效', spec:'3kg×2袋', spu:'ZD-A00033', sku:'HZ-A00033-001-DF', type:'physical', catL3:'个护美妆 > 家庭清洁 > 洗衣液', brand:'宝洁', supplier:'京东物流', tags:[], supplyPrice:'¥45.00', ecomPrice:'¥79.00', stock:8000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-06-26 09:55', preferred:false, spuName:'宝洁 汰渍 全效洗衣液 3kg×2袋', skuName:'宝洁 汰渍 全效洗衣液 3kg×2袋 3kg×2袋' },
  { id:218, name:'碧浪 洗衣凝珠 40颗×2盒装', model:'凝珠', spec:'40颗×2盒', spu:'ZD-A00034', sku:'HZ-A00034-001-DF', type:'physical', catL3:'个护美妆 > 家庭清洁 > 洗衣液', brand:'宝洁', supplier:'京东物流', tags:[], supplyPrice:'¥55.00', ecomPrice:'¥95.00', stock:7000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-07-03 11:20', preferred:false, spuName:'宝洁 碧浪 洗衣凝珠 40颗×2盒装', skuName:'宝洁 碧浪 洗衣凝珠 40颗×2盒装 40颗×2盒' },
  { id:219, name:'舒肤佳 柠檬清爽沐浴露 1L×2瓶', model:'柠檬清爽', spec:'1L×2瓶', spu:'ZD-A00035', sku:'HZ-A00035-001-DF', type:'physical', catL3:'个护美妆 > 身体清洁 > 沐浴露', brand:'宝洁', supplier:'菜鸟供应链', tags:[], supplyPrice:'¥49.00', ecomPrice:'¥85.00', stock:4000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-07-10 14:35', preferred:false, spuName:'宝洁 舒肤佳 柠檬清爽沐浴露 1L×2瓶', skuName:'宝洁 舒肤佳 柠檬清爽沐浴露 1L×2瓶 1L×2瓶' },
  { id:220, name:'佳洁士 全优7效牙膏 120g×3支', model:'全优7效', spec:'120g×3支', spu:'ZD-A00036', sku:'HZ-A00036-001-DF', type:'physical', catL3:'个护美妆 > 口腔护理 > 牙膏', brand:'宝洁', supplier:'菜鸟供应链', tags:[], supplyPrice:'¥39.00', ecomPrice:'¥69.00', stock:6000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-07-17 10:05', preferred:false, spuName:'宝洁 佳洁士 全优7效牙膏 120g×3支', skuName:'宝洁 佳洁士 全优7效牙膏 120g×3支 120g×3支' },
  { id:221, name:'帮宝适 一级帮纸尿裤 L码34片×2包', model:'一级帮', spec:'L码,34片×2包', spu:'ZD-A00037', sku:'HZ-A00037-001-DF', type:'physical', catL3:'个护美妆 > 生活用纸 > 纸尿裤', brand:'宝洁', supplier:'京东物流', tags:[], supplyPrice:'¥129.00', ecomPrice:'¥199.00', stock:3000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-07-24 15:45', preferred:false, spuName:'宝洁 帮宝适 一级帮纸尿裤 L码34片×2包', skuName:'宝洁 帮宝适 一级帮纸尿裤 L码34片×2包 L码,34片×2包' },
  { id:222, name:'护舒宝 液体卫生巾 日用270mm 18片×2包', model:'液体卫生巾', spec:'日用270mm,18片×2包', spu:'ZD-A00038', sku:'HZ-A00038-001-DF', type:'physical', catL3:'个护美妆 > 生活用纸 > 卫生巾', brand:'宝洁', supplier:'顺丰供应链', tags:[], supplyPrice:'¥89.00', ecomPrice:'¥139.00', stock:2500, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-07-31 09:30', preferred:false, spuName:'宝洁 护舒宝 液体卫生巾 日用270mm 18片×2包', skuName:'宝洁 护舒宝 液体卫生巾 日用270mm 18片×2包 日用270mm,18片×2包' },
  { id:223, name:'吉列 锋隐致顺剃须刀 1刀架+4刀头', model:'锋隐致顺', spec:'1刀架+4刀头', spu:'ZD-A00039', sku:'HZ-A00039-001-DF', type:'physical', catL3:'个护美妆 > 男士理容 > 剃须刀', brand:'宝洁', supplier:'顺丰供应链', tags:[], supplyPrice:'¥99.00', ecomPrice:'¥159.00', stock:2000, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-08-05 11:15', preferred:false, spuName:'宝洁 吉列 锋隐致顺剃须刀 1刀架+4刀头', skuName:'宝洁 吉列 锋隐致顺剃须刀 1刀架+4刀头 1刀架+4刀头' },
  { id:224, name:'欧乐-B D16智感声波电动牙刷', model:'D16', spec:'黑白双色,1支装', spu:'ZD-A00040', sku:'HZ-A00040-001-DF', type:'physical', catL3:'个护美妆 > 口腔护理 > 电动牙刷', brand:'宝洁', supplier:'菜鸟供应链', tags:[], supplyPrice:'¥199.00', ecomPrice:'¥329.00', stock:1500, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-08-11 16:00', preferred:false, spuName:'宝洁 欧乐-B D16智感声波电动牙刷', skuName:'宝洁 欧乐-B D16智感声波电动牙刷 黑白双色,1支装' },
  { id:225, name:'戴森 V12 Detect Slim无绳吸尘器', model:'V12 Detect Slim', spec:'限定紫红,整机', spu:'ZD-A00041', sku:'HZ-A00041-001-DF', type:'physical', catL3:'家居 > 电器 > 吸尘器', brand:'戴森', supplier:'戴森贸易有限公司', tags:[], supplyPrice:'¥3499.00', ecomPrice:'¥4299.00', stock:150, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-08-16 10:50', preferred:false, spuName:'戴森 V12 Detect Slim无绳吸尘器', skuName:'戴森 V12 Detect Slim无绳吸尘器 限定紫红,整机' },
  { id:226, name:'三星 Galaxy S25智能手机 12GB+256GB', model:'Galaxy S25', spec:'暮河黑,12GB+256GB', spu:'ZD-A00042', sku:'HZ-A00042-001-DF', type:'physical', catL3:'数码 > 手机通讯 > 智能手机', brand:'三星', supplier:'三星电子中国', tags:[], supplyPrice:'¥5999.00', ecomPrice:'¥6999.00', stock:300, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2026-08-20 13:40', preferred:false, spuName:'三星 Galaxy S25智能手机 12GB+256GB', skuName:'三星 Galaxy S25智能手机 12GB+256GB 暮河黑,12GB+256GB' },
  { id:227, name:'3M 9001V KN95口罩', model:'9001V', spec:'白色,常规', spu:'ZD-A00001', sku:'HZ-A00001-001-DF', sameGroup:'SG-MASK-001', type:'physical', catL3:'劳保用品 > 防护口罩 > KN95口罩', brand:'3M', supplier:'恒通供应链', tags:[0,2,4], supplyPrice:'¥16.90', ecomPrice:'¥35.90', stock:6200, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2025-06-22 10:00', preferred:true, spuName:'3M 9001V KN95口罩', skuName:'3M 9001V KN95口罩 白色,常规' },
    // —— 主流程补齐:选品清单/待处理队列引用但池内缺失的商品回填主数据(含一品多商同款申报行,独立SPU+sameGroup关联) ——
    { id:143, name:'夏季纯棉圆领T恤', model:'TSHIRT-002', spec:'白色,M', spu:'ZD-A00009', sku:'HZ-A00009-001-DF', sameGroup:'SG-TSHIRT-001', type:'physical', catL3:'男装 > T恤 > 短袖T恤', brand:'森马', supplier:'星辰商贸', tags:[0,1,2], supplyPrice:'¥85.00', ecomPrice:'¥129.00', stock:2580, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2025-04-10 09:00', preferred:true },
    { id:144, name:'夏季纯棉圆领T恤', model:'TSHIRT-002', spec:'白色,M', spu:'ZD-A00083', sku:'HZ-A00083-001-DF', sameGroup:'SG-TSHIRT-001', type:'physical', catL3:'男装 > T恤 > 短袖T恤', brand:'森马', supplier:'恒通供应链', tags:[0,2], supplyPrice:'¥82.00', ecomPrice:'¥125.00', stock:1900, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-04-12 11:20' },
    { id:145, name:'智能蓝牙体脂秤', model:'SCALE-087', spec:'白色', spu:'ZD-A00003', sku:'HZ-A00003-001-DF', sameGroup:'SG-SCALE-001', type:'physical', catL3:'数码 > 健康设备 > 体脂秤', brand:'小米', supplier:'恒通供应链', tags:[0,3], supplyPrice:'¥95.00', ecomPrice:'¥189.00', stock:890, shipping:'京东物流', logisticsNote:'48h内发货', createdAt:'2025-03-12 10:30', preferred:true },
    { id:146, name:'智能蓝牙体脂秤', model:'SCALE-087', spec:'白色', spu:'ZD-A00084', sku:'HZ-A00084-001-DF', sameGroup:'SG-SCALE-001', type:'physical', catL3:'数码 > 健康设备 > 体脂秤', brand:'小米', supplier:'星辰商贸', tags:[0,3], supplyPrice:'¥90.00', ecomPrice:'¥189.00', stock:1200, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2025-03-15 14:00' },
    { id:147, name:'智能蓝牙体脂秤', model:'SCALE-087', spec:'白色', spu:'ZD-A00085', sku:'HZ-A00085-001-DF', sameGroup:'SG-SCALE-001', type:'physical', catL3:'数码 > 健康设备 > 体脂秤', brand:'小米', supplier:'鹏程优品', tags:[3], supplyPrice:'¥102.00', ecomPrice:'¥199.00', stock:600, shipping:'京东物流', logisticsNote:'48h内发货', createdAt:'2025-03-18 09:40' },
    { id:148, name:'女士直筒休闲长裤', model:'PANT-228', spec:'黑色,均码', spu:'ZD-A00005', sku:'HZ-A00005-001-DF', sameGroup:'SG-PANTS-001', type:'physical', catL3:'女装 > 裤子 > 休闲裤', brand:'优衣库', supplier:'鹏程优品', tags:[1,4], supplyPrice:'¥95.00', ecomPrice:'¥169.00', stock:0, shipping:'中通/圆通', logisticsNote:'供应商已下架', createdAt:'2025-02-14 15:30', preferred:true },
    { id:149, name:'女士直筒休闲长裤', model:'PANT-228', spec:'黑色,均码', spu:'ZD-A00086', sku:'HZ-A00086-001-DF', sameGroup:'SG-PANTS-001', type:'physical', catL3:'女装 > 裤子 > 休闲裤', brand:'优衣库', supplier:'恒通供应链', tags:[1], supplyPrice:'¥88.00', ecomPrice:'¥159.00', stock:520, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-02-18 10:10' },
    { id:150, name:'有机山茶油500ml', model:'OIL-021', spec:'500ml', spu:'ZD-A00087', sku:'HZ-A00087-001-DF', sameGroup:'SG-OIL-001', type:'physical', catL3:'家居 > 食品 > 食用油', brand:'金龙鱼', supplier:'星辰商贸', tags:[3,4], supplyPrice:'¥27.00', ecomPrice:'¥59.00', stock:8000, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-02-25 09:00' },
    { id:151, name:'新疆纯牛奶200ml*12', model:'MILK-2012', spec:'200ml*12盒', spu:'ZD-A00096', sku:'HZ-A00096-001-DF', sameGroup:'SG-MILK-001', jc:true, jcPrice:'¥41.00', jcMoq:100, type:'physical', catL3:'家居 > 食品 > 乳制品', brand:'天润', supplier:'恒通供应链', tags:[3,4], supplyPrice:'¥45.00', ecomPrice:'¥79.00', stock:2300, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-01-20 10:00', preferred:true },
    { id:152, name:'新疆纯牛奶200ml*12', model:'MILK-2012', spec:'200ml*12盒', spu:'ZD-A00088', sku:'HZ-A00088-001-DF', sameGroup:'SG-MILK-001', jc:true, jcPrice:'¥38.50', jcMoq:100, type:'physical', catL3:'家居 > 食品 > 乳制品', brand:'天润', supplier:'鹏程优品', tags:[4], supplyPrice:'¥42.00', ecomPrice:'¥75.00', stock:1600, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-01-24 14:20' },
    { id:153, name:'有机黑木耳200g', model:'FUNGI-200', spec:'200g', spu:'ZD-A00097', sku:'HZ-A00097-001-DF', sameGroup:'SG-FUNGUS-001', type:'physical', catL3:'家居 > 食品 > 干货', brand:'北大荒', supplier:'环球优选', tags:[2,4], supplyPrice:'¥28.00', ecomPrice:'¥49.00', stock:3100, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-03-01 09:30', preferred:true },
    { id:154, name:'有机黑木耳200g', model:'FUNGI-200', spec:'200g', spu:'ZD-A00089', sku:'HZ-A00089-001-DF', sameGroup:'SG-FUNGUS-001', type:'physical', catL3:'家居 > 食品 > 干货', brand:'北大荒', supplier:'星辰商贸', tags:[4], supplyPrice:'¥25.00', ecomPrice:'¥45.00', stock:2700, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-03-04 11:00' },
    { id:155, name:'家用便携式榨汁机', model:'JUICE-600', spec:'白色,600ml', spu:'ZD-A00102', sku:'HZ-A00102-001-DF', type:'physical', catL3:'家居 > 电器 > 厨房小电', brand:'美的', supplier:'星辰商贸', tags:[0,2], supplyPrice:'¥89.00', ecomPrice:'¥159.00', stock:1400, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-05-08 13:00', preferred:true },
    { id:156, name:'每日坚果混合礼盒', model:'NUT-750', spec:'750g礼盒', spu:'ZD-A00103', sku:'HZ-A00103-001-DF', type:'physical', catL3:'家居 > 食品 > 坚果炒货', brand:'沃隆', supplier:'环球优选', tags:[2,4], supplyPrice:'¥68.00', ecomPrice:'¥128.00', stock:1900, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-04-15 10:30', preferred:true },
    // —— 渠道商品(04)在售但池内缺主数据的回填,使渠道商品全部可回溯供应侧 ——
    { id:158, name:'儿童运动跑鞋', model:'KID-RUN3', spec:'28码', spu:'ZD-A00098', sku:'HZ-A00098-001-DF', sameGroup:'SG-SHOE-001', type:'physical', catL3:'运动户外 > 童鞋 > 运动跑鞋', brand:'安踏儿童', supplier:'鹏程优品', tags:[0,2], supplyPrice:'¥65.00', ecomPrice:'¥119.00', stock:860, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2025-04-02 10:00', preferred:true },
    { id:159, name:'儿童运动跑鞋', model:'KID-RUN3', spec:'28码', spu:'ZD-A00090', sku:'HZ-A00090-001-DF', sameGroup:'SG-SHOE-001', type:'physical', catL3:'运动户外 > 童鞋 > 运动跑鞋', brand:'安踏儿童', supplier:'恒通供应链', tags:[2], supplyPrice:'¥58.00', ecomPrice:'¥109.00', stock:430, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-04-08 15:20' },
    { id:160, name:'儿童运动跑鞋', model:'KID-RUN3', spec:'30码', spu:'ZD-A00098', sku:'HZ-A00098-003-DF', type:'physical', catL3:'运动户外 > 童鞋 > 运动跑鞋', brand:'安踏儿童', supplier:'鹏程优品', tags:[0,2], supplyPrice:'¥65.00', ecomPrice:'¥119.00', stock:520, shipping:'顺丰/中通', logisticsNote:'24h内发货', createdAt:'2025-04-02 10:05' },
    { id:161, name:'有机绿茶礼盒装', model:'TEA-200', spec:'200g', spu:'ZD-A00099', sku:'HZ-A00099-001-DF', type:'physical', catL3:'食品饮料 > 茶饮冲调 > 绿茶', brand:'八马', supplier:'环球优选', tags:[2,4], supplyPrice:'¥56.00', ecomPrice:'¥99.00', stock:1200, shipping:'韵达/中通', logisticsNote:'24h内发货', createdAt:'2025-03-28 09:00', preferred:true },
    { id:162, name:'纳米喷雾补水仪', model:'SPRAY-K9', spec:'标准款', spu:'ZD-A00100', sku:'HZ-A00100-001-DF', type:'physical', catL3:'个护美妆 > 美容仪器 > 补水仪', brand:'金稻', supplier:'鹏程优品', tags:[1,3], supplyPrice:'¥35.00', ecomPrice:'¥69.00', stock:980, shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2025-05-12 11:30', preferred:true },
    { id:163, name:'折叠旅行背包', model:'PACK-20L', spec:'20L', spu:'ZD-A00101', sku:'HZ-A00101-001-DF', type:'physical', catL3:'运动户外 > 户外装备 > 背包', brand:'探路者', supplier:'星辰商贸', tags:[0,4], supplyPrice:'¥45.00', ecomPrice:'¥89.00', stock:0, shipping:'中通/圆通', logisticsNote:'库存耗尽', createdAt:'2025-02-10 14:00', preferred:true },
    { id:164, name:'星巴克电子礼品卡', model:'SBUX-100', spec:'面值100元', spu:'ZDXN-A00006', sku:'HZXN-A00006-001-KM', type:'virtual', catL3:'虚拟商品 > 礼品卡 > 电子卡', brand:'星巴克', supplier:'数字服务商B', tags:[5], supplyPrice:'¥80.00', ecomPrice:'¥95.00', stock:-1, shipping:'自动发货', logisticsNote:'即时到账', createdAt:'2025-04-10 10:00', preferred:true },
    { id:165, name:'家庭营养过年礼包', model:'COMBO-002', spec:'组合套装A', spu:'ZDZH-A00006', sku:'HZZH-A00006-001', type:'combo', catL3:'食品饮料 > 乳制品 > 牛奶；节日礼盒 > 春节礼盒 > 食品礼包', brand:'天润', supplier:'恒通供应链', tags:[0,4], supplyPrice:'¥73.00', ecomPrice:'¥99.00', stock:1200, comboComponents:[{role:'主件',qty:1,name:'天润 新疆纯牛奶200ml*12'},{role:'配件',qty:1,name:'北大荒 有机黑木耳200g'}], shipping:'中通/圆通', logisticsNote:'24h内发货', createdAt:'2026-01-15 10:00', preferred:true },
  ],

  // ============================================================
  // 表:集采商城在售池(SPU级入池状态;入池轻量无审批默认在售,在池内维护在售/停售)
  // ============================================================
  jicaiPool: [
    { spu:'ZD-A00001', status:'on' },
    { spu:'ZD-A00081', status:'on' },
    { spu:'ZD-B00003', status:'on' },
    { spu:'ZD-A00004', status:'on' },
    { spu:'ZD-A00091', status:'on' },
    { spu:'ZD-A00008', status:'on' },
    { spu:'ZD-A00092', status:'on' },
    { spu:'ZD-A00010', status:'on' },
    { spu:'ZDXN-A00006', status:'on' },
    { spu:'ZD-A00015', status:'off' },
    { spu:'ZD-A00096', status:'on' },
    { spu:'ZD-A00088', status:'on' },
  ],

  // ============================================================
  // 表:集采报价(询价单主单;报价版本挂在询价单下不独立成单)
  // 状态:pending_accept|pricing|approving|awaiting_confirm|expired|won|cancelled
  // ============================================================
  jicaiQuotes: [
    {
      id: 'XQ20260828001', customer: '江苏银行股份有限公司', customerShort: '江苏银行', customerBuyer: '王启航', customerBuyerPhone: '13805181234', createdBy: '李运营', acceptedBy: '张晗',
      status: 'awaiting_confirm', version: 'V2', versionCount: 2, validDays: 7, validUntil: '2026-09-04 23:59',
      createdAt: '2026-08-28 10:20', updatedAt: '2026-08-28 16:40', source: '代客建单',
      costTotal: 45600, agreeTotal: 52800, itemCount: 3, qtyTotal: 1200,
      itemsPreview: '3M 9001V KN95口罩、不锈钢保温杯500ml、新疆纯牛奶200ml*12',
      remark: '中秋员工福利集采',
      deliveryNote: '口罩/牛奶 7 个工作日内发齐；保温杯 10 个工作日',
      items: [
        { mallSku: 'S001A00001001', name: '3M 9001V KN95口罩 白色,常规', spec: '白色,常规', qty: 800, costPrice: 15.2, refPrice: 36.9, agreePrice: 18.5, deliveryDays: 7, supplier: '恒通供应链', supplySku: 'HZ-A00001-002-JC' },
        { mallSku: 'S001A00004001', name: '富光 不锈钢保温杯500ml CUP-330 银色,500ml', spec: '银色,500ml', qty: 200, costPrice: 31, refPrice: 68, agreePrice: 38, deliveryDays: 10, supplier: '星辰商贸', supplySku: 'HZ-A00004-001-JC' },
        { mallSku: 'S001A00023001', name: '天润 新疆纯牛奶200ml*12 MILK-2012 200ml*12盒', spec: '200ml*12盒', qty: 200, costPrice: 38.5, refPrice: 75, agreePrice: 48, deliveryDays: 7, supplier: '鹏程优品', supplySku: 'HZ-A00088-001-JC' }
      ]
    },
    {
      id: 'XQ20260829002', customer: '南京市第一医院', customerShort: '南京一院', customerBuyer: '陈晓雯', customerBuyerPhone: '13905182345', createdBy: '张晗', acceptedBy: '李运营',
      status: 'approving', version: 'V1', versionCount: 1, validDays: 15, validUntil: '',
      createdAt: '2026-08-29 09:15', updatedAt: '2026-08-30 11:02', source: '代客建单',
      costTotal: 121600, agreeTotal: 145000, itemCount: 2, qtyTotal: 80,
      itemsPreview: 'OPPO Find X8、无线降噪蓝牙耳机',
      remark: '',
      deliveryNote: '手机 3 个工作日；耳机 7 个工作日',
      items: [
        { mallSku: 'S002A00003001', name: 'OPPO Find X8 星野黑,12+256GB', spec: '星野黑,12+256GB', qty: 30, costPrice: 3850, refPrice: 4299, agreePrice: 4200, deliveryDays: 3, supplier: 'OPPO官方旗舰店', supplySku: 'HZ-B00003-001-JC' },
        { mallSku: 'S001A00010001', name: '漫步者 无线降噪蓝牙耳机 BUD-990 黑色', spec: '黑色', qty: 50, costPrice: 122, refPrice: 269, agreePrice: 380, deliveryDays: 7, supplier: '星辰商贸', supplySku: 'HZ-A00010-001-JC' }
      ]
    },
    {
      id: 'XQ20260830003', customer: '苏宁易购集团股份有限公司', customerShort: '苏宁易购', customerBuyer: '刘振华', customerBuyerPhone: '13705183456', createdBy: '王专员', acceptedBy: '张晗',
      status: 'pricing', version: 'V1', versionCount: 1, validDays: 0, validUntil: '',
      createdAt: '2026-08-30 14:30', updatedAt: '2026-08-30 14:30', source: '代客建单',
      costTotal: 103080, agreeTotal: 0, itemCount: 3, qtyTotal: 560,
      itemsPreview: '加厚保暖羽绒服、户外防水冲锋衣等',
      remark: '冬装劳保项目，待定协议价',
      items: [
        { mallSku: 'S001A00008001', name: '波司登 加厚保暖羽绒服 DOWN-401 黑色,M', spec: '黑色,M', qty: 200, costPrice: 165, refPrice: 359, agreePrice: 0, deliveryDays: null, supplier: '', supplySku: '' },
        { mallSku: 'S001A00008003', name: '波司登 加厚保暖羽绒服 DOWN-401 黑色,XL', spec: '黑色,XL', qty: 200, costPrice: 160, refPrice: 349, agreePrice: 0, deliveryDays: null, supplier: '', supplySku: '' },
        { mallSku: 'S001A00012001', name: '探路者 户外防水冲锋衣 JKT-880 藏青,L', spec: '藏青,L', qty: 160, costPrice: 238, refPrice: 499, agreePrice: 0, deliveryDays: null, supplier: '', supplySku: '' }
      ]
    },
    {
      id: 'XQ20260831004', customer: '江苏银行股份有限公司', customerShort: '江苏银行', customerBuyer: '王启航', customerBuyerPhone: '13805181234', createdBy: '张晗', acceptedBy: '',
      status: 'pending_accept', version: '', versionCount: 0, validDays: 0, validUntil: '',
      createdAt: '2026-08-31 08:50', updatedAt: '2026-08-31 08:50', source: '代客建单',
      costTotal: 0, agreeTotal: 0, itemCount: 1, qtyTotal: 200,
      itemsPreview: '星巴克电子礼品卡',
      remark: '',
      items: [
        { mallSku: 'X001A00006001', name: '星巴克电子礼品卡 SBUX-100 面值100元', spec: '面值100元', qty: 200, costPrice: 0, refPrice: 95, agreePrice: 0, deliveryDays: null, supplier: '', supplySku: '' }
      ]
    },
    {
      id: 'XQ20260820005', customer: '南京市第一医院', customerShort: '南京一院', customerBuyer: '周敏', customerBuyerPhone: '13605184567', createdBy: '李运营', acceptedBy: '张晗',
      status: 'expired', version: 'V1', versionCount: 1, validDays: 7, validUntil: '2026-08-27 23:59',
      createdAt: '2026-08-20 11:00', updatedAt: '2026-08-28 00:00', source: '代客建单',
      costTotal: 8900, agreeTotal: 10200, itemCount: 2, qtyTotal: 300,
      itemsPreview: '有机山茶油500ml、有机绿茶礼盒装',
      remark: '超期未确认',
      deliveryNote: '7 个工作日内发货',
      items: [
        { mallSku: 'S001A00015001', name: '金龙鱼 有机山茶油500ml OIL-021 500ml', spec: '500ml', qty: 200, costPrice: 25.5, refPrice: 59, agreePrice: 32, deliveryDays: 7, supplier: '恒通供应链', supplySku: 'HZ-A00015-001-JC' },
        { mallSku: 'S001A00021001', name: '八马 有机绿茶礼盒装 TEA-200 250g礼盒', spec: '250g礼盒', qty: 100, costPrice: 51, refPrice: null, agreePrice: 38, deliveryDays: 7, supplier: '环球优选', supplySku: 'HZ-A00021-001-JC' }
      ]
    },
    {
      id: 'XQ20260810006', customer: '江苏银行股份有限公司', customerShort: '江苏银行', customerBuyer: '王启航', customerBuyerPhone: '13805181234', createdBy: '张晗', acceptedBy: '李运营',
      status: 'won', version: 'V3', versionCount: 3, validDays: 15, validUntil: '2026-08-25 23:59',
      createdAt: '2026-08-10 09:40', updatedAt: '2026-08-18 15:20', source: '代客建单',
      costTotal: 67200, agreeTotal: 75800, itemCount: 3, qtyTotal: 2100,
      itemsPreview: '3M 9001V KN95口罩、新疆纯牛奶等',
      relatedOrder: 'JC20260818001', remark: '已转集采订单',
      deliveryNote: '分批发货，详见订单',
      confirmedAt: '2026-08-18 15:20',
      confirmedBy: '李运营',
      confirmNote: '客户盖章扫描件回传',
      confirmProofs: [
        { name: '江苏银行_报价确认单_盖章回传.pdf', sizeText: '1.2 MB', uploadedAt: '2026-08-18 15:18' },
        { name: '邮件确认截图.png', sizeText: '486 KB', uploadedAt: '2026-08-18 15:19' }
      ],
      items: [
        { mallSku: 'S001A00001001', name: '3M 9001V KN95口罩 白色,常规', spec: '白色,常规', qty: 1000, costPrice: 15.2, refPrice: 36.9, agreePrice: 18, deliveryDays: 7, supplier: '恒通供应链', supplySku: 'HZ-A00001-002-JC' },
        { mallSku: 'S001A00023001', name: '天润 新疆纯牛奶200ml*12 MILK-2012 200ml*12盒', spec: '200ml*12盒', qty: 800, costPrice: 38.5, refPrice: 75, agreePrice: 46, deliveryDays: 7, supplier: '鹏程优品', supplySku: 'HZ-A00023-002-JC' },
        { mallSku: 'S001A00004001', name: '富光 不锈钢保温杯500ml CUP-330 银色,500ml', spec: '银色,500ml', qty: 300, costPrice: 31, refPrice: 68, agreePrice: 36, deliveryDays: 10, supplier: '星辰商贸', supplySku: 'HZ-A00004-001-JC' }
      ]
    },
    {
      id: 'XQ20260815007', customer: '苏宁易购集团股份有限公司', customerShort: '苏宁易购', customerBuyer: '刘振华', customerBuyerPhone: '13705183456', createdBy: '王专员', acceptedBy: '张晗',
      status: 'cancelled', version: 'V1', versionCount: 1, validDays: 15, validUntil: '2026-08-30 23:59',
      createdAt: '2026-08-15 16:10', updatedAt: '2026-08-16 10:00', source: '代客建单',
      costTotal: 7000, agreeTotal: 8600, itemCount: 1, qtyTotal: 40,
      itemsPreview: '真皮手提商务包',
      remark: '',
      deliveryNote: '7 个工作日内发货',
      cancelReason: '客户看完报价后决定本年度暂不集采',
      cancelledAt: '2026-08-16 10:00',
      cancelledBy: '张晗',
      items: [
        { mallSku: 'S001A00018001', name: '金利来 真皮手提商务包 BAG-881 黑色', spec: '黑色', qty: 40, costPrice: 175, refPrice: 359, agreePrice: 215, deliveryDays: 7, supplier: '星辰商贸', supplySku: 'HZ-A00018-001-JC' }
      ]
    },
    {
      id: 'XQ20260825008', customer: '南京市第一医院', customerShort: '南京一院', customerBuyer: '陈晓雯', customerBuyerPhone: '13905182345', createdBy: '李运营', acceptedBy: '张晗',
      status: 'rejected', version: 'V1', versionCount: 1, validDays: 15, validUntil: '2026-09-09 23:59',
      createdAt: '2026-08-25 13:22', updatedAt: '2026-08-28 09:40', source: '代客建单',
      costTotal: 23800, agreeTotal: 27600, itemCount: 1, qtyTotal: 100,
      itemsPreview: '户外防水冲锋衣',
      remark: '',
      deliveryNote: '10 个工作日内发货',
      rejectReason: '协议价高于预算，客户无法接受，要求重新议价',
      rejectedAt: '2026-08-28 09:40',
      rejectedBy: '张晗',
      items: [
        { mallSku: 'S001A00012001', name: '探路者 户外防水冲锋衣 JKT-880 藏青,L', spec: '藏青,L', qty: 100, costPrice: 238, refPrice: 499, agreePrice: 276, deliveryDays: 10, supplier: '环球优选', supplySku: 'HZ-A00012-001-JC' }
      ]
    },
  ],

  // ============================================================
  // 表:集采订单(成交履约主单;询价单双方确认后转单)
  // 主/子单状态:awaiting_address(待填收货地址)|pending_ship(待发货)|shipped|completed
  // 子单按商城SKU拆分(subNo=主单号+两位序号)；分批发货进度看 distributeShipped/Rows，不设「部分发货」状态
  // ============================================================
  jicaiOrders: [
    {
      id: 'JC20260831001', quoteId: 'XQ20260828001', quoteVersion: 'V2',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      customerBuyer: '王启航', customerBuyerPhone: '13805181234',
      sales: '张晗', status: 'awaiting_address',
      createdAt: '2026-08-31 09:10', updatedAt: '2026-08-31 09:10',
      costTotal: 45600, agreeTotal: 52800, itemCount: 3, qtyTotal: 1200,
      itemsPreview: '3M 9001V KN95口罩、不锈钢保温杯500ml、新疆纯牛奶200ml*12',
      remark: '中秋员工福利集采', addressSource: 'none',
      distributeRows: 0, distributeLocked: 0, distributeShipped: 0, distributeSigned: 0,
      pushError: '',
      distributePlan: [],
      items: [
        { subNo: 'JC2026083100101', mallSku: 'S001A00001001', name: '3M 9001V KN95口罩', brand: '3M', model: '9001V', spec: '白色,常规', qty: 800, costPrice: 15.2, agreePrice: 18.5, supplier: '恒通供应链', supplySku: 'HZ-A00001-002-JC', status: 'awaiting_address', deliveryDays: 7, deliveryDeadline: '2026-09-07 23:59', distributeRows: 0, distributeShipped: 0, distributeSigned: 0, opsRemark: '' },
        { subNo: 'JC2026083100102', mallSku: 'S001A00004001', name: '不锈钢保温杯500ml', brand: '富光', model: 'CUP-330', spec: '银色,500ml', qty: 200, costPrice: 31, agreePrice: 38, supplier: '星辰商贸', supplySku: 'HZ-A00004-001-JC', status: 'awaiting_address', deliveryDays: 10, deliveryDeadline: '2026-09-10 23:59', distributeRows: 0, distributeShipped: 0, distributeSigned: 0, opsRemark: '' },
        { subNo: 'JC2026083100103', mallSku: 'S001A00023001', name: '新疆纯牛奶200ml*12', brand: '天润', model: 'MILK-2012', spec: '200ml*12盒', qty: 200, costPrice: 38.5, agreePrice: 48, supplier: '鹏程优品', supplySku: 'HZ-A00023-002-JC', status: 'awaiting_address', deliveryDays: 7, deliveryDeadline: '2026-09-07 23:59', distributeRows: 0, distributeShipped: 0, distributeSigned: 0, opsRemark: '' }
      ]
    },
    {
      id: 'JC20260829002', quoteId: 'XQ20260822009', quoteVersion: 'V1',
      customer: '南京市第一医院', customerShort: '南京一院',
      customerBuyer: '陈晓雯', customerBuyerPhone: '13905182345',
      sales: '李运营', status: 'pending_ship',
      createdAt: '2026-08-29 16:40', updatedAt: '2026-08-30 10:15',
      costTotal: 18600, agreeTotal: 21400, itemCount: 2, qtyTotal: 450,
      itemsPreview: '有机山茶油500ml、有机绿茶礼盒装',
      remark: '院庆福利', addressSource: 'platform',
      distributeRows: 20, distributeLocked: 20, distributeShipped: 0, distributeSigned: 0,
      pushError: '',
      distributePlan: [
        { id: 'DP29001', recipient: '陈晓雯', phone: '13905182345', region: '江苏省南京市鼓楼区', address: '中山路321号行政楼3楼院办', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29002', recipient: '赵丽', phone: '13705180001', region: '江苏省南京市玄武区', address: '珠江路88号心内科护士站', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29003', recipient: '钱伟', phone: '13705180002', region: '江苏省南京市建邺区', address: '江东中路100号外科病区', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29004', recipient: '孙婷', phone: '13705180003', region: '江苏省南京市秦淮区', address: '中华路56号人事科', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29005', recipient: '周杰', phone: '13705180004', region: '江苏省南京市雨花台区', address: '软件大道119号南院行政', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29006', recipient: '吴敏', phone: '13705180005', region: '江苏省南京市栖霞区', address: '仙林大道168号东院药房', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29007', recipient: '郑浩', phone: '13705180006', region: '江苏省南京市江宁区', address: '双龙大道1号江宁分院综合办', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29008', recipient: '冯雪', phone: '13705180007', region: '江苏省南京市浦口区', address: '浦珠南路88号浦口院区', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29009', recipient: '曹阳', phone: '13705180008', region: '江苏省南京市六合区', address: '雄州东路66号六合院区', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29010', recipient: '蒋琳', phone: '13705180009', region: '江苏省南京市溧水区', address: '中山路100号溧水院区', mallSku: 'S001A00015001', subNo: 'JC2026082900201', name: '有机山茶油500ml', qty: 30, status: 'locked', express: '', waybill: '' },
        { id: 'DP29011', recipient: '陈晓雯', phone: '13905182345', region: '江苏省南京市鼓楼区', address: '中山路321号行政楼3楼院办', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29012', recipient: '赵丽', phone: '13705180001', region: '江苏省南京市玄武区', address: '珠江路88号心内科护士站', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29013', recipient: '钱伟', phone: '13705180002', region: '江苏省南京市建邺区', address: '江东中路100号外科病区', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29014', recipient: '孙婷', phone: '13705180003', region: '江苏省南京市秦淮区', address: '中华路56号人事科', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29015', recipient: '周杰', phone: '13705180004', region: '江苏省南京市雨花台区', address: '软件大道119号南院行政', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29016', recipient: '吴敏', phone: '13705180005', region: '江苏省南京市栖霞区', address: '仙林大道168号东院药房', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29017', recipient: '郑浩', phone: '13705180006', region: '江苏省南京市江宁区', address: '双龙大道1号江宁分院综合办', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29018', recipient: '冯雪', phone: '13705180007', region: '江苏省南京市浦口区', address: '浦珠南路88号浦口院区', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29019', recipient: '曹阳', phone: '13705180008', region: '江苏省南京市六合区', address: '雄州东路66号六合院区', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' },
        { id: 'DP29020', recipient: '蒋琳', phone: '13705180009', region: '江苏省南京市溧水区', address: '中山路100号溧水院区', mallSku: 'S001A00021001', subNo: 'JC2026082900202', name: '有机绿茶礼盒装', qty: 15, status: 'locked', express: '', waybill: '' }
      ],
      items: [
        { subNo: 'JC2026082900201', mallSku: 'S001A00015001', name: '有机山茶油500ml', brand: '金龙鱼', model: 'OIL-021', spec: '500ml', qty: 300, costPrice: 25.5, agreePrice: 32, supplier: '恒通供应链', supplySku: 'HZ-A00015-001-JC', status: 'pending_ship', deliveryDays: 7, deliveryDeadline: '2026-09-05 23:59', distributeRows: 10, distributeShipped: 0, distributeSigned: 0, opsRemark: '' },
        { subNo: 'JC2026082900202', mallSku: 'S001A00021001', name: '有机绿茶礼盒装', brand: '八马', model: 'TEA-200', spec: '250g礼盒', qty: 150, costPrice: 51, agreePrice: 38, supplier: '环球优选', supplySku: 'HZ-A00021-001-JC', status: 'pending_ship', deliveryDays: 7, deliveryDeadline: '2026-09-05 23:59', distributeRows: 10, distributeShipped: 0, distributeSigned: 0, opsRemark: '' }
      ]
    },
    {
      id: 'JC20260818001', quoteId: 'XQ20260810006', quoteVersion: 'V3',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      customerBuyer: '王启航', customerBuyerPhone: '13805181234',
      sales: '李运营', status: 'pending_ship',
      createdAt: '2026-08-18 15:20', updatedAt: '2026-08-19 09:00',
      costTotal: 24390, agreeTotal: 28920, itemCount: 3, qtyTotal: 1020,
      itemsPreview: '3M 9001V KN95口罩、新疆纯牛奶等',
      remark: '已转集采订单', addressSource: 'customer',
      distributeRows: 18, distributeLocked: 18, distributeShipped: 0, distributeSigned: 0,
      pushError: '',
      distributePlan: [
        { id: 'DP18001', recipient: '王启航', phone: '13805181234', region: '江苏省南京市建邺区', address: '江东中路399号江苏银行大厦人力资源部', mallSku: 'S001A00001001', subNo: 'JC2026081800101', name: '3M 9001V KN95口罩', qty: 100, status: 'locked', express: '', waybill: '' },
        { id: 'DP18002', recipient: '王启航', phone: '13805181234', region: '江苏省南京市建邺区', address: '江东中路399号江苏银行大厦人力资源部', mallSku: 'S001A00023001', subNo: 'JC2026081800102', name: '新疆纯牛奶200ml*12', qty: 50, status: 'locked', express: '', waybill: '' },
        { id: 'DP18003', recipient: '王启航', phone: '13805181234', region: '江苏省南京市建邺区', address: '江东中路399号江苏银行大厦人力资源部', mallSku: 'S001A00004001', subNo: 'JC2026081800103', name: '不锈钢保温杯500ml', qty: 20, status: 'locked', express: '', waybill: '' },
        { id: 'DP18004', recipient: '刘芳', phone: '13805180011', region: '江苏省苏州市姑苏区', address: '干将东路999号苏州分行综合部', mallSku: 'S001A00001001', subNo: 'JC2026081800101', name: '3M 9001V KN95口罩', qty: 100, status: 'locked', express: '', waybill: '' },
        { id: 'DP18005', recipient: '刘芳', phone: '13805180011', region: '江苏省苏州市姑苏区', address: '干将东路999号苏州分行综合部', mallSku: 'S001A00023001', subNo: 'JC2026081800102', name: '新疆纯牛奶200ml*12', qty: 50, status: 'locked', express: '', waybill: '' },
        { id: 'DP18006', recipient: '刘芳', phone: '13805180011', region: '江苏省苏州市姑苏区', address: '干将东路999号苏州分行综合部', mallSku: 'S001A00004001', subNo: 'JC2026081800103', name: '不锈钢保温杯500ml', qty: 20, status: 'locked', express: '', waybill: '' },
        { id: 'DP18007', recipient: '陈刚', phone: '13805180022', region: '江苏省无锡市梁溪区', address: '中山路288号无锡分行办公室', mallSku: 'S001A00001001', subNo: 'JC2026081800101', name: '3M 9001V KN95口罩', qty: 100, status: 'locked', express: '', waybill: '' },
        { id: 'DP18008', recipient: '陈刚', phone: '13805180022', region: '江苏省无锡市梁溪区', address: '中山路288号无锡分行办公室', mallSku: 'S001A00023001', subNo: 'JC2026081800102', name: '新疆纯牛奶200ml*12', qty: 50, status: 'locked', express: '', waybill: '' },
        { id: 'DP18009', recipient: '陈刚', phone: '13805180022', region: '江苏省无锡市梁溪区', address: '中山路288号无锡分行办公室', mallSku: 'S001A00004001', subNo: 'JC2026081800103', name: '不锈钢保温杯500ml', qty: 20, status: 'locked', express: '', waybill: '' },
        { id: 'DP18010', recipient: '赵敏', phone: '13805180033', region: '江苏省常州市天宁区', address: '延陵中路66号常州分行', mallSku: 'S001A00001001', subNo: 'JC2026081800101', name: '3M 9001V KN95口罩', qty: 100, status: 'locked', express: '', waybill: '' },
        { id: 'DP18011', recipient: '赵敏', phone: '13805180033', region: '江苏省常州市天宁区', address: '延陵中路66号常州分行', mallSku: 'S001A00023001', subNo: 'JC2026081800102', name: '新疆纯牛奶200ml*12', qty: 50, status: 'locked', express: '', waybill: '' },
        { id: 'DP18012', recipient: '赵敏', phone: '13805180033', region: '江苏省常州市天宁区', address: '延陵中路66号常州分行', mallSku: 'S001A00004001', subNo: 'JC2026081800103', name: '不锈钢保温杯500ml', qty: 20, status: 'locked', express: '', waybill: '' },
        { id: 'DP18013', recipient: '孙伟', phone: '13805180044', region: '江苏省南通市崇川区', address: '工农路188号南通分行', mallSku: 'S001A00001001', subNo: 'JC2026081800101', name: '3M 9001V KN95口罩', qty: 100, status: 'locked', express: '', waybill: '' },
        { id: 'DP18014', recipient: '孙伟', phone: '13805180044', region: '江苏省南通市崇川区', address: '工农路188号南通分行', mallSku: 'S001A00023001', subNo: 'JC2026081800102', name: '新疆纯牛奶200ml*12', qty: 50, status: 'locked', express: '', waybill: '' },
        { id: 'DP18015', recipient: '孙伟', phone: '13805180044', region: '江苏省南通市崇川区', address: '工农路188号南通分行', mallSku: 'S001A00004001', subNo: 'JC2026081800103', name: '不锈钢保温杯500ml', qty: 20, status: 'locked', express: '', waybill: '' },
        { id: 'DP18016', recipient: '周倩', phone: '13805180055', region: '江苏省徐州市云龙区', address: '淮海东路77号徐州分行', mallSku: 'S001A00001001', subNo: 'JC2026081800101', name: '3M 9001V KN95口罩', qty: 100, status: 'locked', express: '', waybill: '' },
        { id: 'DP18017', recipient: '周倩', phone: '13805180055', region: '江苏省徐州市云龙区', address: '淮海东路77号徐州分行', mallSku: 'S001A00023001', subNo: 'JC2026081800102', name: '新疆纯牛奶200ml*12', qty: 50, status: 'locked', express: '', waybill: '' },
        { id: 'DP18018', recipient: '周倩', phone: '13805180055', region: '江苏省徐州市云龙区', address: '淮海东路77号徐州分行', mallSku: 'S001A00004001', subNo: 'JC2026081800103', name: '不锈钢保温杯500ml', qty: 20, status: 'locked', express: '', waybill: '' }
      ],
      items: [
        { subNo: 'JC2026081800101', mallSku: 'S001A00001001', name: '3M 9001V KN95口罩', brand: '3M', model: '9001V', spec: '白色,常规', qty: 600, costPrice: 15.2, agreePrice: 18, supplier: '恒通供应链', supplySku: 'HZ-A00001-002-JC', status: 'pending_ship', deliveryDays: 7, deliveryDeadline: '2026-08-25 23:59', distributeRows: 6, distributeShipped: 0, distributeSigned: 0, opsRemark: '已下推采购' },
        { subNo: 'JC2026081800102', mallSku: 'S001A00023001', name: '新疆纯牛奶200ml*12', brand: '天润', model: 'MILK-2012', spec: '200ml*12盒', qty: 300, costPrice: 38.5, agreePrice: 46, supplier: '鹏程优品', supplySku: 'HZ-A00023-002-JC', status: 'pending_ship', deliveryDays: 7, deliveryDeadline: '2026-08-25 23:59', distributeRows: 6, distributeShipped: 0, distributeSigned: 0, opsRemark: '' },
        { subNo: 'JC2026081800103', mallSku: 'S001A00004001', name: '不锈钢保温杯500ml', brand: '富光', model: 'CUP-330', spec: '银色,500ml', qty: 120, costPrice: 31, agreePrice: 36, supplier: '星辰商贸', supplySku: 'HZ-A00004-001-JC', status: 'pending_ship', deliveryDays: 10, deliveryDeadline: '2026-08-28 23:59', distributeRows: 6, distributeShipped: 0, distributeSigned: 0, opsRemark: '' }
      ]
    },
    {
      id: 'JC20260815003', quoteId: 'XQ20260805010', quoteVersion: 'V2',
      customer: '苏宁易购集团股份有限公司', customerShort: '苏宁易购',
      customerBuyer: '刘振华', customerBuyerPhone: '13705183456',
      sales: '张晗', status: 'pending_ship',
      createdAt: '2026-08-15 11:30', updatedAt: '2026-08-28 14:20',
      costTotal: 33780, agreeTotal: 40500, itemCount: 3, qtyTotal: 180,
      itemsPreview: '加厚保暖羽绒服、户外防水冲锋衣等',
      remark: '冬装劳保项目', addressSource: 'platform',
      distributeRows: 18, distributeLocked: 18, distributeShipped: 12, distributeSigned: 4,
      pushError: '',
      distributePlan: [
        { id: 'DP15001', recipient: '刘振华', phone: '13705183456', region: '江苏省南京市玄武区', address: '玄武大道1号苏宁总部行政中心', mallSku: 'S001A00008001', subNo: 'JC2026081500301', name: '加厚保暖羽绒服', qty: 10, status: 'signed', express: '德邦快递', waybill: 'DB20260825001' },
        { id: 'DP15002', recipient: '吴强', phone: '13705180101', region: '江苏省南京市栖霞区', address: '仙林大道168号仓库行政', mallSku: 'S001A00008001', subNo: 'JC2026081500301', name: '加厚保暖羽绒服', qty: 10, status: 'signed', express: '德邦快递', waybill: 'DB20260825001' },
        { id: 'DP15003', recipient: '郑洁', phone: '13705180102', region: '江苏省徐州市云龙区', address: '淮海东路66号徐州门店', mallSku: 'S001A00008001', subNo: 'JC2026081500301', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260825001' },
        { id: 'DP15004', recipient: '黄磊', phone: '13705180103', region: '江苏省常州市天宁区', address: '延陵中路88号常州门店', mallSku: 'S001A00008001', subNo: 'JC2026081500301', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260825001' },
        { id: 'DP15005', recipient: '马超', phone: '13705180104', region: '江苏省苏州市工业园区', address: '现代大道18号苏州门店', mallSku: 'S001A00008001', subNo: 'JC2026081500301', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260825001' },
        { id: 'DP15006', recipient: '林悦', phone: '13705180105', region: '江苏省无锡市梁溪区', address: '中山路120号无锡门店', mallSku: 'S001A00008001', subNo: 'JC2026081500301', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260825001' },
        { id: 'DP15007', recipient: '刘振华', phone: '13705183456', region: '江苏省南京市玄武区', address: '玄武大道1号苏宁总部行政中心', mallSku: 'S001A00008003', subNo: 'JC2026081500302', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260826002' },
        { id: 'DP15008', recipient: '吴强', phone: '13705180101', region: '江苏省南京市栖霞区', address: '仙林大道168号仓库行政', mallSku: 'S001A00008003', subNo: 'JC2026081500302', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260826002' },
        { id: 'DP15009', recipient: '郑洁', phone: '13705180102', region: '江苏省徐州市云龙区', address: '淮海东路66号徐州门店', mallSku: 'S001A00008003', subNo: 'JC2026081500302', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260826002' },
        { id: 'DP15010', recipient: '黄磊', phone: '13705180103', region: '江苏省常州市天宁区', address: '延陵中路88号常州门店', mallSku: 'S001A00008003', subNo: 'JC2026081500302', name: '加厚保暖羽绒服', qty: 10, status: 'shipped', express: '德邦快递', waybill: 'DB20260826002' },
        { id: 'DP15011', recipient: '马超', phone: '13705180104', region: '江苏省苏州市工业园区', address: '现代大道18号苏州门店', mallSku: 'S001A00008003', subNo: 'JC2026081500302', name: '加厚保暖羽绒服', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15012', recipient: '林悦', phone: '13705180105', region: '江苏省无锡市梁溪区', address: '中山路120号无锡门店', mallSku: 'S001A00008003', subNo: 'JC2026081500302', name: '加厚保暖羽绒服', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15013', recipient: '刘振华', phone: '13705183456', region: '江苏省南京市玄武区', address: '玄武大道1号苏宁总部行政中心', mallSku: 'S001A00012001', subNo: 'JC2026081500303', name: '户外防水冲锋衣', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15014', recipient: '吴强', phone: '13705180101', region: '江苏省南京市栖霞区', address: '仙林大道168号仓库行政', mallSku: 'S001A00012001', subNo: 'JC2026081500303', name: '户外防水冲锋衣', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15015', recipient: '郑洁', phone: '13705180102', region: '江苏省徐州市云龙区', address: '淮海东路66号徐州门店', mallSku: 'S001A00012001', subNo: 'JC2026081500303', name: '户外防水冲锋衣', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15016', recipient: '黄磊', phone: '13705180103', region: '江苏省常州市天宁区', address: '延陵中路88号常州门店', mallSku: 'S001A00012001', subNo: 'JC2026081500303', name: '户外防水冲锋衣', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15017', recipient: '马超', phone: '13705180104', region: '江苏省苏州市工业园区', address: '现代大道18号苏州门店', mallSku: 'S001A00012001', subNo: 'JC2026081500303', name: '户外防水冲锋衣', qty: 10, status: 'locked', express: '', waybill: '' },
        { id: 'DP15018', recipient: '林悦', phone: '13705180105', region: '江苏省无锡市梁溪区', address: '中山路120号无锡门店', mallSku: 'S001A00012001', subNo: 'JC2026081500303', name: '户外防水冲锋衣', qty: 10, status: 'locked', express: '', waybill: '' }
      ],
      items: [
        { subNo: 'JC2026081500301', mallSku: 'S001A00008001', name: '加厚保暖羽绒服', brand: '波司登', model: 'DOWN-401', spec: '黑色,M', qty: 60, costPrice: 165, agreePrice: 198, supplier: '星辰商贸', supplySku: 'HZ-A00008-001-JC', status: 'shipped', deliveryDays: 15, deliveryDeadline: '2026-08-30 23:59', distributeRows: 6, distributeShipped: 6, distributeSigned: 2, express: '德邦快递', waybill: 'DB20260825001', opsRemark: '' },
        { subNo: 'JC2026081500302', mallSku: 'S001A00008003', name: '加厚保暖羽绒服', brand: '波司登', model: 'DOWN-401', spec: '黑色,XL', qty: 60, costPrice: 160, agreePrice: 192, supplier: '星辰商贸', supplySku: 'HZ-A00008-003-JC', status: 'pending_ship', deliveryDays: 15, deliveryDeadline: '2026-08-30 23:59', distributeRows: 6, distributeShipped: 4, distributeSigned: 0, express: '德邦快递', waybill: 'DB20260826002', opsRemark: 'XL 码分两批发' },
        { subNo: 'JC2026081500303', mallSku: 'S001A00012001', name: '户外防水冲锋衣', brand: '探路者', model: 'JKT-880', spec: '藏青,L', qty: 60, costPrice: 238, agreePrice: 285, supplier: '环球优选', supplySku: 'HZ-A00012-001-JC', status: 'pending_ship', deliveryDays: 15, deliveryDeadline: '2026-09-02 23:59', distributeRows: 6, distributeShipped: 0, distributeSigned: 0, opsRemark: '供方拣货中' }
      ]
    },
    {
      id: 'JC20260808004', quoteId: 'XQ20260728011', quoteVersion: 'V1',
      customer: '南京市第一医院', customerShort: '南京一院',
      customerBuyer: '周敏', customerBuyerPhone: '13605184567',
      sales: '王专员', status: 'shipped',
      createdAt: '2026-08-08 10:05', updatedAt: '2026-08-25 18:40',
      costTotal: 121600, agreeTotal: 145000, itemCount: 2, qtyTotal: 80,
      itemsPreview: 'OPPO Find X8、无线降噪蓝牙耳机',
      remark: '整单发至院办统一签收（仅 1 个收货地址）', addressSource: 'customer',
      distributeRows: 2, distributeLocked: 2, distributeShipped: 2, distributeSigned: 0,
      pushError: '',
      distributePlan: [
        { id: 'DP08001', recipient: '周敏', phone: '13605184567', region: '江苏省南京市鼓楼区', address: '中山路321号行政楼3楼院办（统一签收）', mallSku: 'S002A00003001', subNo: 'JC2026080800401', name: 'OPPO Find X8', qty: 30, status: 'shipped', express: '顺丰速运', waybill: 'SF20260820088' },
        { id: 'DP08002', recipient: '周敏', phone: '13605184567', region: '江苏省南京市鼓楼区', address: '中山路321号行政楼3楼院办（统一签收）', mallSku: 'S001A00010001', subNo: 'JC2026080800402', name: '无线降噪蓝牙耳机', qty: 50, status: 'shipped', express: '中通快递', waybill: 'ZTO20260821045' }
      ],
      items: [
        { subNo: 'JC2026080800401', mallSku: 'S002A00003001', name: 'OPPO Find X8', brand: 'OPPO', model: 'Find X8', spec: '星野黑,12+256GB', qty: 30, costPrice: 3850, agreePrice: 4200, supplier: 'OPPO官方旗舰店', supplySku: 'HZ-B00003-001-JC', status: 'shipped', deliveryDays: 7, deliveryDeadline: '2026-08-15 23:59', distributeRows: 1, distributeShipped: 1, distributeSigned: 0, express: '顺丰速运', waybill: 'SF20260820088', opsRemark: '' },
        { subNo: 'JC2026080800402', mallSku: 'S001A00010001', name: '无线降噪蓝牙耳机', brand: '漫步者', model: 'BUD-990', spec: '黑色', qty: 50, costPrice: 122, agreePrice: 380, supplier: '星辰商贸', supplySku: 'HZ-A00010-001-JC', status: 'shipped', deliveryDays: 7, deliveryDeadline: '2026-08-15 23:59', distributeRows: 1, distributeShipped: 1, distributeSigned: 0, express: '中通快递', waybill: 'ZTO20260821045', opsRemark: '' }
      ]
    },
    {
      id: 'JC20260720005', quoteId: 'XQ20260710012', quoteVersion: 'V2',
      customer: '江苏银行股份有限公司', customerShort: '江苏银行',
      customerBuyer: '王启航', customerBuyerPhone: '13805181234',
      sales: '张晗', status: 'completed',
      createdAt: '2026-07-20 14:00', updatedAt: '2026-08-05 11:22',
      costTotal: 8160, agreeTotal: 9240, itemCount: 2, qtyTotal: 240,
      itemsPreview: '有机山茶油500ml、有机绿茶礼盒装',
      remark: '端午员工福利', addressSource: 'platform',
      distributeRows: 12, distributeLocked: 12, distributeShipped: 12, distributeSigned: 12,
      pushError: '',
      distributePlan: [
        { id: 'DP07001', recipient: '王启航', phone: '13805181234', region: '江苏省南京市建邺区', address: '江东中路399号江苏银行大厦人力资源部', mallSku: 'S001A00015001', subNo: 'JC2026072000501', name: '有机山茶油500ml', qty: 30, status: 'signed', express: '圆通快递', waybill: 'YT20260728011' },
        { id: 'DP07002', recipient: '刘芳', phone: '13805180011', region: '江苏省苏州市姑苏区', address: '干将东路999号苏州分行综合部', mallSku: 'S001A00015001', subNo: 'JC2026072000501', name: '有机山茶油500ml', qty: 30, status: 'signed', express: '圆通快递', waybill: 'YT20260728011' },
        { id: 'DP07003', recipient: '陈刚', phone: '13805180022', region: '江苏省无锡市梁溪区', address: '中山路288号无锡分行办公室', mallSku: 'S001A00015001', subNo: 'JC2026072000501', name: '有机山茶油500ml', qty: 30, status: 'signed', express: '圆通快递', waybill: 'YT20260728011' },
        { id: 'DP07004', recipient: '赵敏', phone: '13805180033', region: '江苏省常州市天宁区', address: '延陵中路66号常州分行', mallSku: 'S001A00015001', subNo: 'JC2026072000501', name: '有机山茶油500ml', qty: 30, status: 'signed', express: '圆通快递', waybill: 'YT20260728011' },
        { id: 'DP07005', recipient: '孙伟', phone: '13805180044', region: '江苏省南通市崇川区', address: '工农路188号南通分行', mallSku: 'S001A00015001', subNo: 'JC2026072000501', name: '有机山茶油500ml', qty: 30, status: 'signed', express: '圆通快递', waybill: 'YT20260728011' },
        { id: 'DP07006', recipient: '周倩', phone: '13805180055', region: '江苏省徐州市云龙区', address: '淮海东路77号徐州分行', mallSku: 'S001A00015001', subNo: 'JC2026072000501', name: '有机山茶油500ml', qty: 30, status: 'signed', express: '圆通快递', waybill: 'YT20260728011' },
        { id: 'DP07007', recipient: '王启航', phone: '13805181234', region: '江苏省南京市建邺区', address: '江东中路399号江苏银行大厦人力资源部', mallSku: 'S001A00021001', subNo: 'JC2026072000502', name: '有机绿茶礼盒装', qty: 10, status: 'signed', express: '圆通快递', waybill: 'YT20260728012' },
        { id: 'DP07008', recipient: '刘芳', phone: '13805180011', region: '江苏省苏州市姑苏区', address: '干将东路999号苏州分行综合部', mallSku: 'S001A00021001', subNo: 'JC2026072000502', name: '有机绿茶礼盒装', qty: 10, status: 'signed', express: '圆通快递', waybill: 'YT20260728012' },
        { id: 'DP07009', recipient: '陈刚', phone: '13805180022', region: '江苏省无锡市梁溪区', address: '中山路288号无锡分行办公室', mallSku: 'S001A00021001', subNo: 'JC2026072000502', name: '有机绿茶礼盒装', qty: 10, status: 'signed', express: '圆通快递', waybill: 'YT20260728012' },
        { id: 'DP07010', recipient: '赵敏', phone: '13805180033', region: '江苏省常州市天宁区', address: '延陵中路66号常州分行', mallSku: 'S001A00021001', subNo: 'JC2026072000502', name: '有机绿茶礼盒装', qty: 10, status: 'signed', express: '圆通快递', waybill: 'YT20260728012' },
        { id: 'DP07011', recipient: '孙伟', phone: '13805180044', region: '江苏省南通市崇川区', address: '工农路188号南通分行', mallSku: 'S001A00021001', subNo: 'JC2026072000502', name: '有机绿茶礼盒装', qty: 10, status: 'signed', express: '圆通快递', waybill: 'YT20260728012' },
        { id: 'DP07012', recipient: '周倩', phone: '13805180055', region: '江苏省徐州市云龙区', address: '淮海东路77号徐州分行', mallSku: 'S001A00021001', subNo: 'JC2026072000502', name: '有机绿茶礼盒装', qty: 10, status: 'signed', express: '圆通快递', waybill: 'YT20260728012' }
      ],
      items: [
        { subNo: 'JC2026072000501', mallSku: 'S001A00015001', name: '有机山茶油500ml', brand: '金龙鱼', model: 'OIL-021', spec: '500ml', qty: 180, costPrice: 25.5, agreePrice: 32, supplier: '恒通供应链', supplySku: 'HZ-A00015-001-JC', status: 'completed', deliveryDays: 7, deliveryDeadline: '2026-07-27 23:59', distributeRows: 6, distributeShipped: 6, distributeSigned: 6, express: '圆通快递', waybill: 'YT20260728011', opsRemark: '' },
        { subNo: 'JC2026072000502', mallSku: 'S001A00021001', name: '有机绿茶礼盒装', brand: '八马', model: 'TEA-200', spec: '250g礼盒', qty: 60, costPrice: 51, agreePrice: 38, supplier: '环球优选', supplySku: 'HZ-A00021-001-JC', status: 'completed', deliveryDays: 7, deliveryDeadline: '2026-07-27 23:59', distributeRows: 6, distributeShipped: 6, distributeSigned: 6, express: '圆通快递', waybill: 'YT20260728012', opsRemark: '' }
      ]
    },
  ],

  // ============================================================
  // 表:选品清单
  // ============================================================
  shoppingLists: [
    { id:'L1', name:'2024-Q2-锦程积分选品', creator:'李运营', productCount:8, collabCount:3, collabIds:[0,1,2], status:'active', lastTime:'2026-05-15 16:30' },
    { id:'L2', name:'锦程员工福利-夏季清凉专场', creator:'李运营', productCount:12, collabCount:4, collabIds:[0,1,2,3], status:'active', lastTime:'2026-05-14 14:22' },
    { id:'L3', name:'泡泡玛特官方商城-数码品类', creator:'王专员', productCount:5, collabCount:2, collabIds:[0,1], status:'active', lastTime:'2026-05-13 10:05' },
    { id:'L4', name:'618大促-精选爆品清单', creator:'张选品', productCount:16, collabCount:5, collabIds:[0,1,2,3], status:'active', lastTime:'2026-05-12 09:48' },
    { id:'L5', name:'2024-Q1-春节礼盒专场', creator:'李运营', productCount:20, collabCount:3, collabIds:[0,1,2], status:'archived', lastTime:'2026-03-01 11:20' },
    { id:'L6', name:'双11-美妆护肤精选', creator:'赵经理', productCount:14, collabCount:2, collabIds:[0,3], status:'archived', lastTime:'2025-11-15 18:00' },
  ],

  // ============================================================
  // 表:商品↔清单映射 (productId → [listId, ...])
  // ============================================================
  productListMap: {
    101: ['L1'],
    102: ['L1', 'L2'],
    104: ['L2'],
    107: ['L3'],
    111: ['L4'],
    115: ['L3', 'L4'],
    120: ['L2'],
  },

  // ============================================================
  // 表:渠道(品牌商城)
  // ============================================================
  channels: [
    { id:'C1', name:'锦程员工福利商城' },
    { id:'C2', name:'锦程积分商城' },
    { id:'C3', name:'泡泡玛特官方商城' },
    { id:'C4', name:'蓝海分销商城' },
    { id:'C5', name:'苏银豆商城' },
    { id:'C6', name:'泡泡玛特企业购' },
  ],

  // ============================================================
  // 表:商品↔渠道映射 (productId → [channelId, ...])
  // ============================================================
  productChannelMap: {
    101: ['C1', 'C2'],
    102: ['C1'],
    104: ['C1', 'C2', 'C5'],
    106: ['C5'],
    105: ['C3'],
    107: ['C1', 'C3'],
    111: ['C2'],
    115: ['C4'],
    118: ['C3'],
    123: ['C2', 'C4'],
    126: ['C1'],
    128: ['C3', 'C4'],
    131: ['C1', 'C2'],
    132: ['C3'],
    133: ['C1', 'C3'],
    135: ['C4'],
    136: ['C1'],
    137: ['C2', 'C3'],
    141: ['C4'],
    142: ['C2', 'C4'],
  },

  // ============================================================
  // 池统计(原型 Mock,不受列表筛选影响;正式环境由接口聚合)
  // ============================================================
  poolStatsMeta: {
    total: 3156,
    delisted7d: 12,
    listed7d: 38,
    listedToday: 6,
  },

  // 一件代发商品池统计(池内子集口径,SKU 含 -DF 履约后缀)
  dropshipStatsMeta: {
    total: 2874,
    delisted7d: 9,
    listed7d: 31,
    listedToday: 5,
  },

  // 集采直发商品池统计(池内子集口径,商品库行级 jc:true 标记)
  jicaiStatsMeta: {
    total: 1936,
    delisted7d: 4,
    listed7d: 18,
    listedToday: 3,
  },

  // ============================================================
  // 表:商品标签池
  // ============================================================
  tagPool: [
    { label: '热销款', cls: 'tag-hot' },
    { label: '新品上市', cls: 'tag-new' },
    { label: '最优性价比', cls: 'tag-best' },
    { label: '稳定供货', cls: 'tag-stable' },
    { label: '品质优选', cls: 'tag-quality' },
    { label: '限时促销', cls: 'tag-promo' },
  ],

  // ============================================================
  // 表:选品清单条目 (02.选品清单管理) — 引用式
  // supplySku → supplyProducts.sku,商品主数据(名称/规格/价格/供应商)只在商品池存一份;
  // status/listId/addedTime 为清单态,note 覆盖失效原因,组合商品附 comboType/comboSuppliers
  // ============================================================
  selectionItems: [
    { id:1, supplySku:'HZ-A00009-001-DF', listId:'L1', addedTime:'2026-05-15 10:30', status:'normal' },
    { id:2, supplySku:'HZ-A00003-001-DF', listId:'L2', addedTime:'2026-05-14 09:15', status:'normal' },
    { id:3, supplySku:'HZ-A00005-001-DF', listId:'L1', addedTime:'2026-05-13 14:20', status:'invalid', note:'供应商已下架' },
    { id:4, supplySku:'HZ-A00004-001-DF', listId:'L4', addedTime:'2026-05-12 16:45', status:'normal' },
    { id:5, supplySku:'HZ-A00008-001-DF', listId:'L2', addedTime:'2026-05-11 08:00', status:'normal' },
    { id:6, supplySku:'HZ-A00006-001-DF', listId:'L3', addedTime:'2026-05-14 11:30', status:'invalid', note:'供应商已删除' },
    { id:7, supplySku:'HZ-A00007-001-DF', listId:'L3', addedTime:'2026-05-13 13:10', status:'normal' },
    { id:8, supplySku:'HZXN-A00001-001-KM', listId:'L1', addedTime:'2026-05-15 15:00', status:'normal' },
    { id:9, supplySku:'HZXN-A00002-001-ZC', listId:'L4', addedTime:'2026-05-14 17:20', status:'normal' },
    { id:10, supplySku:'HZXN-A00003-001-ZC', listId:'L2', addedTime:'2026-05-10 12:00', status:'normal' },
    { id:11, supplySku:'HZ-A00010-001-DF', listId:'L4', addedTime:'2026-05-12 09:30', status:'normal' },
    { id:12, supplySku:'HZ-A00011-001-DF', listId:'L4', addedTime:'2026-05-11 10:00', status:'invalid', note:'库存耗尽' },
    // ===== 组合商品 =====
    { id:101, supplySku:'HZZH-A00001-001', listId:'L1', addedTime:'2026-06-20 10:00', status:'normal', comboType:'combo', comboSuppliers:'星辰商贸' },
    { id:102, supplySku:'HZZH-A00002-001', listId:'L1', addedTime:'2026-06-22 14:30', status:'normal', comboType:'gift', comboSuppliers:'恒通供应链等2个供应商' },
  ],

  // ============================================================
  // 表:选品域 商品↔渠道映射 (selectionItems.id → [channelId])
  // ============================================================
  selectionChannelMap: {
    1: ['C1', 'C2'],
    2: ['C1'],
    4: ['C3'],
    7: ['C1', 'C3'],
    8: ['C2'],
    9: ['C4'],
    11: ['C2', 'C4'],
  },

  // ============================================================
  // 表:批量导入预检 Mock (02 页导入弹窗)
  // existsInPool=货源是否有效; existsInList=是否已在当前清单
  // ============================================================
  selectionImportItems: [
    { name: '夏季纯棉圆领T恤', existsInPool: true, existsInList: true },
    { name: '智能手表运动版', existsInPool: false },
    { name: '不锈钢保温杯500ml', existsInPool: true },
    { name: '便携式蓝牙音箱', existsInPool: false },
    { name: '无线降噪蓝牙耳机', existsInPool: true, existsInList: true },
    { name: '有机绿茶礼盒装', existsInPool: false },
    { name: '智能蓝牙体脂秤', existsInPool: true },
    { name: '真皮男士腰带', existsInPool: false },
    { name: '车载空气净化器', existsInPool: false },
    { name: '4K超清智能投影仪', existsInPool: true },
    { name: '加厚保暖羽绒服', existsInPool: true },
    { name: '儿童益智积木套装', existsInPool: false },
  ],

  // ============================================================
  // 表:批量导入生成器 Mock 池 (02 页 simulateImport)
  // ============================================================
  selectionImportPools: {
    suppliers: ['星辰商贸', '恒通供应链', '鹏程优品', '环球优选', '数字服务商A'],
    brands: ['小米', '华为', '森马', '优衣库', '富光', '极米', '漫步者', '联想'],
    types: ['physical', 'physical', 'physical', 'physical', 'physical', 'physical', 'physical', 'physical', 'physical', 'physical', 'physical', 'virtual'],
  },

  // ============================================================
  // 表:定价推品 SKU (02a.定价推品配置页,直接打开时的演示数据)
  // 取自商品池主数据真实 SPU(一品多商/多规格);SPU名 = 品牌 + 商品名,与其他页一致
  // 注:spu 与 spuName 同值冗余 —— 页面历史读 spu.spuName,兼容两处取值
  // ============================================================
  pricingSkus: [
    { spu: '富光 不锈钢保温杯500ml', spuName: '富光 不锈钢保温杯500ml', spuCode: 'ZD-A00004', spuThumb: '富光',
      skus: [
        { id: 'HZ-A00004-001-DF', spec: '银色,500ml', supply: 34.5, ecom: 68, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00004-002-DF', spec: '黑色,500ml', supply: 36, ecom: 72, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00091-001-DF', spec: '白色,500ml', supply: 33, ecom: 65, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
      ]
    },
    { spu: '波司登 加厚保暖羽绒服', spuName: '波司登 加厚保暖羽绒服', spuCode: 'ZD-A00008', spuThumb: '波司',
      skus: [
        { id: 'HZ-A00008-001-DF', spec: '黑色,M', supply: 180, ecom: 359, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00008-002-DF', spec: '黑色,L', supply: 190, ecom: 379, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00092-001-DF', spec: '黑色,XL', supply: 175, ecom: 349, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00008-004-DF', spec: '藏青,XXL', supply: 200, ecom: 399, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
      ]
    },
    { spu: '奥康 男士商务休闲皮鞋', spuName: '奥康 男士商务休闲皮鞋', spuCode: 'ZD-A00006', spuThumb: '奥康',
      skus: [
        { id: 'HZ-A00006-001-DF', spec: '黑色,41码', supply: 100, ecom: 259, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00094-001-DF', spec: '棕色,42码', supply: 105, ecom: 269, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
        { id: 'HZ-A00006-003-DF', spec: '棕色,43码', supply: 98, ecom: 249, channelPrice: '', channelPrices: {}, strikePrice: '', strikePrices: {}, mallPrice: '', mallPrices: {}, edited: false },
      ]
    }
  ],

  // ============================================================
  // 表:定价推品可选渠道 (含销售模式,入驻时预置)
  // ============================================================
  pricingChannels: [
    { name: '锦程员工福利商城', salesMode: 'direct' },
    { name: '锦程积分商城', salesMode: 'distribution' },
    { name: '泡泡玛特官方商城', salesMode: 'distribution' },
    { name: '泡泡玛特企业购', salesMode: 'direct' },
    { name: '社区公益点', salesMode: 'direct' },
  ],

  // ============================================================
  // 表:待处理选品队列 (03.待处理选品;并入自 data-pending-pool.js,
  // 离群价已按商品池基准修正:体脂秤/口罩)
  // 注:取数时按 time 倒序(见文件尾部初始化)
  // ============================================================
  pendingData: [
    { id:1, type:'outage', typeLabel:'断供提醒', product:'加厚保暖羽绒服', brand:'波司登', spec:'黑色,M', sku:'HZ-A00008-001-DF', mallSku:'S001A00012001', channel:'泡泡玛特官方商城', supplier:'环球优选', supplyPrice:'¥180.00', channelPrice:'¥359.00', reason:'供应商[环球优选]已将此商品下架，已被系统转为不可售，请及时寻找替代品', actions:['confirm'], time:'2026-05-14 14:22', sourceType:'存量巡检' },
    { id:2, type:'cost', typeLabel:'成本变动', product:'女士直筒休闲长裤', brand:'优衣库', spec:'黑色,M', sku:'HZ-A00005-001-DF', mallSku:'S001A00005001', channel:'锦程员工福利商城', supplier:'鹏程优品', supplyPrice:'¥95.00', channelPrice:'¥169.00', reason:'供应商已调价，商品已被系统转为不可售。原供货价 ¥80 → 现供货价 ¥95', actions:['accept','forceDelist'], time:'2026-05-14 10:15', sourceType:'存量巡检' },
    { id:3, type:'conflict', typeLabel:'渠道冲突', product:'夏季纯棉圆领T恤', brand:'森马', spec:'白色,M', sku:'HZ-A00009-001-DF', mallSku:'S001A00002001', channel:'锦程员工福利商城', supplier:'星辰商贸', supplyPrice:'¥85.00', channelPrice:'¥129.00', reason:'商城 [锦程员工福利商城] 已存在同款在售 (供应链SKU: HZ-A00083-001-DF)', actions:['compare','cancelList'], time:'2026-05-13 16:48', sourceType:'清单推品' },
    { id:4, type:'supplier', typeLabel:'供应商优化', product:'智能蓝牙体脂秤', brand:'小米', spec:'白色', sku:'HZ-A00003-001-DF', mallSku:'S001A00003001', channel:'锦程员工福利商城', supplier:'恒通供应链', supplyPrice:'¥95.00', channelPrice:'¥189.00', reason:'存在更低价供应商星辰商贸HZ-A00084-001-DF (供货价：¥90)，当前差价 ¥5', actions:['switch','approval'], time:'2026-05-13 09:30', sourceType:'渠道导入' },
    { id:5, type:'profit', typeLabel:'利润预警', product:'男士商务休闲皮鞋', brand:'奥康', spec:'黑色,41码', sku:'HZ-A00006-001-DF', mallSku:'S001A00006001', channel:'锦程积分商城', supplier:'恒通供应链', supplyPrice:'¥100.00', channelPrice:'¥90.00', reason:'供货价 ¥100 > 渠道价 ¥90，预计亏损 ¥10/单', actions:['applyList','cancelList'], time:'2026-05-12 15:12', sourceType:'清单推品' },
    { id:6, type:'duplicate', typeLabel:'重复数据', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥35.00', channelPrice:'¥69.00', reason:'[不锈钢保温杯500ml] 商品重复，存在 3 条重复数据', actions:['ignore','resubmit'], time:'2026-05-12 11:05', sourceType:'渠道导入' },
    { id:7, type:'duplicate', typeLabel:'重复数据', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥36.00', channelPrice:'¥72.00', reason:'[不锈钢保温杯500ml] 商品重复，存在 3 条重复数据（重复项 2/3）', actions:['ignore','resubmit'], time:'2026-05-12 11:05', sourceType:'渠道导入' },
    { id:8, type:'duplicate', typeLabel:'重复数据', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥34.50', channelPrice:'¥68.00', reason:'[不锈钢保温杯500ml] 商品重复，存在 3 条重复数据（重复项 3/3）', actions:['ignore','resubmit'], time:'2026-05-12 11:05', sourceType:'渠道导入' },
    { id:9, type:'codeConflict', typeLabel:'编码冲突', product:'3M 9001V KN95口罩', brand:'3M', spec:'蓝色,常规', sku:'HZ-A00081-001-DF', mallSku:'S001A00001001', channel:'锦程员工福利商城', supplier:'星辰商贸', supplyPrice:'¥16.80', channelPrice:'¥129.00', reason:'供应链同款组 SAME-MASK-004 关联了2个不同的商城SPU。主SPU: S001A00001 "3M 9001V KN95口罩"，冲突SPU: S001A00002 "3M口罩9001V蓝"。建议将冲突SPU并入主SPU', actions:['confirmMerge','ignore'], time:'2026-06-26 08:30', sourceType:'存量巡检' },
    { id:10, type:'outage', typeLabel:'断供提醒', product:'男士商务休闲皮鞋', brand:'奥康', spec:'黑色,41码', sku:'HZ-A00006-001-DF', mallSku:'S001A00006001', channel:'锦程积分商城', supplier:'恒通供应链', supplyPrice:'¥100.00', channelPrice:'¥259.00', reason:'供应商[恒通供应链]已将此商品下架，已被系统转为不可售，请及时寻找替代品', actions:['confirm'], time:'2026-06-25 16:30', sourceType:'存量巡检' },
    { id:11, type:'cost', typeLabel:'成本变动', product:'有机山茶油500ml', brand:'金龙鱼', spec:'500ml', sku:'HZ-A00015-001-DF', mallSku:'S001A00013001', channel:'泡泡玛特官方商城', supplier:'恒通供应链', supplyPrice:'¥30.00', channelPrice:'¥59.00', reason:'供应商已调价，商品已被系统转为不可售。原供货价 ¥28 → 现供货价 ¥30', actions:['accept','forceDelist'], time:'2026-06-24 09:20', sourceType:'存量巡检' },
    { id:12, type:'cost', typeLabel:'成本变动', product:'儿童防蓝光眼镜', brand:'可得', spec:'蓝,通用', sku:'HZ-A00022-001-DF', mallSku:'S001A00014001', channel:'蓝海分销商城', supplier:'星辰商贸', supplyPrice:'¥68.00', channelPrice:'¥139.00', reason:'供应商已调价，商品已被系统转为不可售。原供货价 ¥62 → 现供货价 ¥68', actions:['accept','forceDelist'], time:'2026-06-23 14:10', sourceType:'存量巡检' },
    { id:13, type:'conflict', typeLabel:'渠道冲突', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'锦程员工福利商城', supplier:'星辰商贸', supplyPrice:'¥34.50', channelPrice:'¥68.00', reason:'商城 [锦程员工福利商城] 已存在同款在售 (供应链SKU: HZ-A00004-002-DF)', actions:['compare','cancelList'], time:'2026-06-22 11:00', sourceType:'清单推品' },
    { id:14, type:'supplier', typeLabel:'供应商优化', product:'户外防水冲锋衣', brand:'探路者', spec:'藏青,L', sku:'HZ-A00012-001-DF', mallSku:'S001A00019001', channel:'蓝海分销商城', supplier:'环球优选', supplyPrice:'¥260.00', channelPrice:'¥499.00', reason:'存在更低价供应商鹏程优品HZ-A00012-002-DF (供货价：¥245)，当前差价 ¥15', actions:['switch','approval'], time:'2026-06-21 08:45', sourceType:'渠道导入' },
    { id:15, type:'profit', typeLabel:'利润预警', product:'有机绿茶礼盒装', brand:'八马', spec:'250g礼盒', sku:'HZ-A00021-001-DF', mallSku:'S001A00018001', channel:'锦程积分商城', supplier:'环球优选', supplyPrice:'¥56.00', channelPrice:'¥48.00', reason:'供货价 ¥56 > 渠道价 ¥48，预计亏损 ¥8/单', actions:['applyList','cancelList'], time:'2026-06-20 13:20', sourceType:'清单推品' },
    { id:16, type:'codeConflict', typeLabel:'编码冲突', product:'OPPO Find X8', brand:'OPPO', spec:'星野黑,12+256GB', sku:'HZ-B00003-001-DF', mallSku:'S002A00001001', channel:'锦程员工福利商城', supplier:'OPPO官方旗舰店', supplyPrice:'¥3,999.00', channelPrice:'¥4,299.00', reason:'供应链同款组 SAME-FINDX8-001 关联了2个不同的商城SPU。主SPU: S002A00001 "OPPO Find X8"，冲突SPU: S002A00002 "OPPO Find X8 旗舰版"。建议将冲突SPU并入主SPU', actions:['confirmMerge','ignore'], time:'2026-06-19 17:00', sourceType:'存量巡检' },
    { id:17, type:'outage', typeLabel:'断供提醒', product:'电子书阅读器青春版', brand:'掌阅', spec:'黑色,6英寸', sku:'HZ-A00011-001-DF', mallSku:'S001A00015001', channel:'泡泡玛特官方商城', supplier:'恒通供应链', supplyPrice:'¥220.00', channelPrice:'¥399.00', reason:'供应商[恒通供应链]已将此商品删除，已被系统转为不可售，请及时寻找替代品', actions:['confirm'], time:'2026-06-18 10:30', sourceType:'存量巡检' },
    { id:18, type:'supplier', typeLabel:'供应商优化', product:'加厚保暖羽绒服', brand:'波司登', spec:'藏青,XXL', sku:'HZ-A00008-004-DF', mallSku:'S001A00012001', channel:'锦程积分商城', supplier:'环球优选', supplyPrice:'¥200.00', channelPrice:'¥399.00', reason:'存在更低价供应商恒通供应链HZ-A00092-001-DF (供货价：¥175)，当前差价 ¥25', actions:['switch','approval'], time:'2026-06-17 15:00', sourceType:'渠道导入' },
    { id:19, type:'outage', typeLabel:'断供提醒', product:'—', sku:'HZ-X00099-001-DF-ZZZ', channel:'蓝海分销商城', supplier:'—', supplyPrice:'—', channelPrice:'—', reason:'供应链无匹配商品数据或品牌商城编码填写有误或商品已下架，请检查是否填写有误', actions:['confirm'], time:'2026-06-16 14:00', sourceType:'渠道导入' },
    { id:20, type:'outage', typeLabel:'断供提醒', product:'—', sku:'HZ-X00100-002-DF-YYY', channel:'锦程员工福利商城', supplier:'—', supplyPrice:'—', channelPrice:'—', reason:'供应链无匹配商品数据或品牌商城编码填写有误或商品已下架，请检查是否填写有误', actions:['confirm'], time:'2026-06-15 09:30', sourceType:'渠道导入' },
    { id:21, type:'supplier', typeLabel:'供应商优化', product:'有机山茶油500ml', brand:'金龙鱼', spec:'500ml', sku:'HZ-A00015-001-DF', mallSku:'S001A00013001', channel:'泡泡玛特官方商城', supplier:'恒通供应链', supplyPrice:'¥30.00', channelPrice:'¥59.00', reason:'存在更低价供应商星辰商贸HZ-A00087-001-DF (供货价：¥27)，当前差价 ¥3', actions:['switch','approval'], time:'2026-06-28 10:30', sourceType:'存量巡检' },
    { id:22, type:'supplier', typeLabel:'供应商优化', product:'新疆纯牛奶200ml*12', brand:'天润', spec:'200ml*12盒', sku:'HZ-A00096-001-DF', mallSku:'C001A00001001', channel:'泡泡玛特官方商城', supplier:'恒通供应链', supplyPrice:'¥45.00', channelPrice:'¥79.00', reason:'组合商品[天润 家庭营养过年礼包 组合套装A]子件[新疆纯牛奶]存在更低价供应商鹏程优品HZ-A00088-001-DF (供货价：¥42)，当前差价 ¥3', actions:['switch','approval'], time:'2026-07-05 09:15', sourceType:'存量巡检' },
    { id:23, type:'supplier', typeLabel:'供应商优化', product:'有机黑木耳200g', brand:'北大荒', spec:'200g', sku:'HZ-A00097-001-DF', mallSku:'C002A00001001', channel:'锦程员工福利商城', supplier:'环球优选', supplyPrice:'¥28.00', channelPrice:'¥49.00', reason:'组合商品[北大荒 养生食材礼盒 组合套装B]子件[有机黑木耳]存在更低价供应商星辰商贸HZ-A00089-001-DF (供货价：¥25)，当前差价 ¥3', actions:['switch','approval'], time:'2026-07-04 14:30', sourceType:'清单推品' },
    { id:24, type:'conflict', typeLabel:'渠道冲突', product:'家用便携式榨汁机', brand:'美的', spec:'白色,600ml', sku:'HZ-A00102-001-DF', mallSku:'S001A00016001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥89.00', channelPrice:'¥159.00', reason:'该商品已在商城 [泡泡玛特官方商城] 上架在售 (SKU: HZ-A00102-001-DF)，本次为重复推品，请复查是否需改价或调整', actions:['compare','cancelList'], time:'2026-07-29 10:20', sourceType:'清单推品' },
    { id:25, type:'conflict', typeLabel:'渠道冲突', product:'每日坚果混合礼盒', brand:'沃隆', spec:'750g礼盒', sku:'HZ-A00103-001-DF', mallSku:'S001A00017001', channel:'锦程员工福利商城', supplier:'环球优选', supplyPrice:'¥68.00', channelPrice:'¥128.00', reason:'该商品已在商城 [锦程员工福利商城] 上架在售 (SKU: HZ-A00103-001-DF)，本次为重复推品，请复查是否需改价或调整', actions:['compare','cancelList'], time:'2026-07-28 15:45', sourceType:'清单推品' }
  ],

  // ============================================================
  // 表:待处理选品-已关闭队列 (03 页"已关闭"Tab)
  // ============================================================
  pendingClosedData: [
    { typeLabel:'断供提醒', type:'outage', product:'加厚保暖羽绒服', brand:'波司登', spec:'黑色,M', sku:'HZ-A00008-001-DF', mallSku:'S001A00012001', channel:'泡泡玛特官方商城', supplier:'环球优选', supplyPrice:'¥180.00', channelPrice:'¥359.00', reason:'供应商[环球优选]已将此商品下架，已被系统转为不可售，请及时寻找替代品', createdTime:'2026-05-14 14:22', processedTime:'2026-05-14 14:23', method:'已确认', operator:'李运营', sourceType:'存量巡检' },
    { typeLabel:'成本变动', type:'cost', product:'女士直筒休闲长裤', brand:'优衣库', spec:'黑色,M', sku:'HZ-A00005-001-DF', mallSku:'S001A00005001', channel:'锦程员工福利商城', supplier:'鹏程优品', supplyPrice:'¥95.00', channelPrice:'¥169.00', reason:'供应商已调价，商品已被系统转为不可售。原供货价 ¥80 → 现供货价 ¥95', createdTime:'2026-05-14 10:15', processedTime:'2026-05-14 10:16', method:'接受并更新', operator:'李运营', sourceType:'存量巡检' },
    { typeLabel:'利润预警', type:'profit', product:'男士商务休闲皮鞋', brand:'奥康', spec:'黑色,41码', sku:'HZ-A00006-001-DF', mallSku:'S001A00006001', channel:'锦程积分商城', supplier:'恒通供应链', supplyPrice:'¥100.00', channelPrice:'¥90.00', reason:'供货价 ¥100 > 渠道价 ¥90，预计亏损 ¥10/单', createdTime:'2026-05-12 15:12', processedTime:'2026-05-12 15:14', method:'申请上架', operator:'王专员', sourceType:'清单推品' },
    { typeLabel:'供应商优化', type:'supplier', product:'智能蓝牙体脂秤', brand:'小米', spec:'白色', sku:'HZ-A00003-001-DF', mallSku:'S001A00003001', channel:'锦程员工福利商城', supplier:'恒通供应链', supplyPrice:'¥95.00', channelPrice:'¥189.00', reason:'存在更低价供应商星辰商贸 (¥90)，当前差价 ¥5', createdTime:'2026-05-13 09:30', processedTime:'2026-05-13 09:32', method:'一键切换最优', operator:'李运营', sourceType:'渠道导入' },
    { typeLabel:'渠道冲突', type:'conflict', product:'夏季纯棉圆领T恤', brand:'森马', spec:'白色,M', sku:'HZ-A00009-001-DF', mallSku:'S001A00002001', channel:'锦程员工福利商城', supplier:'星辰商贸', supplyPrice:'¥85.00', channelPrice:'¥129.00', reason:'商城 [锦程员工福利商城] 已存在同款在售 (供应链SKU: HZ-A00083-001-DF)', createdTime:'2026-05-13 16:48', processedTime:'2026-05-13 16:50', method:'现品改价', operator:'张选品', sourceType:'清单推品' },
    { typeLabel:'重复数据', type:'duplicate', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥35.00', channelPrice:'¥69.00', reason:'[不锈钢保温杯500ml] 商品重复，存在 3 条重复数据', createdTime:'2026-05-12 11:05', processedTime:'2026-05-12 11:08', method:'重新提交', operator:'李运营', sourceType:'渠道导入' },
    { typeLabel:'重复数据', type:'duplicate', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥36.00', channelPrice:'¥72.00', reason:'[不锈钢保温杯500ml] 商品重复，存在 3 条重复数据（重复项 2/3）', createdTime:'2026-05-12 11:05', processedTime:'2026-05-12 11:08', method:'被覆盖删除', operator:'系统', sourceType:'渠道导入' },
    { typeLabel:'重复数据', type:'duplicate', product:'不锈钢保温杯500ml', brand:'富光', spec:'银色,500ml', sku:'HZ-A00004-001-DF', mallSku:'S001A00004001', channel:'泡泡玛特官方商城', supplier:'星辰商贸', supplyPrice:'¥34.50', channelPrice:'¥68.00', reason:'[不锈钢保温杯500ml] 商品重复，存在 3 条重复数据（重复项 3/3）', createdTime:'2026-05-12 11:05', processedTime:'2026-05-12 11:08', method:'被覆盖删除', operator:'系统', sourceType:'渠道导入' },
    { typeLabel:'编码冲突', type:'codeConflict', product:'3M 9001V KN95口罩', brand:'3M', spec:'蓝色,常规', sku:'HZ-A00081-001-DF', mallSku:'S001A00001001', channel:'锦程员工福利商城', supplier:'星辰商贸', supplyPrice:'¥16.80', channelPrice:'¥129.00', reason:'供应链同款组 SAME-MASK-004 关联了2个不同的商城SPU，已确认合并至主SPU S001A00001', createdTime:'2026-06-20 14:30', processedTime:'2026-06-20 14:32', method:'确认合并', operator:'李运营', sourceType:'存量巡检' },
    { typeLabel:'断供提醒', type:'outage', product:'—', sku:'HZ-X00099-001-DF-ZZZ', channel:'蓝海分销商城', supplier:'—', supplyPrice:'—', channelPrice:'—', reason:'供应链无匹配商品数据，编码填写有误，已确认归档', createdTime:'2026-06-14 10:00', processedTime:'2026-06-14 10:05', method:'已确认', operator:'李运营', sourceType:'渠道导入' }
  ],

  // ============================================================
  // 表:待处理选品 问题类型 → CSS 类名映射
  // ============================================================
  pendingTagClassMap: {
    duplicate: 'tag-duplicate',
    profit: 'tag-profit',
    supplier: 'tag-supplier',
    conflict: 'tag-conflict',
    cost: 'tag-cost',
    outage: 'tag-outage',
    codeConflict: 'tag-code-conflict'
  },

  // ============================================================
  // 表:待处理选品 来源类型 → CSS 类名映射
  // ============================================================
  pendingSourceTypeTagClassMap: {
    '清单推品': 'tag-list-push',
    '渠道导入': 'tag-channel-import',
    '存量巡检': 'tag-inspection'
  },

  // ============================================================
  // 表:待处理选品 供应商参考 (03 页"申请指定"弹窗, 供应链SKU → 供货方对比)
  // ============================================================
  pendingSupplierRef: {
    'HZ-A00003-001-DF': { // 智能蓝牙体脂秤
      spuCode: 'S003A00001',
      spec: '白色',
      selectedSupplier: '恒通供应链',
      selectedPrice: '¥95.00',
      suppliers: [
        { name:'星辰商贸', price:'¥90.00', delivery:'24h', orderVolume:'12,800', afterSale:'2.1%', isPreferred:true, isLowest:true, shipping:'顺丰/中通', settlement:'月结30天', status:'合作中' },
        { name:'恒通供应链', price:'¥95.00', delivery:'48h', orderVolume:'8,500', afterSale:'3.5%', isPreferred:false, isLowest:false, shipping:'中通/圆通', settlement:'现款现货', status:'合作中' },
        { name:'鹏程优品', price:'¥102.00', delivery:'36h', orderVolume:'15,200', afterSale:'2.8%', isPreferred:false, isLowest:false, shipping:'韵达/中通', settlement:'账期60天', status:'合作中' }
      ]
    },
    'HZ-A00012-001-DF': { // 户外防水冲锋衣
      spuCode: 'S012A00001',
      spec: '黑色 L',
      selectedSupplier: '环球优选',
      selectedPrice: '¥260.00',
      suppliers: [
        { name:'鹏程优品', price:'¥245.00', delivery:'24h', orderVolume:'6,300', afterSale:'1.8%', isPreferred:true, isLowest:true, shipping:'顺丰/中通', settlement:'月结30天', status:'合作中' },
        { name:'环球优选', price:'¥260.00', delivery:'72h', orderVolume:'22,000', afterSale:'4.2%', isPreferred:false, isLowest:false, shipping:'京东物流', settlement:'账期45天', status:'合作中' },
        { name:'星辰商贸', price:'¥268.00', delivery:'48h', orderVolume:'11,500', afterSale:'3.0%', isPreferred:false, isLowest:false, shipping:'中通/圆通', settlement:'现款现货', status:'已暂停' }
      ]
    },
    'HZ-A00008-004-DF': { // 加厚保暖羽绒服
      spuCode: 'S008A00002',
      spec: '藏青 XL',
      selectedSupplier: '环球优选',
      selectedPrice: '¥200.00',
      suppliers: [
        { name:'恒通供应链', price:'¥175.00', delivery:'36h', orderVolume:'4,200', afterSale:'1.5%', isPreferred:true, isLowest:true, shipping:'顺丰', settlement:'月结30天', status:'合作中' },
        { name:'环球优选', price:'¥200.00', delivery:'72h', orderVolume:'18,500', afterSale:'5.1%', isPreferred:false, isLowest:false, shipping:'中通/圆通', settlement:'账期45天', status:'合作中' },
        { name:'鹏程优品', price:'¥210.00', delivery:'48h', orderVolume:'9,800', afterSale:'2.6%', isPreferred:false, isLowest:false, shipping:'韵达/中通', settlement:'现款现货', status:'合作中' }
      ]
    },
    'HZ-A00015-001-DF': { // 有机山茶油500ml（渠道巡检）
      spuCode: 'S015A00001',
      spec: '500ml',
      selectedSupplier: '恒通供应链',
      selectedPrice: '¥30.00',
      suppliers: [
        { name:'星辰商贸', price:'¥27.00', delivery:'24h', orderVolume:'9,500', afterSale:'1.8%', isPreferred:true, isLowest:true, shipping:'顺丰/中通', settlement:'月结30天', status:'合作中' },
        { name:'恒通供应链', price:'¥30.00', delivery:'48h', orderVolume:'6,200', afterSale:'3.2%', isPreferred:false, isLowest:false, shipping:'中通/圆通', settlement:'现款现货', status:'合作中' },
        { name:'鹏程优品', price:'¥32.00', delivery:'36h', orderVolume:'4,800', afterSale:'2.5%', isPreferred:false, isLowest:false, shipping:'韵达/中通', settlement:'账期60天', status:'合作中' }
      ]
    },
    'HZ-A00096-001-DF': { // 新疆纯牛奶200ml*12（组合商品子件）
      spuCode: 'S023A00001',
      spec: '200ml*12盒',
      selectedSupplier: '恒通供应链',
      selectedPrice: '¥45.00',
      suppliers: [
        { name:'鹏程优品', price:'¥42.00', delivery:'24h', orderVolume:'15,600', afterSale:'1.2%', isPreferred:true, isLowest:true, shipping:'顺丰/中通', settlement:'月结30天', status:'合作中' },
        { name:'恒通供应链', price:'¥45.00', delivery:'48h', orderVolume:'11,200', afterSale:'2.8%', isPreferred:false, isLowest:false, shipping:'中通/圆通', settlement:'现款现货', status:'合作中' },
        { name:'星辰商贸', price:'¥47.00', delivery:'36h', orderVolume:'8,900', afterSale:'2.1%', isPreferred:false, isLowest:false, shipping:'韵达/中通', settlement:'账期60天', status:'合作中' }
      ]
    },
    'HZ-A00097-001-DF': { // 有机黑木耳200g（组合商品子件）
      spuCode: 'S024A00001',
      spec: '200g',
      selectedSupplier: '环球优选',
      selectedPrice: '¥28.00',
      suppliers: [
        { name:'星辰商贸', price:'¥25.00', delivery:'24h', orderVolume:'12,300', afterSale:'1.5%', isPreferred:true, isLowest:true, shipping:'顺丰/中通', settlement:'月结30天', status:'合作中' },
        { name:'环球优选', price:'¥28.00', delivery:'72h', orderVolume:'18,700', afterSale:'4.5%', isPreferred:false, isLowest:false, shipping:'京东物流', settlement:'账期45天', status:'合作中' },
        { name:'恒通供应链', price:'¥30.00', delivery:'36h', orderVolume:'7,500', afterSale:'2.3%', isPreferred:false, isLowest:false, shipping:'中通/圆通', settlement:'现款现货', status:'合作中' }
      ]
    }
  },

  // ============================================================
  // 表:渠道商品 SPU/SKU/渠道三层 (04.渠道商品管理)
  // 供应商与价格已按商品池基准统一(鑫泰商贸系→星辰商贸/鹏程优品等)
  // supplySpu → supplyProducts.spu:渠道商品回溯供应侧主数据,SPU 名称(spuName)由主数据派生
  // ============================================================
  channelProducts: [
    { id:'p1', name:'不锈钢保温杯', spu:'S001A00004', supplySpu:'ZD-A00004', type:'physical', supplyPrice:'¥34.50', totalStock:500, tags:[{label:'热销款',cls:'tag-orange'},{label:'品质优选',cls:'tag-green'}],
      skus: [
        { sku:'S001A00004001', spec:'500ml', channels: [
          { ch:'锦程员工福利商城', price:'¥99', supplier:'星辰商贸', logistics:'顺丰/中通 - 24h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥99', supplier:'星辰商贸', logistics:'顺丰/中通 - 24h', sellable:'on' },
          { ch:'锦程积分商城', price:'¥95', supplier:'星辰商贸', logistics:'顺丰/中通 - 24h', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥89', supplier:'鹏程优品', logistics:'中通/圆通 - 48h', sellable:'off' },
        ]},
        { sku:'S001A00004002', type:'gift', spec:'不锈钢保温杯500ml + 定制杯套礼盒', displayName:'富光 不锈钢保温杯 感恩礼盒套装', channels: [
          { ch:'锦程员工福利商城', price:'¥129', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
          { ch:'锦程积分商城', price:'¥119', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥129', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
        ]},
        { sku:'S001A00004003', spec:'黑色,500ml', channels: [
          { ch:'锦程员工福利商城', price:'¥69', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p2', name:'男士商务休闲皮鞋', spu:'S001A00006', supplySpu:['ZD-A00006','ZD-A00094'], type:'physical', supplyPrice:'¥100',totalStock:75, tags:[{label:'品质优选',cls:'tag-green'}],
      skus: [
        { sku:'S001A00006001', spec:'黑色42码', channels: [
          { ch:'锦程员工福利商城', price:'¥90', supplier:'恒通供应链', logistics:'顺丰 - 48h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥88', supplier:'恒通供应链', logistics:'顺丰 - 48h', sellable:'on' },
        ]},
        { sku:'S001A00006002', spec:'棕色,42码', channels: [
          { ch:'锦程积分商城', price:'¥259', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥249', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p3',name:'家庭营养过年礼包', spu:'C001A00001', supplySpu:'ZDZH-A00006', type:'combo', supplyPrice:'¥73', totalStock:1200, tags:[{label:'新品推荐',cls:'tag-orange'},{label:'员工福利',cls:'tag-green'}],
      skus: [
        { sku:'C001A00001001', spec:'主件(天润 新疆纯牛奶200ml*12)×1 + 配件(北大荒 有机黑木耳200g)×1', displayName:'天润 家庭营养过年礼包 组合套装A', channels: [
          { ch:'锦程员工福利商城', price:'¥99', supplier:'恒通供应链', logistics:'等2个供应商', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥89', supplier:'恒通供应链', logistics:'等2个供应商', sellable:'on' },
          { ch:'苏银豆商城', price:'¥99', supplier:'恒通供应链', logistics:'等2个供应商', sellable:'on' },
        ]},
        { sku:'C001A00001002', spec:'主件(天润 新疆纯牛奶200ml*12)×1 + 配件(天润 新疆纯牛奶200ml*12)×1 + 配件(北大荒 有机黑木耳200g)×2', displayName:'天润 家庭营养元宵礼包 组合套装B', channels: [
          { ch:'锦程员工福利商城', price:'¥189', supplier:'恒通供应链', logistics:'等3个供应商', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥169', supplier:'恒通供应链', logistics:'等3个供应商', sellable:'on' },
          { ch:'苏银豆商城', price:'¥189', supplier:'恒通供应链', logistics:'等3个供应商', sellable:'on' },
        ]}
      ]
    },
    { id:'p4', name:'智能蓝牙体脂秤', spu:'S001A00003', supplySpu:'ZD-A00003', type:'physical', supplyPrice:'¥95', totalStock:270, tags:[{label:'新品上市',cls:'tag-blue'}],
      skus: [
        { sku:'S001A00003001', spec:'白色', channels: [
          { ch:'锦程积分商城', price:'¥129', supplier:'恒通供应链', logistics:'京东物流 - 48h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥129', supplier:'恒通供应链', logistics:'京东物流 - 48h', sellable:'on' },
          { ch:'泡泡玛特企业购', price:'¥119', supplier:'恒通供应链', logistics:'京东物流 - 48h', sellable:'locked' },
        ]}
      ]
    },
    { id:'p5', name:'夏季纯棉圆领T恤', spu:'S001A00002', supplySpu:'ZD-A00009', type:'physical', supplyPrice:'¥85', totalStock:0, tags:[{label:'热销款',cls:'tag-orange'},{label:'限时促销',cls:'tag-orange'}],
      skus: [
        { sku:'S001A00002001', spec:'白色 M', channels: [
          { ch:'锦程员工福利商城', price:'¥45', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'locked' },
          { ch:'苏银豆商城', price:'¥45', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'locked' },
        ]},
        { sku:'S001A00002002', spec:'黑色 L', channels: [
          { ch:'锦程员工福利商城', price:'¥45', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'locked' },
          { ch:'苏银豆商城', price:'¥45', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'locked' },
        ]}
      ]
    },
    { id:'p6', name:'儿童运动跑鞋', spu:'S001A00007', supplySpu:'ZD-A00098', type:'physical', supplyPrice:'¥65', totalStock:463, tags:[{label:'最优性价比',cls:'tag-green'}],
      skus: [
        { sku:'S001A00007001', spec:'28码', channels: [
          { ch:'锦程积分商城', price:'¥59', supplier:'鹏程优品', logistics:'顺丰/中通 - 24h', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥62', supplier:'鹏程优品', logistics:'中通/圆通 - 48h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥58', supplier:'恒通供应链', logistics:'韵达/中通 - 24h', sellable:'on' },
        ]},
        { sku:'S001A00007002', spec:'30码', channels: [
          { ch:'锦程积分商城', price:'¥59', supplier:'鹏程优品', logistics:'顺丰/中通 - 24h', sellable:'on' },
          { ch:'泡泡玛特企业购', price:'¥55', supplier:'恒通供应链', logistics:'京东物流 - 48h', sellable:'off' },
          { ch:'苏银豆商城', price:'¥59', supplier:'恒通供应链', logistics:'顺丰/中通 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p7', name:'女士直筒休闲长裤', spu:'S001A00005', supplySpu:'ZD-A00005', type:'physical', supplyPrice:'¥95', totalStock:230, tags:[{label:'稳定供货',cls:'tag-green'},{label:'品质优选',cls:'tag-green'}],
      skus: [
        { sku:'S001A00005001', spec:'S码', channels: [
          { ch:'锦程员工福利商城', price:'¥99', supplier:'鹏程优品', logistics:'中通/圆通 - 48h', sellable:'off' },
          { ch:'苏银豆商城', price:'¥95', supplier:'恒通供应链', logistics:'韵达/中通 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p8', name:'无线降噪耳机', spu:'S001A00008', supplySpu:'ZD-A00010', type:'physical', supplyPrice:'¥135', totalStock:144, tags:[{label:'热销款',cls:'tag-orange'},{label:'品质优选',cls:'tag-green'}],
      skus: [
        { sku:'S001A00008001', spec:'黑色', channels: [
          { ch:'锦程积分商城', price:'¥299', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥279', supplier:'星辰商贸', logistics:'中通/圆通 - 48h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥299', supplier:'星辰商贸', logistics:'顺丰 - 24h', sellable:'on' },
        ]},
        { sku:'S001A00008002', spec:'白色', channels: [
          { ch:'锦程员工福利商城', price:'¥279', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥269', supplier:'星辰商贸', logistics:'中通/圆通 - 24h', sellable:'on' },
        ]},
        { sku:'S001A00008003', spec:'蓝色', channels: [
          { ch:'蓝海分销商城', price:'¥279', supplier:'星辰商贸', logistics:'中通/京东 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p9', name:'有机绿茶礼盒装', spu:'S001A00009', supplySpu:'ZD-A00099', type:'physical', supplyPrice:'¥56', totalStock:560, tags:[{label:'品质优选',cls:'tag-green'},{label:'产地直供',cls:'tag-green'}],
      skus: [
        { sku:'S001A00009001', spec:'200g', channels: [
          { ch:'泡泡玛特企业购', price:'¥128', supplier:'环球优选', logistics:'韵达/中通 - 24h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥128', supplier:'环球优选', logistics:'韵达/中通 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p10', name:'纳米喷雾补水仪', spu:'S001A00010', supplySpu:'ZD-A00100', type:'physical', supplyPrice:'¥35', totalStock:166, tags:[{label:'限时特惠',cls:'tag-red'}],
      skus: [
        { sku:'S001A00010001', spec:'标准款', channels: [
          { ch:'锦程员工福利商城', price:'¥69', supplier:'鹏程优品', logistics:'中通/圆通 - 48h', sellable:'locked' },
          { ch:'锦程积分商城', price:'¥65', supplier:'鹏程优品', logistics:'顺丰 - 24h', sellable:'on' },
          { ch:'苏银豆商城', price:'¥72', supplier:'鹏程优品', logistics:'韵达/中通 - 24h', sellable:'off' },
        ]}
      ]
    },
    { id:'p11',name:'折叠旅行背包', spu:'S001A00011', supplySpu:'ZD-A00101', type:'physical', supplyPrice:'¥45', totalStock:0, tags:[{label:'新品上市',cls:'tag-blue'}],
      skus: [
        { sku:'S001A00011001', spec:'20L', channels: [
          { ch:'泡泡玛特官方商城', price:'¥79', supplier:'星辰商贸', logistics:'中通/圆通 - 48h', sellable:'off' },
          { ch:'苏银豆商城', price:'¥79', supplier:'星辰商贸', logistics:'中通/圆通 - 48h', sellable:'off' },
        ]}
      ]
    },
    { id:'p12', name:'腾讯视频VIP会员季卡', spu:'X001A00001', supplySpu:'ZDXN-A00002', type:'virtual', supplyPrice:'¥45', totalStock:-1, tags:[{label:'虚拟卡券',cls:'tag-gray'}],
      skus: [
        { sku:'X001A00001001', spec:'季卡', channels: [
          { ch:'锦程员工福利商城', price:'¥58', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
          { ch:'锦程积分商城', price:'¥55', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥52', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
          { ch:'苏银豆商城', price:'¥58', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
        ]}
      ]
    },
    { id:'p13', name:'星巴克电子礼品卡', spu:'X001A00002', supplySpu:'ZDXN-A00006', type:'virtual', supplyPrice:'¥80', totalStock:-1, tags:[{label:'虚拟卡券',cls:'tag-gray'}],
      skus: [
        { sku:'X001A00002001', spec:'面值100元', channels: [
          { ch:'锦程员工福利商城', price:'¥95', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
          { ch:'泡泡玛特企业购', price:'¥90', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
          { ch:'苏银豆商城', price:'¥95', supplier:'数字服务商B', logistics:'自动发货 - 即时', sellable:'on' },
        ]}
      ]
    },
    // p14-p20(及上方 p1/p2/p8 补充 SKU):对齐商品池 productChannelMap 已上架清单,
    // 供 01「已上架商城」列悬停回显各商城渠道价 — 渠道价数据源唯一=本表(渠道商品管理维护)
    { id:'p14', name:'3M 9001V KN95口罩', spu:'S001A00001', supplySpu:['ZD-A00081','ZD-A00001'], type:'physical', supplyPrice:'¥17.50',totalStock:5000, tags:[{label:'品质优选',cls:'tag-green'}],
      skus: [
        { sku:'S001A00001001', spec:'白色,常规', channels: [
          { ch:'锦程员工福利商城', price:'¥39.9', supplier:'星辰商贸', logistics:'顺丰/中通 - 24h', sellable:'on' },
          { ch:'锦程积分商城', price:'¥36.9', supplier:'星辰商贸', logistics:'顺丰/中通 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p15', name:'加厚保暖羽绒服', spu:'S001A00012', supplySpu:'ZD-A00008', type:'physical', supplyPrice:'¥180', totalStock:320, tags:[{label:'品质优选',cls:'tag-green'}],
      skus: [
        { sku:'S001A00012001', spec:'黑色,M', channels: [
          { ch:'泡泡玛特官方商城', price:'¥359', supplier:'环球优选', logistics:'顺丰 - 48h', sellable:'on' },
        ]},
        { sku:'S001A00012002', spec:'黑色,L', channels: [
          { ch:'泡泡玛特官方商城', price:'¥379', supplier:'环球优选', logistics:'顺丰 - 48h', sellable:'on' },
          { ch:'蓝海分销商城', price:'¥369', supplier:'环球优选', logistics:'顺丰 - 48h', sellable:'on' },
        ]}
      ]
    },
    { id:'p16', name:'4K超清智能投影仪', spu:'S001A00015', supplySpu:['ZD-A00007','ZD-A00093'], type:'physical', supplyPrice:'¥520', totalStock:156, tags:[{label:'新品推荐',cls:'tag-orange'}],
      skus: [
        { sku:'S001A00015001', spec:'标准版', channels: [
          { ch:'锦程员工福利商城', price:'¥899', supplier:'鹏程优品', logistics:'顺丰 - 48h', sellable:'on' },
          { ch:'泡泡玛特官方商城', price:'¥859', supplier:'鹏程优品', logistics:'顺丰 - 48h', sellable:'on' },
        ]},
        { sku:'S001A00015002', spec:'Pro增强版', channels: [
          { ch:'锦程员工福利商城', price:'¥999', supplier:'恒通供应链', logistics:'顺丰 - 48h', sellable:'on' },
        ]}
      ]
    },
    { id:'p17', name:'智能手表GT4', spu:'S001A00014', supplySpu:'ZD-A00014', type:'physical', supplyPrice:'¥680', totalStock:450, tags:[{label:'新品推荐',cls:'tag-orange'}],
      skus: [
        { sku:'S001A00014001', spec:'46mm,幻夜黑', channels: [
          { ch:'蓝海分销商城', price:'¥1288', supplier:'星辰商贸', logistics:'顺丰 - 48h', sellable:'on' },
        ]}
      ]
    },
    { id:'p18', name:'男士速干运动短裤', spu:'S001A00016', supplySpu:'ZD-A00016', type:'physical', supplyPrice:'¥48', totalStock:3800, tags:[{label:'最优性价比',cls:'tag-green'}],
      skus: [
        { sku:'S001A00016001', spec:'黑色,XL', channels: [
          { ch:'泡泡玛特官方商城', price:'¥99', supplier:'环球优选', logistics:'韵达/中通 - 24h', sellable:'on' },
        ]}
      ]
    },
    { id:'p19', name:'便携式蓝牙音箱', spu:'S001A00020', supplySpu:'ZD-A00020', type:'physical', supplyPrice:'¥155', totalStock:780, tags:[{label:'热销款',cls:'tag-orange'}],
      skus: [
        { sku:'S001A00020001', spec:'黑色', channels: [
          { ch:'锦程积分商城', price:'¥289', supplier:'鹏程优品', logistics:'顺丰 - 48h', sellable:'on' },
          { ch:'蓝海分销商城', price:'¥279', supplier:'鹏程优品', logistics:'顺丰 - 48h', sellable:'on' },
        ]}
      ]
    },
    { id:'p20', name:'OPPO Find X8', spu:'S002A00001', supplySpu:'ZD-B00003', type:'physical', supplyPrice:'¥3999', totalStock:320, tags:[{label:'新品推荐',cls:'tag-orange'}],
      skus: [
        { sku:'S002A00001001', spec:'漫步云端,12+256GB', channels: [
          { ch:'锦程员工福利商城', price:'¥4299', supplier:'OPPO官方旗舰店', logistics:'顺丰 - 24h', sellable:'on' },
          { ch:'锦程积分商城', price:'¥4199', supplier:'OPPO官方旗舰店', logistics:'顺丰 - 24h', sellable:'on' },
        ]},
        { sku:'S002A00001002', spec:'星野黑,16+256GB', channels: [
          { ch:'泡泡玛特官方商城', price:'¥4999', supplier:'OPPO官方旗舰店', logistics:'顺丰 - 48h', sellable:'on' },
        ]},
        { sku:'S002A00001003', spec:'漫步云端,16+512GB', channels: [
          { ch:'蓝海分销商城', price:'¥4899', supplier:'OPPO官方旗舰店', logistics:'顺丰 - 48h', sellable:'on' },
        ]},
        { sku:'S002A00001004', spec:'星野黑,16+1TB', channels: [
          { ch:'锦程积分商城', price:'¥5899', supplier:'OPPO官方旗舰店', logistics:'顺丰 - 72h', sellable:'on' },
          { ch:'蓝海分销商城', price:'¥5799', supplier:'OPPO官方旗舰店', logistics:'顺丰 - 72h', sellable:'on' },
        ]}
      ]
    },
  ],

  // ============================================================
  // 表:渠道商品 品牌与前台类目映射 (04 页;品牌已对齐主数据)
  // ============================================================
  channelProductMeta: {
    p1: { brand:'富光', category:'居家生活 > 杯壶水具 > 保温杯' },
    p2: { brand:'奥康', category:'男装 > 鞋靴 > 商务皮鞋' },
    p3: { brand:'天润', category:'食品饮料 > 乳制品 > 牛奶；节日礼盒 > 春节礼盒 > 食品礼包' },
    p4: { brand:'小米', category:'数码 > 智能健康 > 体脂秤' },
    p5: { brand:'森马', category:'男装 > 上装 > T恤；女装 > 上装 > T恤' },
    p6: { brand:'安踏儿童', category:'运动户外 > 童鞋 > 运动跑鞋' },
    p7: { brand:'优衣库', category:'女装 > 下装 > 休闲裤' },
    p8: { brand:'漫步者', category:'数码 > 影音娱乐 > 耳机' },
    p9: { brand:'八马', category:'食品饮料 > 茶饮冲调 > 绿茶；节日礼盒 > 春节礼盒 > 食品礼包' },
    p10:{ brand:'金稻', category:'个护美妆 > 美容仪器 > 补水仪' },
    p11:{ brand:'探路者', category:'运动户外 > 户外装备 > 背包' },
    p12:{ brand:'腾讯视频', category:'虚拟卡券 > 视频会员 > 季卡' },
    p13:{ brand:'星巴克', category:'虚拟卡券 > 礼品卡 > 电子卡' },
  },

  // ============================================================
  // 表:渠道销售模式映射 (04 页;direct=直销 distribution=分销)
  // ============================================================
  channelModeMap: {
    '锦程员工福利商城': 'direct',
    '锦程积分商城': 'distribution',
    '泡泡玛特官方商城': 'distribution',
    '泡泡玛特企业购': 'direct',
    '苏银豆商城': 'distribution'
  },

  // ============================================================
  // 表:渠道商品导入 异常预检队列 (04 页导入弹窗;文案已对齐主数据)
  // ============================================================
  channelAbnormalData: [
    { type:'duplicate', typeLabel:'重复数据',   product:'不锈钢保温杯500ml', sku:'S001A00004',  reason:'商品重复，存在 3 条重复数据' },
    { type:'duplicate', typeLabel:'重复数据',   product:'不锈钢保温杯500ml', sku:'S001A00004',  reason:'商品重复，存在 3 条重复数据（重复项 2/3）' },
    { type:'profit',    typeLabel:'利润预警',   product:'男士商务休闲皮鞋',   sku:'S001A00006001', reason:'供货价 ¥100 > 渠道价 ¥90，预计亏损 ¥10/单' },
    { type:'supplier',  typeLabel:'供应商优化', product:'智能蓝牙体脂秤',     sku:'S001A00003001',reason:'存在更低价供应商星辰商贸 (¥90)，当前差价 ¥5' },
    { type:'duplicate', typeLabel:'重复数据',   product:'不锈钢保温杯500ml', sku:'S001A00004',  reason:'商品重复，存在 3 条重复数据（重复项 3/3）' },
    { type:'conflict',  typeLabel:'渠道冲突',   product:'夏季纯棉圆领T恤',    sku:'S001A00002001',reason:'商城 [锦程员工福利商城] 已存在同款在售 (商城SKU: S001A00002002)' },
    { type:'profit',    typeLabel:'利润预警',   product:'儿童运动跑鞋',       sku:'S001A00007001',  reason:'供货价 ¥65 > 渠道价 ¥59，预计亏损 ¥6/单' },
    { type:'supplier',  typeLabel:'供应商优化', product:'女士直筒休闲长裤',   sku:'S001A00005001', reason:'存在更低价供应商恒通供应链 (¥88)，当前差价 ¥7' },
    { type:'profit',    typeLabel:'利润预警',   product:'夏季纯棉圆领T恤',    sku:'S001A00002001',reason:'供货价 ¥85 > 渠道价 ¥45，预计亏损 ¥40/单' },
  ],

  // ============================================================
  // 表:渠道商品 问题类型 → CSS 类名映射 (04 页)
  // ============================================================
  channelTagClassMap: {
    duplicate:'tag-duplicate', profit:'tag-profit', supplier:'tag-supplier',
    conflict:'tag-conflict', cost:'tag-cost', outage:'tag-outage',
  },

  // ============================================================
  // 表:商品详情 (04a.商品详情页,商城SPU S001A00001)
  // 供应商已由字母代号统一为真实供应商名
  // ============================================================
  productDetail: {
    spu: {
      code:'S001A00001', name:'3M 9001V KN95口罩', frontName:'', model:'9001V', brand:'3M',
      sysCategory:'劳保用品 > 防护口罩 > KN95口罩', type:'实物商品',
      supplySPUs:['ZD-A00001','ZD-A00081'],
      mallCreated:'2026-03-15 08:00', supplyCreated:'2026-02-20 14:30',
      frontCategories:['医疗用品 > 日常防护 > 防护口罩'],
    },
    skus: {
      sku1: {
        code:'S001A00001001', spec:'白,常规', barcode:'6901234567890',
        supplySKUs:['HZ-A00081-001-DF','HZ-A00096-001-DF'],
        refPrices:[{price:'129.00',platform:'天猫'},{price:'135.00',platform:'京东'}],
        ecomLinks:[{name:'天猫详情页',url:'#'},{name:'京东详情页',url:'#'}],
        lists:['2024-Q2-航司积分选品','618大促-精选爆品清单'],
        tags:[
          {label:'限时特价',cls:'tag-red'},
          {label:'正品认证',cls:'tag-green'}
        ],
        suppliers:[
          {id:'supA',name:'星辰商贸',supName:'3M 9001V KN95防护口罩',supModel:'9001V',supplySKU:'HZ-A00081-001-DF',preferred:true,preferredReason:'年度框架协议合作方，交付准时率99.2%，近6个月零断供；含48小时必达SLA，账期T+30优于行业平均。',barcode:'6901234567890',supplyPrice:'15.00',jcPrice:'13.50',moq:100,stock:5000,leadTime:'3天',settlement:'现款现货',supplyMode:'一件代发+集采直发',shipping:'顺丰/中通',region:'全国',contact:'王经理 13800001111',status:'合作中',refPrice:'129.00',refPlatform:'天猫',ecomLink:'tmall.com/xxx',hasImage:true,hasParams:true,hasDetail:true,imageSelected:true,note:'',orderVolume:'12,800',afterSale:'2.1%'},
          {id:'supD',name:'环球优选',supName:'3M 9001V 防雾霾口罩（耳戴式）',supModel:'9001V-CN',supplySKU:'HZ-A00096-001-DF',barcode:'6901234567892',supplyPrice:'14.00',moq:200,stock:8000,leadTime:'2天',settlement:'月结30天',supplyMode:'一件代发',shipping:'京东物流',region:'华东/华南',contact:'赵主管 13900002222',status:'合作中',refPrice:'135.00',refPlatform:'京东',ecomLink:'jd.com/xxx',hasImage:true,hasParams:false,hasDetail:true,imageSelected:false,note:'',orderVolume:'8,500',afterSale:'3.5%'}
        ]
      },
      sku2: {
        code:'S001A00001002', spec:'蓝,常规', barcode:'6901234567891',
        supplySKUs:['HZ-A00081-001-DF','HZ-A00097-001-DF'],
        refPrices:[{price:'139.00',platform:'天猫'}],
        ecomLinks:[{name:'天猫详情页',url:'#'}],
        lists:['2024-Q2-航司积分选品'],
        tags:[
          {label:'正品认证',cls:'tag-green'}
        ],
        suppliers:[
          {id:'supA2',name:'星辰商贸',supName:'3M 9001V KN95防护口罩',supModel:'9001V',supplySKU:'HZ-A00081-001-DF',preferred:true,preferredReason:'年度框架协议合作方，交付准时率99.2%，近6个月零断供；含48小时必达SLA，账期T+30优于行业平均。',barcode:'6901234567893',supplyPrice:'16.00',jcPrice:'14.50',moq:100,stock:3200,leadTime:'3天',settlement:'现款现货',supplyMode:'一件代发+集采直发',shipping:'顺丰/中通',region:'全国',contact:'王经理 13800001111',status:'合作中',refPrice:'139.00',refPlatform:'天猫',ecomLink:'tmall.com/xxx',hasImage:true,hasParams:true,hasDetail:true,imageSelected:true,note:'',orderVolume:'9,200',afterSale:'2.4%'},
          {id:'supE',name:'数字服务商A',supName:'3M 9001V 灰蓝色 KN95 口罩',supModel:'9001V-BL',supplySKU:'HZ-A00097-001-DF',barcode:'6901234567895',supplyPrice:'13.50',moq:300,stock:12000,leadTime:'5天',settlement:'账期60天',supplyMode:'一件代发',shipping:'圆通/韵达',region:'全国',contact:'钱总 13700003333',status:'合作中',refPrice:'—',refPlatform:'—',ecomLink:'—',hasImage:false,hasParams:true,hasDetail:false,imageSelected:false,note:'',orderVolume:'15,400',afterSale:'4.8%'}
        ]
      },
      sku3: {
        code:'S001A00001003', spec:'灰,加厚', barcode:'6901234567896',
        supplySKUs:['HZ-A00081-001-DF','HZ-A00081-001-DF','HZ-A00081-001-DF','HZ-A00081-001-DF','HZ-A00081-001-DF'],
        refPrices:[{price:'149.00',platform:'天猫'}],
        ecomLinks:[{name:'天猫详情页',url:'#'}],
        lists:[],
        tags:[
          {label:'新品推荐',cls:'tag-orange'}
        ],
        suppliers:[
          {id:'supB',name:'恒通供应链',supName:'3M 9001V 灰色加厚版 KN95 口罩',supModel:'9001V-THICK',supplySKU:'HZ-A00081-001-DF',preferred:true,preferredReason:'华南区域核心供应商，仓库覆盖广；24小时极速发货，紧急补货首选；与OPPO/华为等品牌深度合作，品控稳定。',barcode:'6901234567001',supplyPrice:'18.00',moq:50,stock:3000,leadTime:'2天',settlement:'现款现货',supplyMode:'一件代发',shipping:'顺丰',region:'全国',contact:'刘经理 13600001112',status:'合作中',refPrice:'149.00',refPlatform:'天猫',ecomLink:'tmall.com/xxx',hasImage:true,hasParams:true,hasDetail:true,imageSelected:false,note:'',orderVolume:'6,300',afterSale:'1.8%'},
          {id:'supC',name:'鹏程优品',supName:'3M 9001V 灰色 KN95 防尘口罩',supModel:'9001V-GR',supplySKU:'HZ-A00081-001-DF',barcode:'6901234567002',supplyPrice:'17.50',moq:100,stock:5000,leadTime:'3天',settlement:'月结30天',supplyMode:'一件代发',shipping:'中通/圆通',region:'华东',contact:'陈主管 13500002223',status:'合作中',refPrice:'145.00',refPlatform:'京东',ecomLink:'jd.com/xxx',hasImage:true,hasParams:false,hasDetail:true,imageSelected:false,note:'',orderVolume:'11,500',afterSale:'3.0%'},
          {id:'supF',name:'数字服务商B',supName:'3M 9001V 加厚防尘口罩 KN95',supModel:'9001V-PRO',supplySKU:'HZ-A00081-001-DF',barcode:'6901234567003',supplyPrice:'16.80',moq:200,stock:8000,leadTime:'1天',settlement:'现款现货',supplyMode:'一件代发',shipping:'京东物流',region:'全国',contact:'周经理 13800003334',status:'合作中',refPrice:'139.00',refPlatform:'拼多多',ecomLink:'pdd.com/xxx',hasImage:false,hasParams:true,hasDetail:false,imageSelected:false,note:'价格最优',orderVolume:'22,000',afterSale:'4.2%'},
          {id:'supG',name:'中远商贸',supName:'3M 9001V 加厚工业防护口罩',supModel:'9001V-IND',supplySKU:'HZ-A00081-001-DF',barcode:'6901234567004',supplyPrice:'19.00',moq:500,stock:15000,leadTime:'7天',settlement:'账期45天',supplyMode:'一件代发',shipping:'顺丰/中通',region:'华南',contact:'吴总 13700004445',status:'已暂停',refPrice:'—',refPlatform:'—',ecomLink:'—',hasImage:true,hasParams:false,hasDetail:false,imageSelected:false,note:'供货不稳定',orderVolume:'3,100',afterSale:'6.5%'},
          {id:'supH',name:'蓝海供应链',supName:'3M 9001V 灰色加厚口罩（GB2626）',supModel:'9001V-H',supplySKU:'HZ-A00081-001-DF',barcode:'6901234567005',supplyPrice:'17.00',moq:150,stock:6000,leadTime:'4天',settlement:'月结60天',supplyMode:'一件代发',shipping:'韵达',region:'华北',contact:'郑经理 13900005556',status:'合作中',refPrice:'142.00',refPlatform:'天猫',ecomLink:'tmall.com/xxx',hasImage:true,hasParams:true,hasDetail:true,imageSelected:false,note:'',orderVolume:'4,800',afterSale:'2.5%'}
        ]
      },
      sku4: {
        code:'S001A00001004', spec:'黑,常规', barcode:'6901234567897',
        supplySKUs:['HZ-A00003-001-DF'],
        refPrices:[],
        ecomLinks:[],
        lists:['政企福利-夏季清凉专场'],
        tags:[
          {label:'限时特价',cls:'tag-red'},
          {label:'企业专享',cls:'tag-blue'}
        ],
        suppliers:[
          {id:'supJ',name:'华信通达',supName:'3M 9001V 黑色 KN95 防护口罩',supModel:'9001V-BK',supplySKU:'HZ-A00003-001-DF',barcode:'6901234567006',supplyPrice:'20.00',moq:500,stock:2000,leadTime:'5天',settlement:'现款现货',supplyMode:'一件代发',shipping:'顺丰',region:'全国',contact:'孙经理 13600006667',status:'合作中',refPrice:'—',refPlatform:'—',ecomLink:'—',hasImage:true,hasParams:true,hasDetail:true,imageSelected:true,note:''}
        ]
      },
      // 营销买赠SKU：挂靠主件SPU S001A00001，作为主件SPU下的特殊规格（组合商品PRD §4.4）
      // 供货价=平台采购成本(子件供货价×用量汇总)，销售价在定价推品(05)别处定，此处只展示成本口径
      sku5: {
        code:'C001A00003001', spec:'主件(3M 9001V KN95口罩)×1 + 赠品(3M护目镜 防雾防尘)×1 + 赠品(一次性医用手套)×3', isCombo:true, comboMode:'gift',
        attachSpu:'S001A00001', // 挂靠主件SPU，不生成新SPU
        tags:[
          {label:'限时特价',cls:'tag-red'},
          {label:'正品认证',cls:'tag-green'},
          {label:'营销买赠',cls:'tag-purple'}
        ],
        supplySKUs:['HZ-A00001-002-DF','HZ-B00002-001-DF','HZ-D00004-001-DF'],
        components:[
          {mallSku:'S001A00001001',supplySKUs:['HZ-A00001-002-DF','HZ-A00096-001-DF'],name:'3M 9001V KN95口罩',spec:'{白,常规}',supplier:'恒通供应链',qty:1,role:'主件',supplyPrice:'15.00',supplyMode:'manual',designated:true,designatedSupplier:'恒通供应链',altSuppliers:[{name:'恒通供应链',price:'15.00',shipping:'顺丰/中通',orderVolume:'12,800',afterSale:'2.1%',settlement:'现款现货',status:'合作中'},{name:'环球优选',price:'14.00',shipping:'京东物流',orderVolume:'8,500',afterSale:'3.5%',settlement:'月结30天',status:'合作中'}],stock:5000,refPrice:'129.00',refPlatform:'天猫',ecomLink:'tmall.com/xxx',leadTime:'3天',shipping:'顺丰/中通',region:'全国',status:'合作中',hasImage:true},
          {mallSku:'S004A00003001',supplySKUs:['HZ-B00002-001-DF','HZ-B00002-001-DF'],name:'3M护目镜 防雾防尘',spec:'{标准}',supplier:'星辰商贸',qty:1,role:'赠品',supplyPrice:'25.00',supplyMode:'manual',designated:true,designatedSupplier:'星辰商贸',altSuppliers:[{name:'星辰商贸',price:'25.00',shipping:'中通',orderVolume:'6,300',afterSale:'1.8%',settlement:'现款现货',status:'合作中'},{name:'鹏程优品',price:'23.00',shipping:'中通/圆通',orderVolume:'11,500',afterSale:'3.0%',settlement:'月结30天',status:'合作中'}],stock:2000,refPrice:'45.00',refPlatform:'京东',ecomLink:'jd.com/xxx',leadTime:'2天',shipping:'中通',region:'华东',status:'合作中',hasImage:false},
          {mallSku:'S005A00003001',supplySKUs:['HZ-D00004-001-DF','HZ-D00004-001-DF'],name:'一次性医用手套',spec:'{M号}',supplier:'鹏程优品',qty:3,role:'赠品',supplyPrice:'8.00',supplyMode:'lowest',designated:false,designatedSupplier:null,altSuppliers:[{name:'鹏程优品',price:'8.00',shipping:'京东物流',orderVolume:'15,600',afterSale:'1.2%',settlement:'月结30天',status:'合作中'},{name:'数字服务商B',price:'7.50',shipping:'圆通/韵达',orderVolume:'22,000',afterSale:'4.2%',settlement:'现款现货',status:'合作中'},{name:'数字服务商A',price:'8.50',shipping:'中通/圆通',orderVolume:'9,800',afterSale:'2.6%',settlement:'账期60天',status:'合作中'}],stock:8000,refPrice:'12.00',refPlatform:'天猫',ecomLink:'tmall.com/xxx',leadTime:'1天',shipping:'京东物流',region:'全国',status:'合作中',hasImage:false}
        ]
      }
    },
    channels: [
      {id:'ch1',channel:'汇通内购平台',skuSpec:'{白,常规}',mode:'直销',supplyPrice:'12.00',linePrice:'129.00',channelPrice:'15.00',mallPrice:'15.00',myMargin:'20%',chMargin:'—',listedDate:'2026-03-20 10:00',listedBy:'李四 (商城运营端)',sellable:'on',locked:false,skuKey:'sku1',supplyMode:'lowest',designatedSupplier:null,oaPending:false,totalOrders:12470,recentOrders:1128,totalAfterSale:'4.5%',recentAfterSale:'3.1%',firstOrderDate:'2026-03-22'},
      {id:'ch2',channel:'蜀味员工专区',skuSpec:'{白,常规}',mode:'分销',supplyPrice:'15.00',linePrice:'129.00',channelPrice:'20.00',mallPrice:'25.00',myMargin:'25%',chMargin:'20%',listedDate:'2026-04-10 09:00',listedBy:'张三 (商城运营端)',sellable:'off',locked:true,lockedReason:'供应商已调价，请在待处理选品中心处理',skuKey:'sku1',supplyMode:'manual',designatedSupplier:'supA',oaPending:false,totalOrders:389,recentOrders:42,totalAfterSale:'12.8%',recentAfterSale:'15.2%',firstOrderDate:'2026-04-12'},
      {id:'ch3',channel:'长江科技福利商城',skuSpec:'{蓝,常规}',mode:'分销',supplyPrice:'13.50',linePrice:'129.00',channelPrice:'18.00',mallPrice:'22.00',myMargin:'25%',chMargin:'18%',listedDate:'2026-05-15 11:00',listedBy:'王五 (商城运营端)',sellable:'on',locked:false,skuKey:'sku2',supplyMode:'lowest',designatedSupplier:null,oaPending:false,totalOrders:560,recentOrders:114,totalAfterSale:'3.2%',recentAfterSale:'2.8%',firstOrderDate:'2026-05-16'},
      {id:'ch4',channel:'汇通内购平台',skuSpec:'工业防护专业套装',mode:'直销',supplyPrice:'64.00',linePrice:'129.00',channelPrice:'88.00',mallPrice:'88.00',myMargin:'27%',chMargin:'—',listedDate:'2026-06-15 09:00',listedBy:'张三 (商城运营端)',sellable:'on',locked:false,skuKey:'sku5',supplyMode:'manual',designatedSupplier:null,oaPending:false,totalOrders:320,recentOrders:48,totalAfterSale:'1.2%',recentAfterSale:'0.8%',firstOrderDate:'2026-06-18'},
      {id:'ch5',channel:'蜀味员工专区',skuSpec:'工业防护专业套装',mode:'分销',supplyPrice:'64.00',linePrice:'129.00',channelPrice:'78.00',mallPrice:'99.00',myMargin:'18%',chMargin:'21%',listedDate:'2026-07-01 10:00',listedBy:'李四 (商城运营端)',sellable:'on',locked:false,skuKey:'sku5',supplyMode:'manual',designatedSupplier:null,oaPending:false,totalOrders:85,recentOrders:22,totalAfterSale:'0.5%',recentAfterSale:'—',firstOrderDate:'2026-07-02'}
    ],
    logs: [
      {date:'2026-06-02',time:'14:30',type:'改价',dot:'yellow',actor:'系统 (商城运营端)',content:'[汇通内购平台] SKU S001A00001001 {白,常规} 改价审批通过，商品恢复可售',change:'渠道价 ¥13.00 → ¥15.00（直销，商城价同步）',result:'success',resultText:'成功'},
      {date:'2026-06-01',time:'08:00',type:'渠道下架',dot:'red',actor:'系统 (供应链端)',content:'[蜀味员工专区] SKU S001A00001001 {白,常规} 星辰商贸断供/终止，渠道商品自动下架',change:'可售 → 不可售·系统',result:'success',resultText:'成功'},
      {date:'2026-05-28',time:'16:00',type:'渠道上架',dot:'green',actor:'王五 (商城运营端)',content:'商品上架至 [长江科技福利商城] — SKU S001A00001002 {蓝,常规} / 数字服务商A ¥13.50',change:'销售模式=分销 | 商城价=¥22.00 | 渠道价=¥18.00',result:'success',resultText:'成功'},
      {date:'2026-04-10',time:'09:00',type:'渠道上架',dot:'green',actor:'李四 (商城运营端)',content:'商品上架至 [蜀味员工专区] — SKU S001A00001001 {白,常规} / 星辰商贸 ¥15.00',change:'销售模式=分销 | 商城价=¥25.00 | 渠道价=¥20.00',result:'success',resultText:'成功'},
      {date:'2026-03-20',time:'10:00',type:'渠道上架',dot:'green',actor:'李四 (商城运营端)',content:'商品上架至 [汇通内购平台] — SKU S001A00001001 {白,常规} / 星辰商贸 ¥15.00',change:'销售模式=直销 | 渠道价=¥15.00（商城价同步）',result:'success',resultText:'成功'},
      {date:'2026-03-15',time:'08:00',type:'商品创建',dot:'gray',actor:'系统 (商城运营端)',content:'商城SPU S001A00001 首次创建，关联供应链SPU: ZD-A00001（星辰商贸·3M 9001V KN95防护口罩）, ZD-A00081（星辰商贸·3M KN95口罩 9001V 白色,常规）共2个',change:'商品类型=实物商品 | 含营销SKU',result:'success',resultText:'成功'},
      {date:'2026-02-20',time:'14:30',type:'商品创建',dot:'gray',actor:'系统 (供应链端)',content:'供应商[星辰商贸]创建供应链SPU ZD-A00001 — 3M 9001V KN95防护口罩',change:'品牌=3M | 类目=劳保用品 > 防护口罩 > KN95口罩',result:'success',resultText:'成功'}
    ]
  },

};

// 初始化:待处理队列按时间倒序 (等价原 data-pending-pool.js 的排序行为)
MallDB.pendingData.sort(function (a, b) { return new Date(b.time) - new Date(a.time); });

// ========================================
// INIT: SPU/SKU 展示名称规范(全局统一)
// SPU名称 = 品牌 + 产品名称 + 型号(品牌/型号已含在产品名称中时去重,不重复拼接)
// SKU名称 = SPU名称 + 规格
// 以下表在加载时统一补齐 spuName / skuName 派生字段,页面展示与复制一律取规范名
// ========================================
(function () {
  function spuDisplayName(brand, name, model) {
    var parts = [];
    if (brand && String(name).indexOf(brand) < 0) parts.push(brand);
    parts.push(name);
    if (model && String(name).indexOf(model) < 0) parts.push(model);
    return parts.join(' ');
  }
  [MallDB.supplyProducts].forEach(function (rows) {
    rows.forEach(function (p) {
      p.spuName = spuDisplayName(p.brand, p.name, p.model);
      p.skuName = p.spuName + (p.spec ? ' ' + p.spec : '');
    });
  });
  // 集采订单成交商品 / 分发明细：同样派生 skuName，页面展示与复制取规范名
  (MallDB.jicaiOrders || []).forEach(function (order) {
    var skuNameByMall = {};
    (order.items || []).forEach(function (it) {
      it.spuName = spuDisplayName(it.brand, it.name, it.model);
      it.skuName = it.spuName + (it.spec ? ' ' + it.spec : '');
      if (it.mallSku) skuNameByMall[it.mallSku] = it.skuName;
    });
    (order.distributePlan || []).forEach(function (row) {
      if (row.mallSku && skuNameByMall[row.mallSku]) row.name = skuNameByMall[row.mallSku];
      else if (row.name) {
        /* 无成交行对照时保持原 name */
      }
    });
  });
  // 商品详情 SPU 名称同样走规范 (04a)
  var pdSpu = MallDB.productDetail.spu;
  pdSpu.spuName = spuDisplayName(pdSpu.brand, pdSpu.name, pdSpu.model);
  // 定价推品演示数据 (02a):SPU 名称跟随商品池主数据,不单独维护
  MallDB.pricingSkus.forEach(function (g) {
    var src = MallDB.supplyProducts.filter(function (p) { return p.spu === g.spuCode; })[0];
    if (src) g.spu = g.spuName = src.spuName;
  });
  // 渠道商品 (04):经 supplySpu 关联商品池主数据,SPU 名称不单独维护
  MallDB.channelProducts.forEach(function (p) {
    var src = MallDB.supplyProducts.filter(function (r) { return r.spu === p.supplySpu; })[0];
    if (src) p.spuName = src.spuName;
  });
})();
