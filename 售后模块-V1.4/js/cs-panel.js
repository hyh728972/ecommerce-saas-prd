/* ===== 在线客服 - 咨询方式选择面板 ===== */
(function () {
  // OCS 客服项目路径（动态计算，兼容中文路径与根目录重命名）
  // 小程序页面在 mini-program/pages/ 下，OCS 在 <根目录>/OCS/prototype-cs/user/ 下
  function resolveOcsBase() {
    // 通过定位 /mini-program/ 目录计算根路径（根目录名任意，rename 不影响）
    var path = location.pathname;
    // file:///C:/Users/.../<根目录>/mini-program/pages/xxx.html
    // 找到 /mini-program/ 的位置（mini-program 为稳定目录名）
    var idx = path.indexOf('/mini-program/');
    if (idx === -1) {
      // 尝试 URL 编码后的目录名
      idx = path.indexOf('/' + encodeURIComponent('mini-program') + '/');
    }
    if (idx !== -1) {
      // 根目录 = mini-program 的父目录，OCS 在根目录下
      return path.substring(0, idx) + '/OCS/prototype-cs/user/user-chat-basic.html';
    }
    // 兜底：相对路径（页面位于 mini-program/pages/ 下）
    return '../../OCS/prototype-cs/user/user-chat-basic.html';
  }
  var OCS_BASE = resolveOcsBase();
  var CS_PHONE = '400-888-8888';

  // 当前页面已初始化标记
  if (window._csPanelInit) return;
  window._csPanelInit = true;

  // ---- 注入 HTML ----
  // 3 个圆形图标按钮居中横排浮在遮罩上（浮窗样式）
  // 顺序：电话客服 → 在线咨询 → 商务合作（在线咨询放在电话客服的后一个）
  var html = [
    '<div class="cs-panel-mask" id="csSheetMask">',
    '  <div class="cs-panel-opts" id="csSheet">',
    '    <button class="cs-panel-opt" id="csSheetPhone">',
    '      <span class="opt-icon phone">',
    '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    '      </span>',
    '      <span class="opt-name">电话客服</span>',
    '    </button>',
    '    <button class="cs-panel-opt" id="csSheetOnline">',
    '      <span class="opt-icon online">',
    '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    '      </span>',
    '      <span class="opt-name">在线咨询</span>',
    '    </button>',
    '    <button class="cs-panel-opt" id="csSheetBusiness">',
    '      <span class="opt-icon business">',
    '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    '      </span>',
    '      <span class="opt-name">商务合作</span>',
    '    </button>',
    '  </div>',
    '</div>'
  ].join('\n');

  var wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  // 插入到 phone-frame 内部，使遮罩和弹窗限制在手机框内
  var frame = document.querySelector('.phone-frame') || document.body;
  frame.appendChild(wrapper.firstElementChild);

  // ---- 事件绑定 ----
  var mask = document.getElementById('csSheetMask');
  var sheet = document.getElementById('csSheet');
  var onlineBtn = document.getElementById('csSheetOnline');
  var phoneBtn = document.getElementById('csSheetPhone');
  var businessBtn = document.getElementById('csSheetBusiness');
  var pendingTag = null;
  var pendingParams = {};

  // 进入在线咨询（带场景参数），供 skipPanel 场景直接调用
  function gotoOnline(tag, params) {
    tag = tag || 'home';
    params = params || {};
    var qs = ['entry_tag=' + encodeURIComponent(tag)];
    for (var k in params) {
      if (params.hasOwnProperty(k)) qs.push(k + '=' + encodeURIComponent(params[k]));
    }
    location.href = OCS_BASE + '?' + qs.join('&');
  }

  function openSheet(tag, params, opts) {
    pendingTag = tag || 'home';
    pendingParams = params || {};
    // 场景化入口（skipPanel:true）：跳过面板，直接进在线咨询
    if (opts && opts.skipPanel) {
      gotoOnline(pendingTag, pendingParams);
      return;
    }
    // 通用入口：弹 3 选项浮窗
    mask.classList.add('show');
    sheet.classList.add('show');
  }
  function closeSheet() {
    mask.classList.remove('show');
    sheet.classList.remove('show');
    pendingTag = null;
    pendingParams = {};
  }

  // 暴露给页面调用
  window.csPanel = { open: openSheet, close: closeSheet };

  mask.addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { e.stopPropagation(); });

  // 在线咨询 → 跳转 OCS 客服页
  onlineBtn.addEventListener('click', function () {
    var tag = pendingTag;
    var params = pendingParams;
    closeSheet();
    var qs = ['entry_tag=' + encodeURIComponent(tag)];
    for (var k in params) {
      if (params.hasOwnProperty(k)) qs.push(k + '=' + encodeURIComponent(params[k]));
    }
    location.href = OCS_BASE + '?' + qs.join('&');
  });

  // 电话客服 → 确认拨打
  phoneBtn.addEventListener('click', function () {
    closeSheet();
    if (window.confirm('是否拨打客服热线 ' + CS_PHONE + '？')) {
      // 演示：实际环境调用 tel: 协议
      setTimeout(function () { alert('正在拨打 ' + CS_PHONE + '…'); }, 100);
    }
  });

  // 商务合作 → 提示（演示）
  businessBtn.addEventListener('click', function () {
    closeSheet();
    setTimeout(function () { alert('商务合作请联系：400-888-8888 转 8'); }, 100);
  });

  // ---- 悬浮客服按钮自动绑定 ----
  // data-cs-skip-panel="true" 的按钮跳过面板，直接进在线咨询（场景化入口）
  // 支持拖拽 + 松手吸边（AC-U-06/07）：基于 phone-frame 边界，4px 阈值区分点击/拖拽
  document.querySelectorAll('.cs-fab-entry').forEach(function (fab) {
    var tag = fab.getAttribute('data-cs-tag') || 'home';
    var skip = fab.getAttribute('data-cs-skip-panel') === 'true';

    // ===== 拖拽 + 吸边逻辑（Pointer Events） =====
    var MARGIN = 12; // 与默认 right:12px 一致
    var dragging = false, moved = false;
    var startX = 0, startY = 0, offsetX = 0, offsetY = 0;

    // 拖拽容器：按钮的 offsetParent（通常是 .phone-frame）
    function getContainer() {
      return fab.offsetParent || document.querySelector('.phone-frame') || document.body;
    }

    // 拖拽前切换为 left/top 绝对定位（保留视觉位置，避免 right/bottom 干扰）
    function toAbsolute() {
      var r = fab.getBoundingClientRect();
      var c = getContainer();
      var cr = c.getBoundingClientRect();
      fab.style.right = 'auto'; fab.style.bottom = 'auto';
      fab.style.left = (r.left - cr.left) + 'px';
      fab.style.top = (r.top - cr.top) + 'px';
    }

    fab.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false;
      fab.setPointerCapture(e.pointerId);
      var r = fab.getBoundingClientRect();
      toAbsolute();
      startX = e.clientX; startY = e.clientY;
      offsetX = e.clientX - r.left; offsetY = e.clientY - r.top;
      fab.classList.add('dragging');
      e.preventDefault();
    });

    fab.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      // 4px 阈值：超过则视为拖拽，避免误触
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      var c = getContainer();
      var cr = c.getBoundingClientRect();
      var w = fab.offsetWidth, h = fab.offsetHeight;
      var x = e.clientX - cr.left - offsetX;
      var y = e.clientY - cr.top - offsetY;
      // 限制在容器内（边距 MARGIN）
      var maxX = cr.width - w - MARGIN;
      var maxY = cr.height - h - MARGIN;
      x = Math.max(MARGIN, Math.min(maxX, x));
      y = Math.max(MARGIN, Math.min(maxY, y));
      fab.style.left = x + 'px'; fab.style.top = y + 'px';
    });

    fab.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      fab.classList.remove('dragging');
      // 未真正拖动 > 让 click 事件接管（触发 openSheet）
      if (!moved) return;
      // 拖动过 > 吸附到最近屏幕边缘（基于 phone-frame）
      var c = getContainer();
      var cr = c.getBoundingClientRect();
      var r = fab.getBoundingClientRect();
      var w = fab.offsetWidth, h = fab.offsetHeight;
      var centerX = r.left - cr.left + w / 2;
      var snapLeft = centerX < cr.width / 2;
      var y = parseFloat(fab.style.top) || (r.top - cr.top);
      y = Math.max(MARGIN, Math.min(cr.height - h - MARGIN, y));
      // 切换为 left+top / right+top 定位，触发 transition 吸边动画
      fab.style.left = ''; fab.style.right = '';
      if (snapLeft) { fab.style.left = MARGIN + 'px'; }
      else { fab.style.right = MARGIN + 'px'; }
      fab.style.top = y + 'px';
      e.preventDefault();
    });

    // 点击处理：拖动发生过则阻止（避免吸边后误触发咨询面板）
    fab.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); moved = false; return; }
      openSheet(tag, {}, { skipPanel: skip });
    });
  });

  // ---- 页面内联客服按钮自动绑定 ----
  document.querySelectorAll('.cs-inline-btn').forEach(function (btn) {
    var tag = btn.getAttribute('data-cs-tag') || 'home';
    var skip = btn.getAttribute('data-cs-skip-panel') === 'true';
    btn.addEventListener('click', function () {
      openSheet(tag, {}, { skipPanel: skip });
    });
  });

  // ---- cs-fab-entry 与页面 fab-btn 同步显示（滚动后出现） ----
  // 监听 .page-scroll 滚动，滚动超过阈值时显示 cs-fab-entry，与 fab-top 错开位置
  (function syncFabEntry() {
    var fabEntries = document.querySelectorAll('.cs-fab-entry');
    if (!fabEntries.length) return;
    var pageScroll = document.querySelector('.page-scroll');
    if (!pageScroll) return;
    var THRESHOLD = 200;
    function onScroll() {
      var scrolled = pageScroll.scrollTop > THRESHOLD;
      fabEntries.forEach(function (fab) {
        fab.classList.toggle('show', scrolled);
      });
    }
    pageScroll.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();
})();
