/**
 * common-product-table.js
 * 商品表格公共渲染工具 — 全量商品列表 / 选品清单详情 / 待处理选品 共用
 * 暴露 window.ProductTable 命名空间
 * 注意：E.供应链系统 与 F.供应商后台 各有一份本文件（字节级一致），改动需两边同步
 */
(function () {
  'use strict';

  var THUMB_COLORS = ['#dbeafe','#d1fae5','#fef3c7','#ede9fe','#fce7f3','#e0e7ff','#d1fae5','#ffedd5'];

  function getThumbColor(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return THUMB_COLORS[Math.abs(hash) % THUMB_COLORS.length];
  }

  function getThumbHTML(label, key, showImages, small) {
    var cls = 'product-thumb' + (showImages ? '' : ' hidden');
    var sizeStyle = small ? 'width:60px;height:60px;font-size:16px;' : '';
    return '<span class="' + cls + '" style="' + sizeStyle + 'background:' + getThumbColor(key) + ';flex-shrink:0;">' + (label || '?').charAt(0) + '</span>';
  }

  function getStockDisplay(stock) {
    if (stock < 0) return '<span class="price">—</span>';
    if (stock === 0) return '<span class="price" style="color:var(--red);">0</span>';
    return '<span class="price">' + stock.toLocaleString() + '</span>';
  }

  function getLogisticsDisplay(row) {
    if (row.type === 'virtual') {
      return '<div style="font-size:13px;">' + row.shipping + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + row.logisticsNote + '</div>';
    }
    return '<div style="font-size:13px;">' + row.shipping + '</div><div style="font-size:11.5px;color:var(--text-muted);">' + row.logisticsNote + '</div>';
  }

  function renderTags(tagIndices, tagPool) {
    if (!tagIndices || !tagIndices.length) return '';
    return tagIndices.map(function (i) {
      var t = tagPool[i];
      if (!t) return '';
      return '<span class="tag ' + t.cls + '">' + t.label + '</span>';
    }).join('');
  }

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
    return '<span style="font-size:12.5px;">' + names[0] + '</span><div style="font-size:10.5px;color:var(--text-muted);">等' + names.length + '个渠道</div>';
  }

  function getSimilarCell(productId, similarMap) {
    var count = similarMap[productId];
    if (count) {
      return '<span class="tag" style="background:var(--orange-bg);color:var(--orange);border:1px solid var(--orange-border);">' + count + '个同款</span>';
    }
    return '<span class="placeholder-cell">—</span>';
  }

  window.ProductTable = {
    getThumbColor: getThumbColor,
    getThumbHTML: getThumbHTML,
    getStockDisplay: getStockDisplay,
    getLogisticsDisplay: getLogisticsDisplay,
    renderTags: renderTags,
    getChannelCell: getChannelCell,
    getSimilarCell: getSimilarCell
  };

})();
