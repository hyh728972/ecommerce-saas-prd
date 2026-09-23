// 商品数据 / 品牌元数据 / 渠道模式(含 getMallPrice 等) 统一来自 common-product-data.js（共享数据源，各页面一致引用）

let currentView = 'channel';
let currentChannel = null;
var importFilterKeywords = [];
var importFilterActive = false;

// ==================== RENDER HELPERS ====================
// 可售状态纯文字（无开关按钮）：上架 / 下架
function sellableStatusText(sellable) {
  return sellable === 'on' ? '上架' : '下架';
}

// 上下架按钮：上架时显示"下架"，下架时显示"上架"，系统锁定则禁用
function shelfButtonHTML(sellable, offOnclick, onOnclick) {
  if (sellable === 'locked') return '<button class="btn btn-sm" title="供应链锁定，不可手动操作" style="color:var(--text-muted);cursor:not-allowed;margin-left:6px;">上架</button>';
  if (sellable === 'on') return '<button class="btn btn-sm" title="下架" onclick="event.stopPropagation();' + offOnclick + '" style="color:var(--red);border-color:var(--red-border);margin-left:6px;">下架</button>';
  return '<button class="btn btn-outline btn-sm" title="上架" onclick="event.stopPropagation();' + onOnclick + '" style="margin-left:6px;">上架</button>';
}
function setSellable(id, skuCode, ch, mode) {
  var p = productData.find(x => x.id === id);
  if (!p) return;
  var sku = p.skus.find(s => s.sku === skuCode);
  if (!sku) return;
  var c = sku.channels.find(x => x.ch === ch);
  if (!c || c.sellable === 'locked') return;
  c.sellable = mode;
  refreshAll();
  showToast('success', (mode === 'off' ? '已下架 ' : '已上架 ') + getDisplaySkuName(p, sku));
}
function setSPUSellable(id, mode) {
  var p = productData.find(x => x.id === id);
  if (!p) return;
  p.skus.forEach(s => s.channels.forEach(c => { if (c.sellable !== 'locked') c.sellable = mode; }));
  refreshAll();
  showToast('success', (mode === 'off' ? '已下架 ' : '已上架 ') + getDisplayProductName(p));
}

function chActionsHTML(id, name, spuCode, skuCode, ch) {
  var p = productData.find(x => x.id === id);
  var sku = p ? p.skus.find(s => s.sku === skuCode) : null;
  var chObj = sku ? sku.channels.find(x => x.ch === ch) : null;
  var sellable = chObj ? chObj.sellable : 'on';
  return `
    <button class="btn btn-outline btn-sm" title="改价" onclick="event.stopPropagation();openPriceChangeModal('${id}','${skuCode}','${ch}')">改价</button>`
    + shelfButtonHTML(sellable, `setSellable('${id}','${skuCode}','${ch}','off')`, `setSellable('${id}','${skuCode}','${ch}','on')`);
}

function spuActionsHTML(id, name, spuCode, channel, firstSku) {
  var p = productData.find(x => x.id === id);
  var states = [];
  if (p) p.skus.forEach(s => { var c = s.channels.find(x => x.ch === channel); if (c) states.push(c.sellable); });
  var aggSell = states.every(s=>s==='locked') ? 'locked' : states.every(s=>s==='off') ? 'off' : states.some(s=>s==='locked') ? 'locked' : 'on';
  return `
    <button class="btn btn-outline btn-sm" title="查看详情" onclick="event.stopPropagation();openDetailPage('${spuCode}','${firstSku||''}','','')">查看</button>`
    + shelfButtonHTML(aggSell, `setSPUSellable('${id}','off')`, `setSPUSellable('${id}','on')`);
}


// ==================== RENDER TABLES ====================
const expandedSPUs = new Set();
let allExpanded = false;
var showImages = true;

function getThumbColor(type, spu) {
  if (spu && spu.charAt(0) === 'C') return '#ede9fe';
  return type === 'spu' ? '#dbeafe' : '#e5e7eb';
}
function getThumbHTML(label, key, small, type, spu) {
  var thumbClass = showImages ? 'product-thumb' : 'product-thumb hidden';
  var sizeStyle = small ? 'width:60px;height:60px;font-size:16px;' : '';
  return '<span class="' + thumbClass + '" style="' + sizeStyle + 'background:' + getThumbColor(type, spu) + ';">' + label.charAt(0) + '</span>';
}
function toggleImageView() {
  showImages = !showImages;
  var label = showImages ? '无图显示' : '有图显示';
  var btn = document.getElementById('btnImageView');
  var btnCh = document.getElementById('btnChImageView');
  if (btn) btn.textContent = label;
  if (btnCh) btnCh.textContent = label;
  if (currentChannel) renderChannelTable(currentChannel);
}

function parseCurrency(str) {
  return parseFloat((str||'').replace(/[^0-9.]/g,'')) || 0;
}
function formatCurrency(num) {
  return '¥' + (Math.round(num * 100) / 100).toFixed(2).replace(/\.00$/, '');
}
// 渠道价/商城价/划线价/电商参考价 的派生统一在 common-product-data.js 完成，这里不再重复
function calcChannelMargin(mallStr, channelStr) {
  const mall = parseFloat((mallStr||"").replace(/[^0-9.]/g,""));
  const channel = parseFloat((channelStr||"").replace(/[^0-9.]/g,""));
  if (!mall || !channel || mall <= 0) return { profit: "-", margin: "-", neg: false };
  const profit = mall - channel;
  const margin = profit / mall * 100;
  return { profit: "¥" + profit.toFixed(0), margin: margin.toFixed(1) + "%", neg: margin <= 0 };
}

