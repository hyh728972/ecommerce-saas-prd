/**
 * common-product-table.js
 * 商品表格公共渲染工具 — 供应链商品池 / 选品清单详情 / 待处理选品 共用
 * 暴露 window.ProductTable 命名空间
 */
(function () {
  'use strict';

  var THUMB_COLORS = ['#dbeafe','#d1fae5','#fef3c7','#ede9fe','#fce7f3','#e0e7ff','#d1fae5','#ffedd5'];

  // ============================================================
  // 缩略图
  // ============================================================

  /**
   * 根据字符串 hash 返回缩略图背景色
   */
  function getThumbColor(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return THUMB_COLORS[Math.abs(hash) % THUMB_COLORS.length];
  }

  /**
   * 生成缩略图占位 HTML
   * @param {string} label - 首字显示
   * @param {string} key - hash 取色依据
   * @param {boolean} showImages - 有图/无图切换
   * @param {boolean} small - true=36px SKU, false=44px SPU
   */
  function getThumbHTML(label, key, showImages, small) {
    var cls = 'product-thumb' + (showImages ? '' : ' hidden');
    var sizeStyle = small ? 'width:60px;height:60px;font-size:16px;' : '';
    return '<span class="' + cls + '" style="' + sizeStyle + 'background:' + getThumbColor(key) + ';flex-shrink:0;">' + (label || '?').charAt(0) + '</span>';
  }

  // ============================================================
  // 库存 / 物流
  // ============================================================

  /**
   * 库存显示 — 虚拟商品显示 —，0 显示红色，正常显示千分位
   */
  function getStockDisplay(stock) {
    if (stock < 0) return '<span class="price">—</span>';
    if (stock === 0) return '<span class="price" style="color:var(--red);">0</span>';
    return '<span class="price">' + stock.toLocaleString() + '</span>';
  }

  /**
   * 发货/物流显示 — 虚拟商品不展示仓库
   */
  function getLogisticsDisplay(row) {
    if (row.type === 'virtual') {
      return '<div style="font-size:13px;">' + row.shipping + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + row.logisticsNote + '</div>';
    }
    return '<div style="font-size:13px;">' + row.shipping + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + row.warehouse + ' · ' + row.logisticsNote + '</div>';
  }

  // ============================================================
  // 标签 / 渠道 / 同款
  // ============================================================

  /**
   * 渲染商品标签列表
   * @param {number[]} tagIndices - 标签索引数组
   * @param {{label:string,cls:string}[]} tagPool - 标签池
   */
  function renderTags(tagIndices, tagPool) {
    if (!tagIndices || !tagIndices.length) return '';
    return tagIndices.map(function (i) {
      var t = tagPool[i];
      if (!t) return '';
      return '<span class="tag ' + t.cls + '">' + t.label + '</span>';
    }).join('');
  }

  /**
   * 已上架渠道显示
   * @param {*} productId - 商品/SKU ID
   * @param {Object} channelMap - productId → channelId[] 映射
   * @param {{id:string,name:string}[]} channels - 渠道列表
   */
  function getChannelCell(productId, channelMap, channels) {
    var channelIds = channelMap[productId];
    if (!channelIds || channelIds.length === 0) return '<span class="placeholder-cell">—</span>';
    var names = channelIds.map(function (cid) {
      var ch = channels.find(function (c) { return c.id === cid; });
      return ch ? ch.name : cid;
    });
    if (names.length <= 1) {
      return '<span style="font-size:12.5px;">' + names[0] + '</span>';
    }
    return '<span style="font-size:12.5px;">' + names[0] + '</span><div style="font-size:10.5px;color:var(--text-muted);">等' + names.length + '个商城</div>';
  }

  /**
   * 其他同款显示 — 橙色标签 或 —
   * @param {*} productId
   * @param {Object} similarMap - productId → count 映射
   */
  function getSimilarCell(productId, similarMap) {
    var count = similarMap[productId];
    if (count) {
      return '<span class="tag" style="background:var(--orange-bg);color:var(--orange);border:1px solid var(--orange-border);">' + count + '个同款</span>';
    }
    return '<span class="placeholder-cell">—</span>';
  }

  // ============================================================
  // 商品类型标签
  // ============================================================

  function getTypeTag(type) {
    if (type === 'physical') return '<span class="tag tag-physical">实物商品</span>';
    if (type === 'virtual') return '<span class="tag tag-virtual">虚拟商品</span>';
    return '';
  }

  // ============================================================
  // 展开箭头 SVG
  // ============================================================

  function getExpandArrow(isExpanded) {
    return '<span class="expand-arrow' + (isExpanded ? ' expanded' : '') + '">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="9 18 15 12 9 6"/></svg></span>';
  }

  // ============================================================
  // SPU / SKU 行渲染（新合并列布局）
  // ============================================================

  /**
   * 渲染 SPU 主行（合并列：☐ + 商品信息 + 类目/品牌 → 单列四行）
   * @param {Object} spu - { name, spu, brand, catL3, tags, skus:[], ... }
   * @param {Object} opts
   *   showImages   - 有图/无图
   *   isExpanded   - 是否展开
   *   tagPool      - 标签池
   */
  function renderSPURow(spu, opts) {
    opts = opts || {};
    var showImages = opts.showImages !== false;
    var isExp = !!opts.isExpanded;
    var tagPool = opts.tagPool || [];
    var skuCount = spu.skus ? spu.skus.length : 1;
    var firstSku = spu.skus ? spu.skus[0] : { model: '' };

    var allPhysical = spu.skus ? spu.skus.every(function (s) { return s.type === 'physical'; }) : (spu.type === 'physical');
    var allVirtual = spu.skus ? spu.skus.every(function (s) { return s.type === 'virtual'; }) : (spu.type === 'virtual');
    var spuTypeTag = allPhysical ? getTypeTag('physical') : (allVirtual ? getTypeTag('virtual') : '');

    var thumbHTML = getThumbHTML(spu.name, spu.name, showImages, false);
    var tagsHTML = spu.tags ? renderTags(spu.tags, tagPool) : '';

    var html = '';
    html += '<tr class="row-main" data-spu="' + spu.spu + '" onclick="toggleSPU(\'' + spu.spu + '\')">';
    // 合并列
    html += '<td class="spu-merged-cell">';
    html += '<input type="checkbox" class="checkbox row-check" data-spu="' + spu.spu + '" onchange="onSPUCheck(this,\'' + spu.spu + '\')" onclick="event.stopPropagation()">';
    html += '<span class="expand-arrow' + (isExp ? ' expanded' : '') + '" onclick="event.stopPropagation();toggleSPU(\'' + spu.spu + '\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>';
    html += thumbHTML;
    html += '<div class="spu-lines">';
    // 第一行：品牌 + 商品名称 + 型号
    html += '<div class="spu-line name-line">' + spu.brand + ' ' + spu.name + ' ' + firstSku.model + '</div>';
    // 第二行：供应链SPU编码
    html += '<div class="spu-line code-line"><span class="code-label">供应链SPU编码：</span>' + spu.spu + '</div>';
    // 第三行：品牌 | 类目
    html += '<div class="spu-line cat-line">' + spu.brand + ' | ' + spu.catL3 + '</div>';
    // 第四行：类型标签 + SKU 数量 + 商品标签
    html += '<div class="spu-line tag-line">' + spuTypeTag + '<span class="sku-count-tag">' + skuCount + '个SKU</span>' + (tagsHTML ? ' ' + tagsHTML : '') + '</div>';
    html += '</div>';
    html += '</td>';
    return html;
  }

  /**
   * 渲染 SKU 次行（合并列：☐ + 商品信息 → 单列两行）
   * @param {Object} sku - { id, model, sku, spu, type, ... }
   * @param {Object} opts
   *   showImages - 有图/无图
   *   isInvalid  - 是否已失效（可选，选品清单用）
   */
  function renderSKURow(sku, opts) {
    opts = opts || {};
    var showImages = opts.showImages !== false;
    var isInvalid = !!opts.isInvalid;
    var disabledAttr = isInvalid ? ' disabled' : '';
    var invalidTitle = isInvalid ? ' title="该商品已失效，无法推品"' : '';
    var rowCls = isInvalid ? ' row-invalid' : '';

    var thumbHTML = getThumbHTML(sku.sku, sku.sku, showImages, true);

    var html = '';
    html += '<tr class="row-sub' + rowCls + '" data-id="' + sku.id + '" data-spu="' + sku.spu + '">';
    html += '<td class="spu-merged-cell">';
    html += '<input type="checkbox" class="checkbox row-check" data-id="' + sku.id + '" data-spu="' + sku.spu + '" onchange="onSKUCheck(this,\'' + sku.spu + '\')"' + disabledAttr + invalidTitle + ' onclick="event.stopPropagation()">';
    html += '<span class="sku-spacer"></span>';
    html += thumbHTML;
    html += '<div class="sku-lines">';
    html += '<div class="sku-line"><span class="spec-label">规格：</span><span class="spec-val">' + sku.model + '</span></div>';
    html += '<div class="sku-line"><span class="spec-label">供应链SKU物流编码：</span><span class="sku-code">' + sku.sku + '</span></div>';
    html += '</div>';
    html += '</td>';
    return html;
  }

  // ============================================================
  // 暴露
  // ============================================================

  window.ProductTable = {
    getThumbColor: getThumbColor,
    getThumbHTML: getThumbHTML,
    getStockDisplay: getStockDisplay,
    getLogisticsDisplay: getLogisticsDisplay,
    renderTags: renderTags,
    getChannelCell: getChannelCell,
    getSimilarCell: getSimilarCell,
    getTypeTag: getTypeTag,
    getExpandArrow: getExpandArrow,
    renderSPURow: renderSPURow,
    renderSKURow: renderSKURow
  };

})();
