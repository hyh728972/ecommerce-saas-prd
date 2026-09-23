/**
 * api.js — 模拟后端接口层
 * 暴露 window.MallAPI,页面统一通过 MallAPI 取数(数据库 MallDB 不直接暴露给页面)
 *
 * 说明:
 * - 同步 Mock:真实系统此处为 HTTP 异步请求(如 GET /api/supply-products)
 * - 所有返回值为深拷贝副本:页面内增删改不影响"库",刷新后数据还原(与原型现状一致)
 * - 依赖:database.js 需在本文件之前引入
 */
(function () {
  'use strict';

  // 深拷贝,隔离页面与"数据库"
  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  window.MallAPI = {

    // 供应链商品池
    supplyProduct: {
      // GET /api/supply-products — 商品池 SKU 列表
      list: function () { return clone(MallDB.supplyProducts); },
      // GET /api/supply-products/stats — 池统计
      getStats: function () { return clone(MallDB.poolStatsMeta); },
      // GET /api/supply-products/dropship-stats — 一件代发商品池统计
      getDropshipStats: function () { return clone(MallDB.dropshipStatsMeta); },
      // GET /api/supply-products/jicai-stats — 集采直发商品池统计
      getJicaiStats: function () { return clone(MallDB.jicaiStatsMeta); },
    },

    // 集采商城在售池(SPU级,商品级入池不绑供方;直接写 MallDB 会话态,刷新还原)
    jicaiPool: {
      // GET /api/jicai-pool — 在售池映射 (spu → 'on' | 'off')
      getMap: function () {
        var m = {};
        MallDB.jicaiPool.forEach(function (r) { m[r.spu] = r.status; });
        return m;
      },
      // POST /api/jicai-pool/add — 入池(默认在售,已入池跳过)
      add: function (spus) {
        spus.forEach(function (spu) {
          if (!MallDB.jicaiPool.some(function (r) { return r.spu === spu; })) MallDB.jicaiPool.push({ spu: spu, status: 'on' });
        });
      },
      // POST /api/jicai-pool/toggle — 在售/停售切换
      toggle: function (spu) {
        var row = MallDB.jicaiPool.find(function (r) { return r.spu === spu; });
        if (row) row.status = row.status === 'on' ? 'off' : 'on';
      },
      // POST /api/jicai-pool/status — 指定在售/停售
      setStatus: function (spu, status) {
        var row = MallDB.jicaiPool.find(function (r) { return r.spu === spu; });
        if (row) row.status = status === 'off' ? 'off' : 'on';
      },
      // POST /api/jicai-pool/remove — 移出在售池
      remove: function (spus) {
        MallDB.jicaiPool = MallDB.jicaiPool.filter(function (r) { return spus.indexOf(r.spu) === -1; });
      },
    },

    // 集采报价管理(询价单主单;报价版本挂单下)
    jicaiQuote: {
      // GET /api/jicai-quotes
      list: function () { return clone(MallDB.jicaiQuotes); },
      // GET /api/jicai-quotes/:id
      get: function (id) {
        var row = MallDB.jicaiQuotes.find(function (r) { return r.id === id; });
        return row ? clone(row) : null;
      },
      // POST /api/jicai-quotes/:id/status
      setStatus: function (id, status, extra) {
        var row = MallDB.jicaiQuotes.find(function (r) { return r.id === id; });
        if (row) {
          row.status = status;
          row.updatedAt = '2026-08-31 12:00';
          if (extra && typeof extra === 'object') {
            Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
          }
        }
        return row ? clone(row) : null;
      },
      // POST /api/jicai-quotes — 代客建单
      create: function (payload) {
        var n = MallDB.jicaiQuotes.length + 1;
        var id = 'XQ20260831' + String(100 + n).slice(-3);
        var row = {
          id: id,
          customer: payload.customer || '',
          customerShort: payload.customerShort || payload.customer || '',
          customerBuyer: payload.customerBuyer || '',
          customerBuyerPhone: payload.customerBuyerPhone || '',
          createdBy: payload.createdBy || '张晗',
          acceptedBy: '',
          status: 'pending_accept',
          version: '',
          versionCount: 0,
          validDays: 0,
          validUntil: '',
          createdAt: '2026-08-31 12:00',
          updatedAt: '2026-08-31 12:00',
          source: '代客建单',
          costTotal: payload.costTotal || 0,
          agreeTotal: 0,
          itemCount: payload.itemCount || 0,
          qtyTotal: payload.qtyTotal || 0,
          itemsPreview: payload.itemsPreview || '',
          remark: payload.remark || '',
          items: Array.isArray(payload.items) ? payload.items : []
        };
        MallDB.jicaiQuotes.unshift(row);
        return clone(row);
      },
      // POST /api/jicai-quotes/:id/pricing — 保存定价（协议价+供方+交期）
      savePricing: function (id, payload) {
        var row = MallDB.jicaiQuotes.find(function (r) { return r.id === id; });
        if (!row) return null;
        if (payload && typeof payload === 'object') {
          if (Array.isArray(payload.items)) row.items = clone(payload.items);
          if (payload.costTotal !== undefined) row.costTotal = payload.costTotal;
          if (payload.agreeTotal !== undefined) row.agreeTotal = payload.agreeTotal;
          if (payload.validDays !== undefined) row.validDays = payload.validDays;
          if (payload.validUntil !== undefined) row.validUntil = payload.validUntil;
          if (payload.deliveryNote !== undefined) row.deliveryNote = payload.deliveryNote;
          if (payload.version !== undefined) row.version = payload.version;
          if (payload.versionCount !== undefined) row.versionCount = payload.versionCount;
          if (payload.itemCount !== undefined) row.itemCount = payload.itemCount;
          if (payload.qtyTotal !== undefined) row.qtyTotal = payload.qtyTotal;
          if (payload.itemsPreview !== undefined) row.itemsPreview = payload.itemsPreview;
          if (payload.status) row.status = payload.status;
        }
        row.updatedAt = '2026-08-31 15:00';
        return clone(row);
      }
    },

    // 集采订单列表(成交履约主单)
    jicaiOrder: {
      // GET /api/jicai-orders
      list: function () { return clone(MallDB.jicaiOrders); },
      // GET /api/jicai-orders/:id
      get: function (id) {
        var row = MallDB.jicaiOrders.find(function (r) { return r.id === id; });
        return row ? clone(row) : null;
      },
      // POST /api/jicai-orders/:id/status
      setStatus: function (id, status, extra) {
        var row = MallDB.jicaiOrders.find(function (r) { return r.id === id; });
        if (row) {
          row.status = status;
          row.updatedAt = '2026-08-31 12:00';
          if (extra && typeof extra === 'object') {
            Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
          }
        }
        return row ? clone(row) : null;
      }
    },

    // 渠道(品牌商城)
    channel: {
      // GET /api/channels — 渠道列表
      list: function () { return clone(MallDB.channels); },
      // GET /api/products/channels — 商品已上架渠道映射 (productId → [channelId])
      getProductChannelMap: function () { return clone(MallDB.productChannelMap); },
    },

    // 选品清单
    shoppingList: {
      // GET /api/shopping-lists — 清单列表
      list: function () { return clone(MallDB.shoppingLists); },
      // GET /api/shopping-lists/product-map — 商品归属清单映射 (productId → [listId])
      getProductMap: function () { return clone(MallDB.productListMap); },
    },

    // 商品标签
    tag: {
      // GET /api/tags/pool — 商品标签池
      pool: function () { return clone(MallDB.tagPool); },
    },

    // 选品清单域 (02.选品清单管理)
    selection: {
      // GET /api/selection/products — 选品清单商品列表
      // 注:清单条目为引用式(selectionItems.supplySku → supplyProducts.sku),
      // 此处 join 商品池主数据 + 清单态(listId/status/addedTime),页面取到的仍是平铺行
      products: function () {
        var poolBySku = {};
        MallDB.supplyProducts.forEach(function (p) { poolBySku[p.sku] = p; });
        return MallDB.selectionItems.map(function (it) {
          var row = clone(poolBySku[it.supplySku] || {});
          row.id = it.id; row.listId = it.listId; row.addedTime = it.addedTime;
          row.status = it.status; row.channelPrice = null; row.strikePrice = null;
          if (it.note) row.logisticsNote = it.note;
          if (it.comboType) { row.comboType = it.comboType; row.comboSuppliers = it.comboSuppliers; }
          return row;
        });
      },
      // GET /api/selection/product-channels — 商品已推渠道映射
      channelMap: function () { return clone(MallDB.selectionChannelMap); },
      // GET /api/selection/import-preview — 批量导入预检 Mock
      importPreview: function () { return clone(MallDB.selectionImportItems); },
      // GET /api/selection/import-pools — 批量导入生成器 Mock 池
      importPools: function () { return clone(MallDB.selectionImportPools); },
    },

    // 定价推品 (02a.定价推品配置页)
    pricing: {
      // GET /api/pricing/skus — 待定价 SKU (SPU 分组,演示数据)
      skuData: function () { return clone(MallDB.pricingSkus); },
      // GET /api/pricing/channels — 可选渠道 (含销售模式)
      channels: function () { return clone(MallDB.pricingChannels); },
      // POST /api/pricing/selection — 保存上一页(选品清单)勾选并推品的商品
      // 注:原型以 localStorage 模拟服务端会话态,页面跳转(重新加载 DB)后仍可取回
      saveSelection: function (items) {
        try { localStorage.setItem('mall.pricing.selection', JSON.stringify(items || [])); } catch (e) { /* 非浏览器环境忽略 */ }
      },
      // GET /api/pricing/selection — 取回待定价商品 (无会话数据返回 [])
      loadSelection: function () {
        try { return JSON.parse(localStorage.getItem('mall.pricing.selection') || '[]'); } catch (e) { return []; }
      },
    },

    // 待处理选品 (03.待处理选品)
    pending: {
      // GET /api/pending — 待处理队列 (已按时间倒序)
      list: function () { return clone(MallDB.pendingData); },
      // GET /api/pending/closed — 已关闭队列
      closedList: function () { return clone(MallDB.pendingClosedData); },
      // GET /api/pending/tag-classes — 问题类型样式映射
      tagClassMap: function () { return clone(MallDB.pendingTagClassMap); },
      // GET /api/pending/source-type-classes — 来源类型样式映射
      sourceTypeTagClassMap: function () { return clone(MallDB.pendingSourceTypeTagClassMap); },
      // GET /api/pending/supplier-ref — 供应商对比参考 (supplySKU → 供货方列表)
      supplierRef: function () { return clone(MallDB.pendingSupplierRef); },
    },

    // 渠道商品 (04.渠道商品管理)
    channelProduct: {
      // GET /api/channel-products — SPU/SKU/渠道三层列表
      list: function () { return clone(MallDB.channelProducts); },
      // GET /api/channel-products/meta — 品牌与前台类目映射
      metaMap: function () { return clone(MallDB.channelProductMeta); },
      // GET /api/channel-products/channel-modes — 渠道销售模式映射
      channelModeMap: function () { return clone(MallDB.channelModeMap); },
      // GET /api/channel-products/abnormal — 导入异常预检队列
      abnormalList: function () { return clone(MallDB.channelAbnormalData); },
      // GET /api/channel-products/tag-classes — 问题类型样式映射
      tagClassMap: function () { return clone(MallDB.channelTagClassMap); },
    },

    // 商品详情 (04a.商品详情页)
    productDetail: {
      // GET /api/products/:code — 商城SPU详情 (含SKU/供货方/渠道/日志)
      get: function () { return clone(MallDB.productDetail); },
    },
  };

})();