function getTypeFilter(view) {
  var sel = document.getElementById(view === 'product' ? 'typeFilterProduct' : 'typeFilterChannel');
  if (!sel) return 'all';
  if (sel.value === 'physical') return 'physical';
  if (sel.value === 'virtual') return 'virtual';
  if (sel.value === 'combo') return 'combo';
  if (sel.value === 'gift') return 'gift';
  return 'all';
}
function getStatusFilter(view) {
  var sel = document.getElementById(view === 'product' ? 'statusFilterProduct' : 'statusFilterChannel');
  if (!sel) return 'all';
  var v = sel.value;
  return (v === 'on' || v === 'off') ? v : 'all';
}
function getBrandFilter(view) {
  var sel = document.getElementById(view === 'product' ? 'brandFilterProduct' : 'brandFilterChannel');
  if (!sel) return 'all';
  return sel.value || 'all';
}
// 渠道维度 SPU 聚合可售状态（on/off/locked），用于状态筛选与导出
function getChannelAggSellable(p, channelName) {
  var states = p.skus
    .filter(function(s){ return s.channels.some(function(c){ return c.ch === channelName; }); })
    .map(function(s){ return s.channels.find(function(c){ return c.ch === channelName; }).sellable; });
  if (states.every(function(s){ return s === 'locked'; })) return 'locked';
  if (states.every(function(s){ return s === 'off'; })) return 'off';
  if (states.some(function(s){ return s === 'locked'; })) return 'locked';
  return 'on';
}
// 从商品数据动态填充品牌筛选下拉，保持与在售品牌统计一致
function populateBrandFilter() {
  var sel = document.getElementById('brandFilterChannel');
  if (!sel) return;
  var brands = [], seen = {};
  productData.forEach(function(p) {
    var b = getProductMeta(p).brand;
    if (b && b !== '—' && !seen[b]) { seen[b] = true; brands.push(b); }
  });
  var current = sel.value || 'all';
  sel.innerHTML = '<option value="all">全部品牌</option>' + brands.map(function(b){ return '<option value="' + b + '">' + b + '</option>'; }).join('');
  sel.value = current;
}
// 类目取顶级（首个「>」前；多个类目路径取第一条，以「；」分隔）
function getProductTopCategory(p) {
  var cat = (getProductMeta(p).category || '').split('；')[0];
  var top = cat.split('>')[0].trim();
  return top || '未分类';
}
function getCategoryFilter(view) {
  var sel = document.getElementById(view === 'product' ? 'categoryFilterProduct' : 'categoryFilterChannel');
  if (!sel) return 'all';
  return sel.value || 'all';
}
// 从商品数据动态填充类目筛选下拉（顶级类目）
function populateCategoryFilter() {
  var sel = document.getElementById('categoryFilterChannel');
  if (!sel) return;
  var cats = [], seen = {};
  productData.forEach(function(p) {
    var c = getProductTopCategory(p);
    if (c && !seen[c]) { seen[c] = true; cats.push(c); }
  });
  var current = sel.value || 'all';
  sel.innerHTML = '<option value="all">全部类目</option>' + cats.map(function(c){ return '<option value="' + c + '">' + c + '</option>'; }).join('');
  sel.value = current;
}

const expandedChSPUs = new Set();

function renderChannelTable(channelName) {
  const showChannelMargin = isDistributionChannel(channelName);
  const marginHeader = document.getElementById('channelMarginHeader');
  if (marginHeader) marginHeader.style.display = showChannelMargin ? '' : 'none';
  const typeFilter = getTypeFilter('channel');
  const statusFilter = getStatusFilter('channel');
  const brandFilter = getBrandFilter('channel');
  const categoryFilter = getCategoryFilter('channel');
  // Group: only SPUs that have at least one SKU in this channel + 类型/状态/品牌/类目 filter + import filter
  const spus = productData.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (!p.skus.some(s => s.channels.some(c => c.ch === channelName))) return false;
    if (brandFilter !== 'all' && getProductMeta(p).brand !== brandFilter) return false;
    if (categoryFilter !== 'all' && getProductTopCategory(p) !== categoryFilter) return false;
    if (statusFilter === 'on' && getChannelAggSellable(p, channelName) !== 'on') return false;
    if (statusFilter === 'off' && getChannelAggSellable(p, channelName) === 'on') return false;
    if (!importFilterActive || importFilterKeywords.length === 0) return true;
    var haystack = (p.name + ' ' + p.spu).toLowerCase();
    p.skus.forEach(function(s) {
      haystack += ' ' + s.sku.toLowerCase() + ' ' + s.spec.toLowerCase();
    });
    for (var i = 0; i < importFilterKeywords.length; i++) {
      if (haystack.indexOf(importFilterKeywords[i].toLowerCase()) !== -1) return true;
    }
    return false;
  });
  const tbody = document.getElementById('channelTableBody');
  const totalPages = Math.max(1, Math.ceil(spus.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  lastTotalPages = totalPages;
  const pageSpus = spus.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  let html = '';
  let totalSkus = 0;
  spus.forEach(p => { totalSkus += p.skus.filter(s => s.channels.some(c => c.ch === channelName)).length; });
  pageSpus.forEach(p => {
    const skusInCh = p.skus.filter(s => s.channels.some(c => c.ch === channelName));
    const allChs = skusInCh.map(s => s.channels.find(c => c.ch === channelName));
    const prices = allChs.map(c => parseInt(c.price.replace('¥','')));
    const mallPrices = allChs.map(c => parseInt(getMallPrice(c).replace('¥','')));
    const priceRange = Math.min(...prices) === Math.max(...prices) ? `¥${Math.max(...prices)}` : `¥${Math.min(...prices)}-¥${Math.max(...prices)}`;
    const mallRange = Math.min(...mallPrices) === Math.max(...mallPrices) ? `¥${Math.max(...mallPrices)}` : `¥${Math.min(...mallPrices)}-¥${Math.max(...mallPrices)}`;
    const linePrices = allChs.map(c => parseInt((c.linePrice||'').replace('¥','')));
    const lineRange = Math.min(...linePrices) === Math.max(...linePrices) ? `¥${Math.max(...linePrices)}` : `¥${Math.min(...linePrices)}-¥${Math.max(...linePrices)}`;
    const states = allChs.map(c => c.sellable);
    const aggSell = states.every(s=>s==='locked') ? 'locked' : states.every(s=>s==='off') ? 'off' : states.some(s=>s==='locked') ? 'locked' : 'on';
    const isExp = expandedChSPUs.has(p.id);
    const meta = getProductMeta(p);
    html += `
    <tr class="row-main" data-id="${p.id}" onclick="toggleChSPU('${p.id}')">
      <td class="spu-merged-cell">
        <input type="checkbox" class="checkbox chk-channel" data-id="${p.id}" onchange="onChSPUCheck(this,'${p.id}')" onclick="event.stopPropagation()">
        <span class="expand-arrow${isExp?' expanded':''}" onclick="event.stopPropagation();toggleChSPU('${p.id}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
        ${getThumbHTML(getDisplayProductName(p), getDisplayProductName(p), false, 'spu', p.spu)}
        <div class="spu-lines">
          <div class="spu-line name-line"><span class="name-ellipsis" title="${getDisplayProductName(p).replace(/"/g,'&quot;')}">${getDisplayProductName(p)}</span>${copyIconButton("copyText('"+getDisplayProductName(p).replace(/'/g,"\\'")+"','商品名称已复制',event)",'复制商品名称')}</div>
          <div class="spu-line code-line"><span class="code-label">商城SPU：</span>${p.spu}${copyIconButton("copyText('"+p.spu+"','商城SPU已复制',event)",'复制商城SPU')}</div>
          <div class="spu-line cat-line">${meta.brand} <span style="color:var(--border);margin:0 6px;">|</span> ${meta.category}</div>
          <div class="spu-line tag-line">${p.type==='combo'?'<span class="tag tag-purple">组合套装</span>':p.type==='virtual'?'<span class="tag tag-virtual">虚拟商品</span>':'<span class="tag tag-physical">实物商品</span>'}${p.skus.some(function(sk){return sk.type==='gift';})?'<span class="tag tag-purple">含营销SKU</span>':''}<span class="sku-count-tag">${skusInCh.length}个SKU</span></div>
        </div>
      </td>
      <td></td>
      <td class="price">${priceRange}</td>
      <td class="price">${mallRange}</td>
      <td class="price">${lineRange}</td>
      ${showChannelMargin ? '<td><span style="color:var(--text-muted);">-</span></td>' : ''}
      <td class="price">${p.type==='virtual'?'':p.totalStock}</td>
      <td>${sellableStatusText(aggSell)}</td>
      <td>${spuActionsHTML(p.id, p.name, p.spu, channelName, skusInCh[0] ? skusInCh[0].sku : '')}</td>
    </tr>`;
      skusInCh.forEach(s => {
        const c = s.channels.find(c => c.ch === channelName);
        html += `
    <tr class="row-sub row-chn" data-id="${p.id}" data-sku="${s.sku}" data-ch="${c.ch}"${isExp?'':' style="display:none"'}>
      <td class="sku-merged-cell">
        <input type="checkbox" class="checkbox chk-channel" data-id="${p.id}" data-sku="${s.sku}" onchange="onChSKUCheck(this,'${p.id}')" onclick="event.stopPropagation()">
        <span class="sku-spacer"></span>
        ${getThumbHTML(getDisplaySkuName(p, s), getDisplaySkuName(p, s), true, 'sku', p.spu)}
        <div class="sku-lines">
          <div class="sku-line name-line"><span class="name-ellipsis" title="${getDisplaySkuName(p, s).replace(/"/g,'&quot;')}">${getDisplaySkuName(p, s)}</span>${copyIconButton("copyText('"+getDisplaySkuName(p, s).replace(/'/g,"\\'")+"','SKU名称已复制',event)",'复制SKU名称')}</div>
          <div class="sku-line"><span class="spec-label">规格：</span><span class="spec-val" title="${s.spec.replace(/"/g,'&quot;')}">${s.spec}</span></div>
          <div class="sku-line"><span class="spec-label">商城SKU：</span><span class="sku-code">${s.sku}</span>${copyIconButton("copyText('"+s.sku+"','商城SKU已复制',event)",'复制商城SKU')}</div>
        </div>
      </td>
      <td>${s.customerCode ? '<span class="sku-code" style="margin-right:4px;">'+s.customerCode+'</span>'+copyIconButton("copyText('"+s.customerCode+"','客户编码已复制',event)",'复制客户编码') : '<span style="color:var(--text-muted);">—</span>'}</td>
      <td class="price">${c.price}</td>
      <td class="price">${getMallPrice(c)}</td>
      <td class="price">${c.linePrice || '<span style="color:var(--text-muted);">—</span>'}</td>
      ${showChannelMargin ? `<td>${(()=>{const sm=getChannelMode(c);if(sm!=='distribution')return'<span style=color:var(--text-muted);>—</span>';const cm=calcChannelMargin(getMallPrice(c),c.price);return cm.profit==="—"?"—":"<span style=color:" + (cm.neg?"var(--red)":"var(--text-primary)") + ">" + cm.profit + " / " + cm.margin + "</span>";})()}</td>` : ''}
      <td></td>
      <td>${sellableStatusText(c.sellable)}</td>
      <td>${chActionsHTML(p.id, p.name, p.spu, s.sku, c.ch)}</td>
    </tr>`;
      });
  });
  tbody.innerHTML = html;
  document.getElementById('pageInfo').textContent = `共 ${spus.length} 个SPU · ${totalSkus} 个SKU`;
  renderPaginationBar(totalPages);
  updateChExpandBtn();
}
let chAllExpanded = false;
function toggleChSPU(id) {
  if (expandedChSPUs.has(id)) { expandedChSPUs.delete(id); }
  else { expandedChSPUs.add(id); }
  chAllExpanded = false;
  renderChannelTable(currentChannel);
  updateChExpandBtn();
}
function expandAllChSPUs() {
  chAllExpanded = !chAllExpanded;
  expandedChSPUs.clear();
  if (chAllExpanded) {
    const spus = productData.filter(p => p.skus.some(s => s.channels.some(c => c.ch === currentChannel)));
    spus.forEach(p => expandedChSPUs.add(p.id));
  }
  renderChannelTable(currentChannel);
  updateChExpandBtn();
}
function updateChExpandBtn() {
  const btn = document.getElementById('btnChExpandAll');
  if (!btn) return;
  const spus = productData.filter(p => p.skus.some(s => s.channels.some(c => c.ch === currentChannel)));
  if (chAllExpanded && expandedChSPUs.size === spus.length) {
    btn.textContent = '全部收起 ▴'; chAllExpanded = true;
  } else if (expandedChSPUs.size === 0) {
    btn.textContent = '全部展开 ▾'; chAllExpanded = false;
  } else {
    btn.textContent = '全部展开 ▾'; chAllExpanded = false;
  }
}
// Cascade for channel view
function onChSPUCheck(cb, id) {
  document.querySelectorAll(`.chk-channel[data-id="${id}"][data-sku]`).forEach(c => { c.checked = cb.checked; });
  updateSelection();
}
function onChSKUCheck(cb, id) {
  const skuCbs = document.querySelectorAll(`.chk-channel[data-id="${id}"][data-sku]`);
  const allChecked = [...skuCbs].every(c => c.checked);
  const noneChecked = [...skuCbs].every(c => !c.checked);
  const spuCb = document.querySelector(`.chk-channel[data-id="${id}"]:not([data-sku])`);
  if (spuCb) { spuCb.checked = allChecked; spuCb.indeterminate = !allChecked && !noneChecked; }
  updateSelection();
}

// ==================== PAGINATION ====================
var currentPage = 1, PAGE_SIZE = 10, lastTotalPages = 1;
function renderPaginationBar(totalPages) {
  const bar = document.getElementById('paginationBar');
  if (!bar) return;
  let html = '';
  html += '<div class="page-btn' + (currentPage <= 1 ? ' disabled' : '') + '" onclick="goToPage(' + (currentPage - 1) + ')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>';
  const ms = 5, sp = Math.max(1, currentPage - Math.floor(ms / 2)), ep = Math.min(totalPages, sp + ms - 1);
  for (let i = sp; i <= ep; i++) html += '<div class="page-btn' + (i === currentPage ? ' active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</div>';
  html += '<div class="page-btn' + (currentPage >= totalPages ? ' disabled' : '') + '" onclick="goToPage(' + (currentPage + 1) + ')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>';
  bar.innerHTML = html;
  const jpi = document.getElementById('jumpPageInput');
  if (jpi) { jpi.max = totalPages; jpi.value = currentPage; }
}
function goToPage(p) {
  if (p < 1 || p > lastTotalPages || p === currentPage) return;
  currentPage = p;
  if (currentChannel) renderChannelTable(currentChannel);
  updateSelection();
}
function changePageSize() {
  PAGE_SIZE = parseInt(document.getElementById('pageSizeSelect').value) || 10;
  currentPage = 1;
  if (currentChannel) renderChannelTable(currentChannel);
  updateSelection();
}
function jumpToPage() {
  const input = document.getElementById('jumpPageInput');
  let p = parseInt(input.value) || 1;
  if (p < 1) p = 1;
  if (p > lastTotalPages) p = lastTotalPages;
  goToPage(p);
}

// 单商城模式：默认进入苏银商城商品表
currentChannel = '苏银商城';
renderChannelTable('苏银商城');
populateBrandFilter();
populateCategoryFilter();

// ==================== VIEW SWITCH ====================
function updateTableFooterVisibility() {
  var footer = document.getElementById('tableFooter');
  var content = document.querySelector('.content');
  var show = currentView === 'product' || (currentView === 'channel' && currentChannel);
  if (footer) footer.style.display = show ? 'flex' : 'none';
  if (content) content.style.paddingBottom = show ? '70px' : '24px';
}

// 单商城（苏银商城）模式：无多渠道切换、无渠道卡片入口与横幅，故 switchView / openChannelDetail / closeChannelDetail / channelBannerData / updateStatsRowVisibility 已移除。

// ==================== TOGGLE SELLABLE ====================
function confirmToggleOff() {
  const t = window._toggleTarget;
  if (t) {
    const p = productData.find(x => x.id === t.id);
    if (p) {
      const sku = p.skus.find(s => s.sku === t.sku);
      if (sku) {
        const c = sku.channels.find(x => x.ch === t.ch);
        if (c) { c.sellable = 'off'; refreshAll(); showToast('success', '已将 "' + p.name + ' @ ' + t.ch + '" 设为不可售'); }
      }
    }
  }
  closeModal('confirmToggleOff');
}

// ==================== BATCH ====================
function getSelectedItems() {
  const all = Array.from(document.querySelectorAll('.chk-channel:checked')).map(cb => {
    return { id: cb.dataset.id, sku: cb.dataset.sku || '', ch: cb.dataset.ch || '' };
  });
  // Channel view: deduplicate SPU vs SKU children
  const chSpuChecked = new Set(all.filter(i => !i.sku).map(i => i.id));
  return all.filter(i => !i.sku || !chSpuChecked.has(i.id));
}
function toggleAllView(cb, view) {
  const spuCbs = document.querySelectorAll('.chk-channel:not([data-sku])');
  spuCbs.forEach(spuCb => { spuCb.checked = cb.checked; onChSPUCheck(spuCb, spuCb.dataset.id); });
}

function updateSelection() {
  const count = getSelectedItems().length;
  const cls = currentView === 'product' ? '.chk-product' : '.chk-channel';
  // 商品维度排除最细的渠道行(data-ch)，只数 SKU 子行；渠道维度 SKU 行无 data-ch
  const skuSel = cls + '[data-sku]' + (currentView === 'product' ? ':not([data-ch])' : '');
  const skuChecked = document.querySelectorAll(skuSel + ':checked');
  const skuCount = skuChecked.length;
  const spuIds = new Set();
  skuChecked.forEach(cb => spuIds.add(cb.dataset.id));
  const el = document.getElementById('selectedInfo');
  el.textContent = '已选 ' + spuIds.size + ' 个SPU · ' + skuCount + ' 个SKU';
  el.style.display = skuCount === 0 ? 'none' : '';
  const dis = count === 0;
  document.getElementById('btnExport').disabled = dis;
  document.getElementById('btnPrice').disabled = dis;
  document.getElementById('btnTag').disabled = dis;
  document.getElementById('btnUntag').disabled = dis;
  document.getElementById('btnSellableOn').disabled = dis;
  document.getElementById('btnSellableOff').disabled = dis;
}
function batchExport() {
  const count = getSelectedItems().length;
  if (count === 0) { showToast('info', '请先勾选要操作的商品'); return; }
  const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
  showToast('success', '已导出 ' + count + ' 条商品数据（渠道商品导出_' + d + '.xlsx）');
}

// ---- 全量导出（渠道商品详情页右上角下拉） ----
function getAllChannelProducts() {
  var channelName = currentChannel;
  if (!channelName) return [];
  return productData.filter(function(p) {
    return p.skus.some(function(s) { return s.channels.some(function(c) { return c.ch === channelName; }); });
  });
}
function getFilteredChannelProducts() {
  var channelName = currentChannel;
  if (!channelName) return [];
  var typeFilter = getTypeFilter('channel');
  var statusFilter = getStatusFilter('channel');
  var brandFilter = getBrandFilter('channel');
  var categoryFilter = getCategoryFilter('channel');
  return productData.filter(function(p) {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (!p.skus.some(function(s) { return s.channels.some(function(c) { return c.ch === channelName; }); })) return false;
    if (brandFilter !== 'all' && getProductMeta(p).brand !== brandFilter) return false;
    if (categoryFilter !== 'all' && getProductTopCategory(p) !== categoryFilter) return false;
    if (statusFilter === 'on' && getChannelAggSellable(p, channelName) !== 'on') return false;
    if (statusFilter === 'off' && getChannelAggSellable(p, channelName) === 'on') return false;
    if (!importFilterActive || importFilterKeywords.length === 0) return true;
    var haystack = (p.name + ' ' + p.spu).toLowerCase();
    p.skus.forEach(function(s) {
      haystack += ' ' + s.sku.toLowerCase() + ' ' + s.spec.toLowerCase();
    });
    for (var i = 0; i < importFilterKeywords.length; i++) {
      if (haystack.indexOf(importFilterKeywords[i].toLowerCase()) !== -1) return true;
    }
    return false;
  });
}
function toggleChExportMenu(e) {
  e.stopPropagation();
  document.getElementById('exportMenuCh').classList.toggle('open');
}
function closeChExportMenu() { document.getElementById('exportMenuCh').classList.remove('open'); }
function exportAllChannelProducts(e) {
  if (e) e.stopPropagation();
  var total = getAllChannelProducts().length;
  closeChExportMenu();
  if (total === 0) { showToast('info', '当前渠道无商品可导出'); return; }
  showToast('success', '已导出全部 ' + total + ' 条商品数据为Excel，请关注下载通知');
}
function exportFilteredChannelProducts(e) {
  if (e) e.stopPropagation();
  var count = getFilteredChannelProducts().length;
  closeChExportMenu();
  if (count === 0) { showToast('info', '当前筛选条件下无商品可导出'); return; }
  showToast('success', '已导出筛选后 ' + count + ' 条商品数据为Excel，请关注下载通知');
}
document.addEventListener('click', function(e) {
  var dd = document.getElementById('exportDropdownCh');
  if (dd && !dd.contains(e.target)) closeChExportMenu();
});
function openBatchTag() {
  showToast('warning', '标签逻辑待定，功能开发中');
}
function openBatchUntag() {
  const count = getSelectedItems().length;
  if (count === 0) { showToast('info', '请先勾选要操作的商品'); return; }
  showToast('warning', '批量去标签功能开发中（已选 ' + count + ' 项）');
}
function batchSetSellable(mode) {
  const items = getSelectedItems();
  if (items.length === 0) { showToast('info', '请先勾选要操作的商品'); return; }
  const label = mode === 'on' ? '可售' : '不可售';
  if (!confirm('确认将已选的 ' + items.length + ' 个商品批量设为' + label + '？')) return;
  items.forEach(item => {
    const p = productData.find(x => x.id === item.id);
    if (!p) return;
    if (item.sku && item.ch) {
      // Channel-level
      p.skus.forEach(s => s.channels.forEach(c => {
        if (c.ch === item.ch && s.sku === item.sku && c.sellable !== 'locked') c.sellable = mode;
      }));
    } else if (item.sku) {
      // SKU-level
      p.skus.forEach(s => {
        if (s.sku === item.sku) s.channels.forEach(c => { if (c.sellable !== 'locked') c.sellable = mode; });
      });
    } else {
      // SPU-level
      p.skus.forEach(s => s.channels.forEach(c => { if (c.sellable !== 'locked') c.sellable = mode; }));
    }
  });
  showToast('success', '已批量设为' + label + '：' + items.length + ' 项');
  if (currentChannel) renderChannelTable(currentChannel);
}

// ==================== PRICE CHANGE ====================
function findPriceChangeTarget(id, skuCode, channelName) {
  const p = productData.find(x => x.id === id);
  if (!p) return null;
  const sku = p.skus.find(s => s.sku === skuCode);
  if (!sku) return null;
  const ch = sku.channels.find(c => c.ch === channelName);
  if (!ch) return null;
  return { p, sku, ch };
}
function openPriceChangeModal(id, skuCode, channelName) {
  const target = findPriceChangeTarget(id, skuCode, channelName);
  if (!target) { showToast('info', '请在具体渠道商品行操作改价'); return; }
  window._priceChangeTarget = { id, sku: skuCode, ch: channelName };
  const mode = getChannelMode(target.ch);
  document.getElementById('priceChangeProduct').textContent = getDisplaySkuName(target.p, target.sku);
  document.getElementById('priceChangeMeta').textContent = '商城SPU：' + target.p.spu + ' / 商城SKU：' + target.sku.sku + ' / 规格：' + target.sku.spec;
  document.getElementById('priceChangeChannel').innerHTML = target.ch.ch + ' <span class="tag ' + (mode === 'distribution' ? 'tag-blue' : 'tag-gray') + '">' + (mode === 'distribution' ? '分销' : '直销') + '</span>';
  document.getElementById('priceChangeOldPrice').textContent = target.ch.price;
  document.getElementById('priceChangeOldMallPrice').textContent = getMallPrice(target.ch);
  document.getElementById('priceChangeOldLinePrice').textContent = target.ch.linePrice;
  document.getElementById('priceChangeMallInput').value = parseCurrency(getMallPrice(target.ch));
  document.getElementById('priceChangeLineInput').value = parseCurrency(target.ch.linePrice);
  document.getElementById('priceChangeOldMallGroup').style.display = mode === 'distribution' ? '' : 'none';
  document.getElementById('priceChangeMallGroup').style.display = mode === 'distribution' ? '' : 'none';
  updatePriceChangePreview();
  openModal('priceChangeModal');
}
function updatePriceChangePreview() {
  const targetKey = window._priceChangeTarget;
  if (!targetKey) return;
  const target = findPriceChangeTarget(targetKey.id, targetKey.sku, targetKey.ch);
  if (!target) return;
  const channelVal = parseCurrency(target.ch.price); // 渠道价只读
  const mallVal = parseFloat(document.getElementById('priceChangeMallInput').value);
  const lineVal = parseFloat(document.getElementById('priceChangeLineInput').value);
  const preview = document.getElementById('priceChangePreview');
  if (!mallVal || mallVal <= 0) { preview.style.display = 'none'; return; }
  preview.style.display = 'block';
  const profit = mallVal - channelVal;
  const margin = (channelVal > 0 ? (profit / mallVal * 100).toFixed(1) : '0');
  let text = '预估毛利 ' + (profit >= 0 ? '+' : '') + formatCurrency(profit) + ' / ' + margin + '%';
  if (profit <= 0) text += '；商城价须大于渠道价';
  if (lineVal > 0 && lineVal < mallVal + 1) text += '；划线价须 ≥ 商城价 + 1';
  document.getElementById('priceChangePreviewValue').textContent = text;
  document.getElementById('priceChangePreviewValue').style.color = profit > 0 ? '#16a34a' : 'var(--red)';
}
function submitPriceChange() {
  const targetKey = window._priceChangeTarget;
  if (!targetKey) return;
  const target = findPriceChangeTarget(targetKey.id, targetKey.sku, targetKey.ch);
  if (!target) return;
  const channelVal = parseCurrency(target.ch.price); // 渠道价不可改
  const mallVal = parseFloat(document.getElementById('priceChangeMallInput').value);
  const lineVal = parseFloat(document.getElementById('priceChangeLineInput').value);
  if (!mallVal || mallVal <= 0) { showToast('info', '请输入商城价'); return; }
  if (!lineVal || lineVal <= 0) { showToast('info', '请输入划线价'); return; }
  if (lineVal < mallVal + 1) { lineVal = mallVal + 1; document.getElementById('priceChangeLineInput').value = lineVal; showToast('info', '划线价须 ≥ 商城价 + 1 元，已自动调整为 ' + lineVal); }
  if (mallVal <= channelVal) {
    var cmp = mallVal < channelVal ? '小于' : '等于';
    openLossConfirm('商城价 ' + formatCurrency(mallVal) + ' ' + cmp + '渠道价 ' + target.ch.price + '，将产生亏损或零毛利。', function() { applyPriceChange(target, mallVal, lineVal); });
    return;
  }
  applyPriceChange(target, mallVal, lineVal);
}
function applyPriceChange(target, mallVal, lineVal) {
  target.ch.mallPrice = formatCurrency(mallVal);
  target.ch.linePrice = formatCurrency(lineVal);
  refreshAll();
  closeModal('priceChangeModal');
  showToast('success', '已更新 ' + target.p.name + ' @ ' + target.ch.ch + ' 的商城价/划线价');
}
// 划线价失焦校验：低于 商城价+1 则回退至 商城价+1（按 PRD §6.5）
function autoFixLinePrice() {
  var mallVal = parseFloat(document.getElementById('priceChangeMallInput').value);
  var lineInput = document.getElementById('priceChangeLineInput');
  var lineVal = parseFloat(lineInput.value);
  if (mallVal > 0 && (!lineVal || lineVal < mallVal + 1)) {
    lineInput.value = mallVal + 1;
    showToast('info', '划线价须 ≥ 商城价 + 1 元，已自动调整为 ' + (mallVal + 1));
    updatePriceChangePreview();
  }
}
function autoFixBatchLinePrice(index) {
  var rowEl = document.querySelectorAll('#batchPriceList .batch-price-row')[index];
  if (!rowEl) return;
  var mallVal = parseFloat(rowEl.querySelector('.batch-price-mall').value);
  var lineInput = rowEl.querySelector('.batch-price-line');
  var lineVal = parseFloat(lineInput.value);
  if (mallVal > 0 && (!lineVal || lineVal < mallVal + 1)) {
    lineInput.value = mallVal + 1;
    showToast('info', '第 ' + (index + 1) + ' 行划线价须 ≥ 商城价 + 1 元，已自动调整');
    updateBatchPricePreview(index);
  }
}
// 亏损二次确认弹窗（单品/批量共用）
function openLossConfirm(msg, onConfirm) {
  document.getElementById('priceLossConfirmMsg').textContent = msg;
  window._priceLossConfirmCb = onConfirm;
  openModal('priceLossConfirmModal');
}
function closeLossConfirm() {
  window._priceLossConfirmCb = null;
  closeModal('priceLossConfirmModal');
}
function confirmLossSave() {
  var cb = window._priceLossConfirmCb;
  window._priceLossConfirmCb = null;
  closeModal('priceLossConfirmModal');
  if (typeof cb === 'function') cb();
}

function collectPriceTargets(items) {
  const seen = {};
  const rows = [];
  items.forEach(item => {
    const p = productData.find(x => x.id === item.id);
    if (!p) return;
    p.skus.forEach(s => {
      if (item.sku && s.sku !== item.sku) return;
      s.channels.forEach(c => {
        if (item.ch && c.ch !== item.ch) return;
        if (currentChannel && !item.ch && c.ch !== currentChannel) return;
        const key = p.id + '|' + s.sku + '|' + c.ch;
        if (seen[key]) return;
        seen[key] = true;
        rows.push({ p, sku: s, ch: c, key });
      });
    });
  });
  return rows;
}
function priceRowProfitHTML(p, ch, mallVal, lineVal) {
  const channelVal = parseCurrency(ch.price); // 渠道价只读
  if (!mallVal || mallVal <= 0) return '<span style="color:var(--text-muted);">请输入商城价</span>';
  const profit = mallVal - channelVal;
  const margin = (profit / mallVal * 100).toFixed(1);
  let html = '<strong style="color:' + (profit > 0 ? 'var(--text-primary)' : 'var(--red)') + '">预估毛利 ' + formatCurrency(profit) + ' / ' + margin + '%</strong>';
  if (profit <= 0) html += '<div class="batch-price-warning">商城价 ≤ 渠道价，亏损或零毛利</div>';
  if (lineVal > 0 && lineVal < mallVal + 1) html += '<div class="batch-price-warning">划线价须 ≥ 商城价 + 1</div>';
  return html;
}
function openBatchPriceModal() {
  const items = getSelectedItems();
  if (items.length === 0) { showToast('info', '请先勾选要操作的商品'); return; }
  const rows = collectPriceTargets(items);
  if (rows.length === 0) { showToast('info', '当前选择无可改价商品'); return; }
  window._batchPriceTargets = rows.map(r => r.key);
  document.getElementById('batchPriceSummary').innerHTML = '<span class="summary-item">已选择 <strong>' + rows.length + '</strong> 条商品</span>';

  function productCell(r) {
    return '<div class="product-cell"><div class="name">' + getDisplaySkuName(r.p, r.sku) + '</div><div class="meta">商城SKU：' + r.sku.sku + '</div></div>';
  }
  function rowHTML(r, index) {
    const oldMall = getMallPrice(r.ch);
    return '<tr class="batch-price-row" data-key="' + r.key + '">' +
      '<td>' + productCell(r) + '</td>' +
      '<td>' + r.ch.ch + '</td>' +
      '<td class="readonly-price">' + r.ch.price + '</td>' +
      '<td><input class="batch-price-mall" type="number" min="0" step="0.01" value="' + parseCurrency(oldMall) + '" oninput="updateBatchPricePreview(' + index + ')"></td>' +
      '<td><input class="batch-price-line" type="number" min="0" step="0.01" value="' + parseCurrency(r.ch.linePrice) + '" oninput="updateBatchPricePreview(' + index + ')" onblur="autoFixBatchLinePrice(' + index + ')"></td>' +
      '<td><div class="batch-price-profit" id="batchPriceProfit' + index + '">' + priceRowProfitHTML(r.p, r.ch, parseCurrency(oldMall), parseCurrency(r.ch.linePrice)) + '</div></td>' +
    '</tr>';
  }
  const html = '<div class="batch-price-section"><div class="batch-price-section-head"><div class="batch-price-section-title">批量改价</div><div class="batch-price-section-hint">仅可改商城价（须 &gt; 渠道价，否则亏损提醒）与划线价（须 ≥ 商城价 + 1）</div></div><div class="batch-price-table-wrap"><table class="batch-price-table"><thead><tr><th style="width:200px;">商品信息</th><th style="width:120px;">所属商城</th><th style="width:90px;">渠道价</th><th style="width:130px;">新商城价</th><th style="width:130px;">新划线价</th><th style="width:200px;">预估毛利</th></tr></thead><tbody>' + rows.map(function(r, i) { return rowHTML(r, i); }).join('') + '</tbody></table></div></div>';
  document.getElementById('batchPriceList').innerHTML = html;
  openModal('batchPriceModal');
}
function getBatchPriceRows() {
  const keys = window._batchPriceTargets || [];
  return keys.map(function(key) {
    const parts = key.split('|');
    return findPriceChangeTarget(parts[0], parts[1], parts[2]);
  }).filter(Boolean);
}
function updateBatchPricePreview(index) {
  const rowEl = document.querySelectorAll('#batchPriceList .batch-price-row')[index];
  const target = getBatchPriceRows()[index];
  if (!rowEl || !target) return;
  const mallVal = parseFloat(rowEl.querySelector('.batch-price-mall').value);
  const lineVal = parseFloat(rowEl.querySelector('.batch-price-line').value);
  document.getElementById('batchPriceProfit' + index).innerHTML = priceRowProfitHTML(target.p, target.ch, mallVal, lineVal);
}
function submitBatchPriceChange() {
  const targets = getBatchPriceRows();
  if (targets.length === 0) return;
  let rows = [];
  let lossCount = 0;
  let lineFixedCount = 0;
  for (let i = 0; i < targets.length; i++) {
    const rowEl = document.querySelectorAll('#batchPriceList .batch-price-row')[i];
    const mallVal = parseFloat(rowEl.querySelector('.batch-price-mall').value);
    let lineVal = parseFloat(rowEl.querySelector('.batch-price-line').value);
    const channelVal = parseCurrency(targets[i].ch.price);
    if (!mallVal || mallVal <= 0) { showToast('info', '第 ' + (i + 1) + ' 行请输入有效商城价'); return; }
    if (!lineVal || lineVal <= 0) { showToast('info', '第 ' + (i + 1) + ' 行请输入有效划线价'); return; }
    if (lineVal < mallVal + 1) { lineVal = mallVal + 1; rowEl.querySelector('.batch-price-line').value = lineVal; lineFixedCount++; }
    if (mallVal <= channelVal) lossCount++;
    rows.push({ target: targets[i], mallVal: mallVal, lineVal: lineVal });
  }
  if (lineFixedCount > 0) showToast('info', lineFixedCount + ' 行划线价 < 商城价 + 1，已自动调整为 商城价 + 1');
  if (lossCount > 0) {
    openLossConfirm('其中 ' + lossCount + ' 条商城价 ≤ 渠道价，将产生亏损或零毛利。', function() { applyBatchSave(rows); });
    return;
  }
  applyBatchSave(rows);
}
function applyBatchSave(rows) {
  rows.forEach(function(r) {
    r.target.ch.mallPrice = formatCurrency(r.mallVal);
    r.target.ch.linePrice = formatCurrency(r.lineVal);
  });
  refreshAll();
  closeModal('batchPriceModal');
  showToast('success', '已批量更新 ' + rows.length + ' 条商品的商城价/划线价');
}
function refreshAll() {
  if (currentChannel) renderChannelTable(currentChannel);
  updateSelection();
}

// ==================== MODAL ====================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ==================== IMPORT FILTER ====================
var importFilterMode = ''; // 'upload' | 'paste'

function toggleImportFilter() {
  var dd = document.getElementById('importFilterDropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
function openImportFilterModal(mode) {
  document.getElementById('importFilterDropdown').style.display = 'none';
  importFilterMode = mode;
  var title = document.getElementById('importFilterModalTitle');
  var body = document.getElementById('importFilterModalBody');
  if (mode === 'upload') {
    title.textContent = '导入文件筛选';
    body.innerHTML =
      '<div class="import-filter-modal-upload" onclick="document.getElementById(\'importFileInput\').click()">' +
      '<div class="upload-icon">📂</div>' +
      '<div class="upload-text">点击上传文件</div>' +
      '<div class="upload-hint">支持 .xlsx / .xls / .csv，第一列为商城SKU或商城SPU</div>' +
      '<input type="file" id="importFileInput" accept=".xlsx,.xls,.csv" onchange="onImportFileSelected(this.files[0])">' +
      '</div>' +
      '<div id="importFileInfo" style="margin-top:8px;font-size:12px;color:var(--text-muted);"></div>' +
      '<div style="margin-top:10px;font-size:11px;color:var(--text-muted);border-top:1px solid var(--border-light);padding-top:8px;">' +
      '💡 原型演示：不上传文件直接点"应用筛选"将使用内置示例数据（5个商城SKU）</div>';
  } else {
    title.textContent = '批量粘贴筛选';
    // Demo data pre-filled
    var demoSKUs = 'S001A00004001\nS001A00006001\nS001A00003001\nS001A00010001\nS001A00011001';
    body.innerHTML =
      '<div class="import-filter-modal-paste">' +
      '<textarea id="importPasteArea" placeholder="粘贴商城SKU/商城SPU，每行一个，或用逗号/Tab分隔" rows="5" oninput="updatePasteCount()">' + demoSKUs + '</textarea>' +
      '<div class="paste-count">已识别 <strong id="importPasteCount">5</strong> 条关键词（自动去重）</div>' +
      '<div style="margin-top:8px;font-size:11px;color:var(--text-muted);">💡 原型演示：已预填示例SKU编码，可直接点"应用筛选"查看效果</div>' +
      '</div>';
  }
  openModal('importFilterModal');
}
function onImportFileSelected(file) {
  if (!file) return;
  document.getElementById('importFileInfo').textContent = '已选择: ' + file.name;
}
function updatePasteCount() {
  var text = document.getElementById('importPasteArea').value;
  document.getElementById('importPasteCount').textContent = parseKeywords(text).length;
}
function confirmImportFilter() {
  var keywords = [];
  if (importFilterMode === 'upload') {
    var fileInput = document.getElementById('importFileInput');
    var file = fileInput && fileInput.files[0];
    if (!file) {
      // Demo mode: use built-in sample data
      keywords = ['S001A00004001', 'S001A00006001', 'S001A00003001', 'S001A00009001', 'S001A00005001'];
      applyImportFilter(keywords);
      closeModal('importFilterModal');
      return;
    }
    // Process file in modal - use reader
    var reader = new FileReader();
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      if (typeof XLSX !== 'undefined') {
        reader.readAsArrayBuffer(file);
        reader.onload = function(e) {
          var data = new Uint8Array(e.target.result);
          var wb = XLSX.read(data, {type: 'array'});
          var firstSheet = wb.Sheets[wb.SheetNames[0]];
          var rows = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
          var colVals = [];
          for (var i = 0; i < rows.length; i++) { if (rows[i] && rows[i][0]) colVals.push(String(rows[i][0]).trim()); }
          keywords = []; var seen = {};
          for (var j = 0; j < colVals.length; j++) { if (colVals[j] && !seen[colVals[j]]) { seen[colVals[j]] = true; keywords.push(colVals[j]); } }
          keywords = keywords.slice(0, 500);
          if (keywords.length === 0) { showToast('warning', '未识别到有效关键词'); return; }
          applyImportFilter(keywords);
          closeModal('importFilterModal');
        };
        return; // async, don't continue
      } else { reader.readAsText(file, 'UTF-8'); }
    } else { reader.readAsText(file, 'UTF-8'); }
    reader.onload = function(e) {
      keywords = parseKeywords(e.target.result);
      if (keywords.length === 0) { showToast('warning', '未识别到有效关键词，请检查文件内容'); return; }
      applyImportFilter(keywords);
      closeModal('importFilterModal');
    };
  } else {
    keywords = parseKeywords(document.getElementById('importPasteArea').value);
    if (keywords.length === 0) { showToast('warning', '请粘贴至少一条关键词'); return; }
    applyImportFilter(keywords);
    closeModal('importFilterModal');
  }
}
function parseKeywords(text) {
  if (!text) return [];
  var parts = text.split(/[\n\r,;\t]+/);
  var keywords = []; var seen = {};
  for (var i = 0; i < parts.length; i++) {
    var kw = parts[i].trim();
    if (kw && !seen[kw]) { seen[kw] = true; keywords.push(kw); }
  }
  return keywords.slice(0, 500);
}
function applyImportFilter(keywords) {
  importFilterKeywords = keywords;
  importFilterActive = true;
  var tag = document.getElementById('importFilterTag');
  if (tag) { tag.style.display = 'inline-flex'; document.getElementById('importFilterCount').textContent = keywords.length; }
  var tagCh = document.getElementById('importFilterTagCh');
  if (tagCh) { tagCh.style.display = 'inline-flex'; document.getElementById('importFilterCountCh').textContent = keywords.length; }
  expandedSPUs.clear(); expandedChSPUs.clear(); allExpanded = false; chAllExpanded = false;
  currentPage = 1;
  if (currentChannel) renderChannelTable(currentChannel);
  showToast('success', '已应用导入筛选: ' + keywords.length + ' 条关键词');
}
function clearImportFilter() {
  importFilterKeywords = [];
  importFilterActive = false;
  var tag = document.getElementById('importFilterTag');
  if (tag) tag.style.display = 'none';
  var tagCh = document.getElementById('importFilterTagCh');
  if (tagCh) tagCh.style.display = 'none';
  expandedSPUs.clear(); expandedChSPUs.clear(); allExpanded = false; chAllExpanded = false;
  currentPage = 1;
  if (currentChannel) renderChannelTable(currentChannel);
  showToast('success', '已清除导入筛选，显示全部商品');
}
document.addEventListener('click', function(e) {
  var dd = document.getElementById('importFilterDropdown');
  var wrap = document.querySelector('.import-filter-wrap');
  if (dd && wrap && !wrap.contains(e.target)) { dd.style.display = 'none'; }
  var dd2 = document.getElementById('importFilterDropdownDetail');
  if (dd2 && !e.target.closest('.import-filter-wrap')) { dd2.style.display = 'none'; }
});

// ==================== TOAST ====================
function copyText(text, doneMsg, e) {
  if (e) e.stopPropagation();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() { showToast('success', doneMsg); });
  } else { showToast('info', text); }
}
function showToast(type, msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = 'all .2s ease'; setTimeout(() => toast.remove(), 200); }, 3000);
}

// ==================== KEYBOARD ====================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(el => { el.classList.remove('open'); });
  }
});

// Open product detail page
function openDetailPage(spu, sku, tab, channel) {
  var url = '01a.商品详情-原型页面.html?spu=' + encodeURIComponent(spu);
  if (sku) url += '&sku=' + encodeURIComponent(sku);
  if (tab) url += '&tab=' + encodeURIComponent(tab);
  if (channel) url += '&channel=' + encodeURIComponent(channel);
  // Combo SPU (C prefix) → combo mode
  if (spu && spu.charAt(0) === 'C') url += '&mode=combo';
  window.open(url, '_blank');
}
updateTableFooterVisibility();
