/**
 * 模板列表 / 应用列表原型交互逻辑（模板列表.html、品牌商城端.html）
 */

/** @type {boolean} */
const IS_BRAND_MALL = typeof window !== 'undefined' && window.BRAND_MALL_PAGE === true;

/** @type {number} */
const LIST_PAGE_SIZE = 5;

/** @type {'template'|'app'} */
let currentListTab = 'template';

/** @type {number} */
let templatePage = 1;

/** @type {number} */
let appPage = 1;

/** @type {string[]} */
let selectedTemplateIds = [];

/** @type {string|null} */
let promotingAppId = null;

/** @type {string|null} */
let pushDetailAppId = null;

/** @type {string|null} */
let useAppId = null;

/** @type {string} */
let createAppPreviewPageId = 'home';

/** @type {string} */
let pushDetailPreviewPageId = 'home';

/** @type {Function|null} */
let appDialogOkCallback = null;

/** @type {Function|null} */
let appDialogCancelCallback = null;

/**
 * HTML 转义
 * @param {string|null|undefined} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * 显示弹窗遮罩
 * @param {string} id
 */
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

/**
 * 关闭弹窗遮罩
 * @param {string} id
 */
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

/**
 * 模板状态文案
 * @param {string} status
 * @returns {string}
 */
function getTemplateStatusText(status) {
  const map = { draft: '草稿', published: '已发布', pushed: '已发布' };
  return map[status] || status;
}

/**
 * 应用状态文案
 * @param {string} status
 * @returns {string}
 */
function getAppStatusText(status) {
  const map = { draft: '草稿', published: '已发布' };
  return map[status] || status;
}

/**
 * 格式化当前时间
 * @returns {string}
 */
function formatDateTime() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * 查找应用
 * @param {string} id
 * @returns {object|undefined}
 */
function findAppById(id) {
  return (MOCK_APPS || []).find((a) => a.id === id);
}

/**
 * 获取应用推送配置
 * @param {object} app
 * @returns {object}
 */
function getAppPushConfig(app) {
  if (app.pushConfig) return app.pushConfig;
  const allChannels = MOCK_PUSH_CHANNELS || [];
  const allPageIds = (MOCK_BUILD_PAGES || []).map((p) => p.id);
  const record = (MOCK_APP_PUSH_RECORDS || []).find((r) => r.appId === app.id);
  const pushChannelIds = record ? record.channelIds.slice() : [];
  const isAll =
    pushChannelIds.length === allChannels.length &&
    allChannels.every((c) => pushChannelIds.includes(c.id));
  return {
    pageMode: 'all',
    pageIds: allPageIds,
    copyProducts: true,
    priceMode: 'default',
    priceCoeff: 1.2,
    pushChannelMode: isAll ? 'all' : 'custom',
    pushChannelIds,
  };
}

/**
 * 显示 Toast
 * @param {string} message
 */
function showAppToast(message) {
  const el = document.getElementById('appToast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(showAppToast._timer);
  showAppToast._timer = setTimeout(() => el.classList.remove('show'), 2200);
}

/**
 * 关闭应用内弹窗
 */
function closeAppDialog() {
  closeModal('appDialog');
  appDialogOkCallback = null;
  appDialogCancelCallback = null;
}

/**
 * 应用内弹窗确定
 */
function onAppDialogOk() {
  const cb = appDialogOkCallback;
  closeAppDialog();
  if (cb) cb();
}

/**
 * 应用内弹窗取消
 */
function onAppDialogCancel() {
  const cb = appDialogCancelCallback;
  closeAppDialog();
  if (cb) cb();
}

/**
 * 显示提示弹窗
 * @param {string} message
 * @param {string} [title]
 */
function showAppDialog(message, title) {
  const titleEl = document.getElementById('appDialogTitle');
  const msgEl = document.getElementById('appDialogMessage');
  const cancelBtn = document.getElementById('appDialogCancelBtn');
  const okBtn = document.getElementById('appDialogOkBtn');
  if (titleEl) titleEl.textContent = title || '提示';
  if (msgEl) msgEl.textContent = message;
  if (cancelBtn) cancelBtn.style.display = 'none';
  if (okBtn) okBtn.textContent = '知道了';
  appDialogOkCallback = null;
  appDialogCancelCallback = null;
  showModal('appDialog');
}

/**
 * 显示确认弹窗
 * @param {string} message
 * @param {Function} onConfirm
 * @param {string} [title]
 * @param {string} [okText]
 */
function showAppConfirm(message, onConfirm, title, okText) {
  const titleEl = document.getElementById('appDialogTitle');
  const msgEl = document.getElementById('appDialogMessage');
  const cancelBtn = document.getElementById('appDialogCancelBtn');
  const okBtn = document.getElementById('appDialogOkBtn');
  if (titleEl) titleEl.textContent = title || '确认';
  if (msgEl) msgEl.textContent = message;
  if (cancelBtn) cancelBtn.style.display = '';
  if (okBtn) okBtn.textContent = okText || '确定';
  appDialogOkCallback = onConfirm;
  appDialogCancelCallback = null;
  showModal('appDialog');
}

/**
 * 切换主页面（侧栏）
 * @param {'list'|'pushRecord'} page
 */
function switchMainPage(page) {
  const menuList = document.getElementById('menuTemplateList');
  const menuPush = document.getElementById('menuPushRecord');
  if (menuList) menuList.classList.toggle('active', page === 'list');
  if (menuPush) menuPush.classList.toggle('active', page === 'pushRecord');
  if (page === 'pushRecord') {
    showAppToast('渠道推送记录为后续规划，本期原型未实现');
  }
}

/**
 * 切换列表 Tab
 * @param {'template'|'app'} tab
 */
function switchListTab(tab) {
  currentListTab = tab;
  document.querySelectorAll('.content-tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  const main = document.getElementById('mainContent');
  if (main) {
    main.classList.toggle('tab-template', tab === 'template');
    main.classList.toggle('tab-app', tab === 'app');
  }
  document.getElementById('panelTemplate')?.classList.toggle('active', tab === 'template');
  document.getElementById('panelApp')?.classList.toggle('active', tab === 'app');
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = tab === 'app' ? '应用列表' : '模板列表';
  if (tab === 'template') renderTemplateGrid();
  else renderAppGrid();
}

/**
 * 获取关键词筛选
 * @returns {string}
 */
function getKeywordFilter() {
  const el = document.getElementById('keywordFilter');
  return el ? el.value.trim().toLowerCase() : '';
}

/**
 * 获取状态筛选
 * @returns {string}
 */
function getStatusFilter() {
  const el = document.getElementById('statusFilter');
  return el ? el.value : '';
}

/**
 * 筛选模板列表
 * @returns {object[]}
 */
function getFilteredTemplates() {
  const kw = getKeywordFilter();
  const status = getStatusFilter();
  const tagEl = document.getElementById('tagFilter');
  const tag = tagEl ? tagEl.value : '';
  let list = (typeof templates !== 'undefined' ? templates : MOCK_TEMPLATES || []).slice();
  if (status) {
    list = list.filter((t) => {
      if (status === 'published') return t.status === 'published' || t.status === 'pushed';
      return t.status === status;
    });
  }
  if (tag) list = list.filter((t) => (t.tags || []).includes(tag));
  if (kw) list = list.filter((t) => t.name && t.name.toLowerCase().includes(kw));
  return list;
}

/**
 * 筛选应用列表
 * @returns {object[]}
 */
function getFilteredApps() {
  const kw = getKeywordFilter();
  const status = getStatusFilter();
  const sourceEl = document.getElementById('appSourceFilter');
  const source = sourceEl ? sourceEl.value : '';
  let list = (MOCK_APPS || []).slice();
  if (IS_BRAND_MALL) {
    list = list.filter((a) => a.status === 'published');
  }
  if (status) list = list.filter((a) => a.status === status);
  if (source) list = list.filter((a) => a.sourceChannel === source);
  if (kw) list = list.filter((a) => a.name && a.name.toLowerCase().includes(kw));
  return list;
}

/**
 * 更新分页信息
 * @param {string} infoId
 * @param {number} total
 * @param {number} page
 * @param {number} pageSize
 */
function updatePaginationInfo(infoId, total, page, pageSize) {
  const el = document.getElementById(infoId);
  if (!el) return;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  el.textContent = `总共 ${total} 条`;
  if (page > pages) page = pages;
}

/**
 * 渲染模板卡片网格
 */
function renderTemplateGrid() {
  const grid = document.getElementById('templateGrid');
  if (!grid) return;
  const all = getFilteredTemplates();
  const totalPages = Math.max(1, Math.ceil(all.length / LIST_PAGE_SIZE));
  if (templatePage > totalPages) templatePage = totalPages;
  const start = (templatePage - 1) * LIST_PAGE_SIZE;
  const list = all.slice(start, start + LIST_PAGE_SIZE);
  updatePaginationInfo('totalInfo', all.length, templatePage, LIST_PAGE_SIZE);

  if (!list.length) {
    grid.innerHTML = '<div class="template-empty" style="padding:24px;color:rgba(0,0,0,0.45)">暂无符合条件的模板</div>';
    selectedTemplateIds = [];
    syncSelectAllCheckbox();
    return;
  }

  grid.innerHTML = list
    .map((t) => {
      const checked = selectedTemplateIds.includes(t.id);
      return `
      <article class="template-card" data-id="${t.id}">
        <div class="template-card-cover">
          <label class="template-card-check" style="position:absolute;top:8px;right:8px;z-index:1">
            <input type="checkbox" class="tpl-row-check" value="${t.id}" ${checked ? 'checked' : ''}>
          </label>
          <span class="template-card-status">${escapeHtml(getTemplateStatusText(t.status))}</span>
        </div>
        <div class="template-card-body">
          <h3 class="template-card-title">${escapeHtml(t.name)}</h3>
          <div class="template-card-meta">最近修改：${escapeHtml(t.updatedAt)}</div>
          <div class="template-card-actions">
            <button type="button" class="btn-link btn-tpl-edit" data-id="${t.id}">编辑</button>
            ${t.status === 'draft' ? `<button type="button" class="btn-link btn-tpl-publish" data-id="${t.id}">发布</button>` : ''}
            <button type="button" class="btn-link btn-tpl-delete" data-id="${t.id}">删除</button>
          </div>
        </div>
      </article>`;
    })
    .join('');

  grid.querySelectorAll('.tpl-row-check').forEach((cb) => {
    cb.addEventListener('change', onTemplateRowCheckChange);
  });
  grid.querySelectorAll('.btn-tpl-edit').forEach((btn) => {
    btn.addEventListener('click', () => openEditor(btn.dataset.id));
  });
  grid.querySelectorAll('.btn-tpl-publish').forEach((btn) => {
    btn.addEventListener('click', () => publishTemplate(btn.dataset.id));
  });
  grid.querySelectorAll('.btn-tpl-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteTemplate(btn.dataset.id));
  });
  syncSelectAllCheckbox();
}

/**
 * 渲染应用卡片网格
 */
function renderAppGrid() {
  const grid = document.getElementById('appGrid');
  if (!grid) return;
  const all = getFilteredApps();
  const totalPages = Math.max(1, Math.ceil(all.length / LIST_PAGE_SIZE));
  if (appPage > totalPages) appPage = totalPages;
  const start = (appPage - 1) * LIST_PAGE_SIZE;
  const list = all.slice(start, start + LIST_PAGE_SIZE);
  updatePaginationInfo('appTotalInfo', all.length, appPage, LIST_PAGE_SIZE);

  if (!list.length) {
    grid.innerHTML = '<div class="app-empty" style="padding:24px;color:rgba(0,0,0,0.45)">暂无符合条件的应用</div>';
    return;
  }

  grid.innerHTML = list
    .map((a) => {
      const coverCls = a.status === 'draft' ? 'cover-app-draft' : 'cover-app-published';
      return `
      <article class="app-card" data-id="${a.id}">
        <div class="template-card-cover ${coverCls}">
          <span class="template-card-status">${escapeHtml(getAppStatusText(a.status))}</span>
        </div>
        <div class="app-card-body">
          <h3 class="app-card-title">${escapeHtml(a.name)}</h3>
          <div class="app-card-meta">来源：${escapeHtml(a.sourceChannel || '—')} · ${escapeHtml(a.updatedAt)}</div>
          <div class="app-card-actions">${renderAppCardActions(a)}</div>
        </div>
      </article>`;
    })
    .join('');

  bindAppCardActions(grid);
}

/**
 * 生成应用卡片操作按钮 HTML
 * @param {object} app
 * @returns {string}
 */
function renderAppCardActions(app) {
  if (IS_BRAND_MALL) {
    return `
      <button type="button" class="btn-link btn-app-use" data-id="${app.id}">使用</button>
      <button type="button" class="btn-link btn-app-detail" data-id="${app.id}">详情</button>`;
  }
  if (app.status === 'published') {
    return `
      <button type="button" class="btn-link btn-app-detail" data-id="${app.id}">详情</button>
      <button type="button" class="btn-link btn-app-promote" data-id="${app.id}">推送</button>
      <button type="button" class="btn-link btn-app-unpublish" data-id="${app.id}">取消发布</button>`;
  }
  return `
    <button type="button" class="btn-link btn-app-publish" data-id="${app.id}">发布</button>
    <button type="button" class="btn-link btn-app-edit" data-id="${app.id}">继续搭建</button>
    <button type="button" class="btn-link btn-app-delete" data-id="${app.id}">删除</button>`;
}

/**
 * 绑定应用卡片操作
 * @param {HTMLElement} container
 */
function bindAppCardActions(container) {
  container.querySelectorAll('.btn-app-detail').forEach((btn) => {
    btn.addEventListener('click', () => openPushDetailModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-app-promote').forEach((btn) => {
    btn.addEventListener('click', () => openPromoteAppModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-app-unpublish').forEach((btn) => {
    btn.addEventListener('click', () => unpublishApp(btn.dataset.id));
  });
  container.querySelectorAll('.btn-app-publish').forEach((btn) => {
    btn.addEventListener('click', () => publishApp(btn.dataset.id));
  });
  container.querySelectorAll('.btn-app-edit').forEach((btn) => {
    btn.addEventListener('click', () => editApp(btn.dataset.id));
  });
  container.querySelectorAll('.btn-app-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteApp(btn.dataset.id));
  });
  container.querySelectorAll('.btn-app-use').forEach((btn) => {
    btn.addEventListener('click', () => openUseAppModal(btn.dataset.id));
  });
}

/**
 * 同步全选复选框状态
 */
function syncSelectAllCheckbox() {
  const selectAll = document.getElementById('selectAll');
  const checks = document.querySelectorAll('#templateGrid .tpl-row-check');
  if (!selectAll) return;
  if (!checks.length) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
    return;
  }
  const checkedCount = Array.from(checks).filter((c) => c.checked).length;
  selectAll.checked = checkedCount === checks.length;
  selectAll.indeterminate = checkedCount > 0 && checkedCount < checks.length;
}

/**
 * 模板行勾选变化
 */
function onTemplateRowCheckChange() {
  const checks = document.querySelectorAll('#templateGrid .tpl-row-check');
  selectedTemplateIds = Array.from(checks)
    .filter((c) => c.checked)
    .map((c) => c.value);
  syncSelectAllCheckbox();
}

/**
 * 打开发布模板确认
 * @param {string} id
 */
function publishTemplate(id) {
  const t = MOCK_TEMPLATES.find((x) => x.id === id);
  if (!t) return;
  showAppConfirm(
    `确定发布模板「${t.name}」吗？`,
    () => {
      t.status = 'published';
      renderTemplateGrid();
      showAppToast('操作成功');
    },
    '发布模板',
    '确认发布'
  );
}

/**
 * 删除模板
 * @param {string} id
 */
function deleteTemplate(id) {
  const idx = MOCK_TEMPLATES.findIndex((x) => x.id === id);
  if (idx === -1) return;
  const t = MOCK_TEMPLATES[idx];
  showAppConfirm(
    `确定删除模板「${t.name}」吗？`,
    () => {
      MOCK_TEMPLATES.splice(idx, 1);
      selectedTemplateIds = selectedTemplateIds.filter((x) => x !== id);
      renderTemplateGrid();
      showAppToast('操作成功');
    },
    '删除模板',
    '确认删除'
  );
}

/**
 * 打开编辑器
 * @param {string} id
 */
function openEditor(id) {
  const tpl = MOCK_TEMPLATES.find((t) => t.id === id);
  const name = id === 'new' ? '新建模板' : (tpl ? tpl.name : id);
  const url = new URL('editor.html', window.location.href);
  url.searchParams.set('id', id);
  url.searchParams.set('name', name);
  window.open(url.toString(), 'editor', 'width=1200,height=800,scrollbars=yes');
}

/**
 * 打开应用编辑器
 * @param {string} id
 */
function openAppEditor(id) {
  const app = findAppById(id);
  if (!app) return;
  const url = new URL('editor.html', window.location.href);
  url.searchParams.set('type', 'app');
  url.searchParams.set('id', app.id);
  url.searchParams.set('name', app.name);
  window.open(url.toString(), 'editor', 'width=1200,height=800,scrollbars=yes');
}

/**
 * 发布应用
 * @param {string} id
 */
function publishApp(id) {
  const app = findAppById(id);
  if (!app || app.status !== 'draft') return;
  showAppConfirm(
    `确定发布应用「${app.name}」吗？`,
    () => {
      app.status = 'published';
      app.updatedAt = formatDateTime();
      renderAppGrid();
      showAppToast('操作成功');
    },
    '发布应用',
    '确认发布'
  );
}

/**
 * 取消发布应用
 * @param {string} id
 */
function unpublishApp(id) {
  const app = findAppById(id);
  if (!app || app.status !== 'published') return;
  showAppConfirm(
    '取消发布后应用将变为草稿，可继续搭建。是否继续？',
    () => {
      app.status = 'draft';
      app.pushTargets = [];
      app.updatedAt = formatDateTime();
      renderAppGrid();
      showAppToast('操作成功');
    },
    '取消发布',
    '确认'
  );
}

/**
 * 继续搭建应用
 * @param {string} id
 */
function editApp(id) {
  const app = findAppById(id);
  if (!app) return;
  if (app.status === 'published') {
    showAppDialog('已上线应用不可修改，请先取消发布后再继续搭建');
    return;
  }
  openAppEditor(id);
}

/**
 * 删除应用
 * @param {string} id
 */
function deleteApp(id) {
  const idx = MOCK_APPS.findIndex((a) => a.id === id);
  if (idx === -1) return;
  const app = MOCK_APPS[idx];
  if (app.status === 'published') return;
  showAppConfirm(
    `确定删除应用「${app.name}」？`,
    () => {
      MOCK_APPS.splice(idx, 1);
      renderAppGrid();
      showAppToast('操作成功');
    },
    '删除应用',
    '确认删除'
  );
}

/**
 * 获取选中的渠道商城
 * @returns {object|null}
 */
function getSelectedChannelMall() {
  const sel = document.getElementById('channelMallSelect');
  if (!sel) return null;
  return (MOCK_CHANNEL_MALLS || []).find((m) => m.id === sel.value) || null;
}

/**
 * 同步新建应用名称（渠道商城名 + 副本）
 */
function syncCreateAppNameFromMall() {
  const mall = getSelectedChannelMall();
  const input = document.getElementById('createAppName');
  if (mall && input) input.value = mall.name + '副本';
}

/**
 * 渲染搭建页面勾选列表
 */
function renderPageCheckList() {
  const list = document.getElementById('pageCheckList');
  if (!list) return;
  list.innerHTML = (MOCK_BUILD_PAGES || [])
    .map(
      (p) => `
    <label class="page-check-item">
      <input type="checkbox" class="page-check-item-input" value="${p.id}" ${p.defaultChecked ? 'checked' : ''}>
      <span>${escapeHtml(p.name)}</span>
    </label>`
    )
    .join('');
  list.querySelectorAll('.page-check-item-input').forEach((el) => {
    el.addEventListener('change', () => {
      updateCreateAppFormUI();
      if (isCreateAppPreviewActive()) updateCreateAppPreviewTabs();
    });
  });
}

/**
 * 获取已勾选的搭建页面 id
 * @returns {string[]}
 */
function getCheckedPageIds() {
  const mode = document.querySelector('input[name="copyPageMode"]:checked');
  if (mode && mode.value === 'all') return (MOCK_BUILD_PAGES || []).map((p) => p.id);
  return Array.from(document.querySelectorAll('#pageCheckList .page-check-item-input:checked')).map(
    (el) => el.value
  );
}

/**
 * 获取预览 Tab 可用的页面 id（基于 PREVIEW_PAGES）
 * @returns {string[]}
 */
function getActivePreviewPageIds() {
  const mode = document.querySelector('input[name="copyPageMode"]:checked');
  const previewIds = (PREVIEW_PAGES || []).map((p) => p.id);
  if (mode && mode.value === 'all') return previewIds;
  const checked = getCheckedPageIds();
  const ids = previewIds.filter((id) => checked.includes(id));
  if (checked.includes('home') && !ids.includes('product')) ids.push('product');
  return ids.length ? ids : previewIds;
}

/**
 * 渲染预览页占位内容
 * @param {string} pageId
 * @returns {string}
 */
function buildPreviewScreenHtml(pageId) {
  if (pageId === 'mine') {
    return `
      <div class="preview-page-mine">
        <div class="preview-mine-header"></div>
        <div class="preview-mine-row"></div>
        <div class="preview-mine-row"></div>
        <div class="preview-mine-row"></div>
        <div class="preview-ad-layer" id="previewAdLayer">
          <div class="preview-ad-popup">
            <span class="preview-ad-countdown">5s 后关闭</span>
            <button type="button" class="preview-ad-close" aria-label="关闭">×</button>
          </div>
        </div>
      </div>`;
  }
  if (pageId === 'category') {
    return Array(5)
      .fill('<div class="preview-block"></div>')
      .join('');
  }
  if (pageId === 'product') {
    return '<div class="preview-banner" style="height:160px;margin:10px"></div>' +
      Array(3)
        .fill('<div class="preview-block"></div>')
        .join('');
  }
  if (pageId === 'activity') {
    return (
      '<div class="preview-banner"></div><div class="preview-grid">' +
      Array(4)
        .fill('<div class="preview-block"></div>')
        .join('') +
      '</div>'
    );
  }
  return (
    '<div class="preview-banner"></div><div class="preview-grid">' +
    Array(6)
      .fill('<div class="preview-block"></div>')
      .join('') +
    '</div>'
  );
}

/**
 * 绑定预览广告关闭按钮
 * @param {HTMLElement} screen
 */
function bindPreviewAdClose(screen) {
  const closeBtn = screen.querySelector('.preview-ad-close');
  const layer = screen.querySelector('.preview-ad-layer');
  if (closeBtn && layer) {
    closeBtn.addEventListener('click', () => layer.remove());
  }
}

/**
 * 渲染新建应用预览屏幕
 * @param {string} pageId
 */
function renderCreateAppPreviewScreen(pageId) {
  const screen = document.getElementById('createAppPreviewScreen');
  if (!screen) return;
  createAppPreviewPageId = pageId;
  screen.innerHTML = buildPreviewScreenHtml(pageId);
  bindPreviewAdClose(screen);
}

/**
 * 渲染推送详情预览屏幕
 * @param {string} pageId
 */
function renderPushDetailPreviewScreen(pageId) {
  const screen = document.getElementById('pushDetailPreviewScreen');
  if (!screen) return;
  pushDetailPreviewPageId = pageId;
  screen.innerHTML = buildPreviewScreenHtml(pageId);
  bindPreviewAdClose(screen);
}

/**
 * 渲染预览页 Tab 按钮
 * @param {string} tabsId
 * @param {string} screenFn - 'create' | 'pushDetail'
 * @param {string[]} [pageIds]
 */
function renderPreviewPageTabs(tabsId, screenFn, pageIds) {
  const container = document.getElementById(tabsId);
  if (!container) return;
  const ids = pageIds || (PREVIEW_PAGES || []).map((p) => p.id);
  const pages = (PREVIEW_PAGES || []).filter((p) => ids.includes(p.id));
  if (!pages.length) {
    container.innerHTML = '<span class="field-hint">无可预览页面</span>';
    return;
  }
  const activeId =
    screenFn === 'create'
      ? createAppPreviewPageId
      : pushDetailPreviewPageId;
  if (!pages.some((p) => p.id === activeId)) {
    if (screenFn === 'create') createAppPreviewPageId = pages[0].id;
    else pushDetailPreviewPageId = pages[0].id;
  }
  const currentId = screenFn === 'create' ? createAppPreviewPageId : pushDetailPreviewPageId;
  container.innerHTML = pages
    .map(
      (p) =>
        `<button type="button" class="preview-page-tab ${p.id === currentId ? 'active' : ''}" data-page-id="${p.id}">${escapeHtml(p.name)}</button>`
    )
    .join('');
  container.querySelectorAll('.preview-page-tab').forEach((btn) => {
    btn.addEventListener('click', function () {
      const id = this.dataset.pageId;
      if (screenFn === 'create') {
        renderCreateAppPreviewScreen(id);
        updateCreateAppPreviewTabs();
      } else {
        renderPushDetailPreviewScreen(id);
        updatePushDetailPreviewTabs(getPushDetailPreviewPageIds());
      }
    });
  });
  if (screenFn === 'create') renderCreateAppPreviewScreen(currentId);
  else renderPushDetailPreviewScreen(currentId);
}

/**
 * 更新新建应用预览 Tab
 */
function updateCreateAppPreviewTabs() {
  renderPreviewPageTabs('createAppPreviewPageTabs', 'create', getActivePreviewPageIds());
}

/**
 * 获取推送详情可预览页面 id
 * @returns {string[]}
 */
function getPushDetailPreviewPageIds() {
  const app = findAppById(pushDetailAppId);
  if (!app) return (PREVIEW_PAGES || []).map((p) => p.id);
  const config = getAppPushConfig(app);
  const previewIds = (PREVIEW_PAGES || []).map((p) => p.id);
  if (config.pageMode === 'all') return previewIds;
  const checked = config.pageIds || [];
  const ids = previewIds.filter((id) => checked.includes(id));
  if (checked.includes('home') && !ids.includes('product')) ids.push('product');
  return ids.length ? ids : previewIds;
}

/**
 * 更新推送详情预览 Tab
 * @param {string[]} [pageIds]
 */
function updatePushDetailPreviewTabs(pageIds) {
  renderPreviewPageTabs('pushDetailPreviewPageTabs', 'pushDetail', pageIds || getPushDetailPreviewPageIds());
}

/**
 * 新建应用是否处于预览布局
 * @returns {boolean}
 */
function isCreateAppPreviewActive() {
  const body = document.querySelector('#createAppModal .create-app-body');
  return body && body.classList.contains('is-preview');
}

/**
 * 设置新建应用预览模式
 * @param {boolean} enabled
 */
function setCreateAppPreviewMode(enabled) {
  const box = document.getElementById('createAppModalBox');
  const body = document.querySelector('#createAppModal .create-app-body');
  if (box) box.classList.toggle('is-preview', enabled);
  if (body) body.classList.toggle('is-preview', enabled);
  if (enabled) updateCreateAppPreviewTabs();
}

/**
 * 切换新建应用预览
 */
function toggleAppPreview() {
  setCreateAppPreviewMode(!isCreateAppPreviewActive());
}

/**
 * 推送详情是否处于预览布局
 * @returns {boolean}
 */
function isPushDetailPreviewActive() {
  const body = document.querySelector('#pushDetailModal .create-app-body');
  return body && body.classList.contains('is-preview');
}

/**
 * 设置推送详情预览模式
 * @param {boolean} enabled
 */
function setPushDetailPreviewMode(enabled) {
  const box = document.getElementById('pushDetailModalBox');
  const body = document.querySelector('#pushDetailModal .create-app-body');
  if (box) box.classList.toggle('is-preview', enabled);
  if (body) body.classList.toggle('is-preview', enabled);
  if (enabled) updatePushDetailPreviewTabs();
}

/**
 * 切换推送详情预览
 */
function togglePushDetailPreview() {
  const ids = getPushDetailPreviewPageIds();
  if (!ids.length) {
    showAppDialog('无可预览页面');
    return;
  }
  setPushDetailPreviewMode(!isPushDetailPreviewActive());
}

/**
 * 渲染推送渠道列表（可点击选择）
 * @param {string} listId
 * @param {string} searchId
 * @param {Set<string>} selectedIds
 */
function renderPushMallList(listId, searchId, selectedIds) {
  const list = document.getElementById(listId);
  const search = document.getElementById(searchId);
  if (!list) return;
  const kw = search ? search.value.trim().toLowerCase() : '';
  const channels = (MOCK_PUSH_CHANNELS || []).filter(
    (c) => !kw || c.name.toLowerCase().includes(kw)
  );
  if (!channels.length) {
    list.innerHTML = '<div class="push-mall-empty" style="padding:12px;color:rgba(0,0,0,0.45)">无匹配渠道</div>';
    return;
  }
  list.innerHTML = channels
    .map(
      (c) => `
    <div class="push-mall-item${selectedIds.has(c.id) ? ' selected' : ''}" data-id="${c.id}">
      <span>${escapeHtml(c.name)}</span>
      <span class="push-mall-check">✓</span>
    </div>`
    )
    .join('');
  list.querySelectorAll('.push-mall-item').forEach((item) => {
    item.addEventListener('click', function () {
      this.classList.toggle('selected');
      if (listId === 'pushMallList') updateCreateAppFormUI();
      else updatePromotePushChannelHint();
    });
  });
}

/**
 * 从列表读取已选渠道 id
 * @param {string} listId
 * @returns {string[]}
 */
function getSelectedPushMallIds(listId) {
  return Array.from(document.querySelectorAll(`#${listId} .push-mall-item.selected`)).map(
    (el) => el.dataset.id
  );
}

/**
 * 更新新建应用表单 UI
 */
function updateCreateAppFormUI() {
  const mall = getSelectedChannelMall();
  const mallName = mall ? mall.name : '—';
  const pageCount = mall ? mall.pageCount : 0;

  const pagePanel = document.getElementById('pageCheckPanel');
  const copyPageMode = document.querySelector('input[name="copyPageMode"]:checked');
  if (pagePanel) pagePanel.classList.toggle('show', copyPageMode && copyPageMode.value === 'custom');

  const copyPageHint = document.getElementById('copyPageHint');
  if (copyPageHint) {
    if (copyPageMode && copyPageMode.value === 'custom') {
      const n = getCheckedPageIds().length;
      copyPageHint.textContent = n ? `已选择 ${n} 个页面` : '请至少选择一个页面';
    } else {
      copyPageHint.textContent = `将复制所选渠道商城的全部 ${pageCount} 个搭建页面`;
    }
  }

  const copyProducts = document.getElementById('copyAllProducts');
  const pricePanel = document.getElementById('priceSettingPanel');
  if (pricePanel) pricePanel.classList.toggle('show', !!(copyProducts && copyProducts.checked));

  const priceMode = document.querySelector('input[name="priceMode"]:checked');
  const coeffRow = document.getElementById('coeffRow');
  const isSupplier =
    copyProducts && copyProducts.checked && priceMode && priceMode.value === 'supplier';
  if (coeffRow) coeffRow.classList.toggle('show', isSupplier);

  const copyProductHint = document.getElementById('copyProductHint');
  const priceCoeff = document.getElementById('priceCoeff');
  if (copyProductHint) {
    if (!copyProducts || !copyProducts.checked) {
      copyProductHint.textContent = '不复制商品数据，仅复制搭建页面';
    } else if (isSupplier) {
      copyProductHint.textContent = `复制商品数据，新价格 = 供应商价格 × ${priceCoeff?.value || '1.2'}`;
    } else {
      copyProductHint.textContent = '将同步复制渠道商城的全部商品及库存数据';
    }
  }

  const pushPanel = document.getElementById('pushChannelPanel');
  const pushMode = document.querySelector('input[name="pushChannelMode"]:checked');
  if (pushPanel) pushPanel.classList.toggle('show', pushMode && pushMode.value === 'custom');

  const pushHint = document.getElementById('pushChannelHint');
  const allCount = (MOCK_PUSH_CHANNELS || []).length;
  const selectedCount = getSelectedPushMallIds('pushMallList').length;
  if (pushHint) {
    if (!pushMode) pushHint.textContent = '请选择全部渠道或指定渠道';
    else if (pushMode.value === 'all') pushHint.textContent = `将推送到全部渠道商城（共 ${allCount} 个）`;
    else if (!selectedCount) pushHint.textContent = '请至少选择一个渠道';
    else pushHint.textContent = `已选择 ${selectedCount} 个渠道`;
  }

  const pushBtn = document.getElementById('createAppPushBtn');
  if (pushBtn) {
    const canPush =
      pushMode && (pushMode.value === 'all' || (pushMode.value === 'custom' && selectedCount > 0));
    pushBtn.disabled = !canPush;
  }

  const pageCheckAll = document.getElementById('pageCheckAll');
  const pageChecks = document.querySelectorAll('#pageCheckList .page-check-item-input');
  if (pageCheckAll && pageChecks.length) {
    const checked = Array.from(pageChecks).filter((c) => c.checked).length;
    pageCheckAll.checked = checked === pageChecks.length;
    pageCheckAll.indeterminate = checked > 0 && checked < pageChecks.length;
  }

  if (isCreateAppPreviewActive()) updateCreateAppPreviewTabs();
}

/**
 * 复制页面模式切换
 */
function onCopyPageModeChange() {
  updateCreateAppFormUI();
}

/**
 * 全选/取消搭建页面
 * @param {boolean} checked
 */
function toggleAllPages(checked) {
  document.querySelectorAll('#pageCheckList .page-check-item-input').forEach((el) => {
    el.checked = checked;
  });
  updateCreateAppFormUI();
}

/**
 * 复制商品勾选变化
 */
function onCopyProductsChange() {
  updateCreateAppFormUI();
}

/**
 * 价格模式切换
 */
function onPriceModeChange() {
  updateCreateAppFormUI();
}

/**
 * 新建应用推送渠道模式切换
 */
function onCreatePushChannelModeChange() {
  updateCreateAppFormUI();
}

/**
 * 筛选新建应用推送渠道列表
 */
function filterPushMallList() {
  const selected = new Set(getSelectedPushMallIds('pushMallList'));
  renderPushMallList('pushMallList', 'pushMallSearch', selected);
  updateCreateAppFormUI();
}

/**
 * 打开新建应用弹窗
 */
function openCreateAppModal() {
  const modal = document.getElementById('createAppModal');
  const mallSelect = document.getElementById('channelMallSelect');
  if (!modal || !mallSelect) return;

  setCreateAppPreviewMode(false);
  createAppPreviewPageId = 'home';

  mallSelect.innerHTML = (MOCK_CHANNEL_MALLS || [])
    .map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`)
    .join('');
  mallSelect.onchange = syncCreateAppNameFromMall;
  mallSelect.selectedIndex = 0;
  syncCreateAppNameFromMall();

  const allPageRadio = document.querySelector('input[name="copyPageMode"][value="all"]');
  if (allPageRadio) allPageRadio.checked = true;
  renderPageCheckList();

  const copyProducts = document.getElementById('copyAllProducts');
  if (copyProducts) copyProducts.checked = true;
  const defaultPrice = document.querySelector('input[name="priceMode"][value="default"]');
  if (defaultPrice) defaultPrice.checked = true;
  const priceCoeff = document.getElementById('priceCoeff');
  if (priceCoeff) priceCoeff.value = '1.2';

  document.querySelectorAll('input[name="pushChannelMode"]').forEach((el) => {
    el.checked = el.value === 'custom';
  });
  const pushSearch = document.getElementById('pushMallSearch');
  if (pushSearch) pushSearch.value = '';
  renderPushMallList('pushMallList', 'pushMallSearch', new Set());

  updateCreateAppFormUI();
  showModal('createAppModal');
}

/**
 * 关闭新建应用弹窗
 */
function closeCreateAppModal() {
  setCreateAppPreviewMode(false);
  closeModal('createAppModal');
}

/**
 * 收集新建应用表单数据
 * @returns {object|null}
 */
function collectCreateAppForm() {
  const name = (document.getElementById('createAppName')?.value || '').trim();
  if (!name) {
    showAppToast('请填写应用名称');
    return null;
  }
  const mall = getSelectedChannelMall();
  const copyPageMode = document.querySelector('input[name="copyPageMode"]:checked');
  const copyProducts = document.getElementById('copyAllProducts');
  const priceMode = document.querySelector('input[name="priceMode"]:checked');
  const pushMode = document.querySelector('input[name="pushChannelMode"]:checked');
  const pushIds =
    pushMode && pushMode.value === 'all'
      ? (MOCK_PUSH_CHANNELS || []).map((c) => c.id)
      : getSelectedPushMallIds('pushMallList');
  if (!pushMode || (pushMode.value === 'custom' && !pushIds.length)) {
    showAppToast('请选择推送渠道');
    return null;
  }
  return {
    name,
    sourceChannel: mall ? mall.name : '',
    sourceMallId: mall ? mall.id : '',
    pushConfig: {
      pageMode: copyPageMode ? copyPageMode.value : 'all',
      pageIds: getCheckedPageIds(),
      copyProducts: !!(copyProducts && copyProducts.checked),
      priceMode: priceMode && priceMode.value === 'supplier' ? 'supplier' : 'default',
      priceCoeff: parseFloat(document.getElementById('priceCoeff')?.value || '1.2') || 1.2,
      pushChannelMode: pushMode.value,
      pushChannelIds: pushIds,
    },
  };
}

/**
 * 保存新建应用草稿
 */
function submitCreateAppDraft() {
  const data = collectCreateAppForm();
  if (!data) return;
  MOCK_APPS.unshift({
    id: 'a' + Date.now(),
    name: data.name,
    status: 'draft',
    sourceChannel: data.sourceChannel,
    sourceMallId: data.sourceMallId,
    updatedAt: formatDateTime(),
    pushConfig: data.pushConfig,
  });
  closeCreateAppModal();
  switchListTab('app');
  showAppToast('草稿已保存');
}

/**
 * 确认推送新建应用
 */
function submitCreateAppPush() {
  const data = collectCreateAppForm();
  if (!data) return;
  const channels =
    data.pushConfig.pushChannelMode === 'all'
      ? (MOCK_PUSH_CHANNELS || []).slice()
      : (MOCK_PUSH_CHANNELS || []).filter((c) => data.pushConfig.pushChannelIds.includes(c.id));
  const app = {
    id: 'a' + Date.now(),
    name: data.name,
    status: 'published',
    sourceChannel: data.sourceChannel,
    sourceMallId: data.sourceMallId,
    updatedAt: formatDateTime(),
    pushTargets: channels.map((c) => c.name),
    pushConfig: data.pushConfig,
  };
  MOCK_APPS.unshift(app);
  if (typeof MOCK_APP_PUSH_RECORDS !== 'undefined') {
    MOCK_APP_PUSH_RECORDS.unshift({
      id: String(Date.now()),
      appId: app.id,
      pushName: app.name,
      channelIds: channels.map((c) => c.id),
      channelNames: channels.map((c) => c.name),
      channelCount: channels.length,
      operator: 'admin',
      pushedAt: formatDateTime(),
    });
  }
  closeCreateAppModal();
  switchListTab('app');
  showAppToast('操作成功');
}

/**
 * 更新推送应用渠道提示
 */
function updatePromotePushChannelHint() {
  const hint = document.getElementById('promotePushChannelHint');
  const mode = document.querySelector('input[name="promotePushChannelMode"]:checked');
  const allCount = (MOCK_PUSH_CHANNELS || []).length;
  const selected = getSelectedPushMallIds('promotePushMallList').length;
  if (hint) {
    if (!mode) hint.textContent = '请选择全部渠道或指定渠道';
    else if (mode.value === 'all') hint.textContent = `将推送到全部渠道商城（共 ${allCount} 个）`;
    else if (!selected) hint.textContent = '请至少选择一个渠道';
    else hint.textContent = `已选择 ${selected} 个渠道`;
  }
  const btn = document.getElementById('promoteAppPushBtn');
  if (btn) {
    const ok = mode && (mode.value === 'all' || (mode.value === 'custom' && selected > 0));
    btn.disabled = !ok;
  }
}

/**
 * 推送应用渠道模式切换
 */
function onPromotePushChannelModeChange() {
  const panel = document.getElementById('promotePushChannelPanel');
  const mode = document.querySelector('input[name="promotePushChannelMode"]:checked');
  if (panel) panel.classList.toggle('show', mode && mode.value === 'custom');
  updatePromotePushChannelHint();
}

/**
 * 筛选推送应用渠道列表
 */
function filterPromotePushMallList() {
  const selected = new Set(getSelectedPushMallIds('promotePushMallList'));
  renderPushMallList('promotePushMallList', 'promotePushMallSearch', selected);
  updatePromotePushChannelHint();
}

/**
 * 打开推送应用弹窗
 * @param {string} id
 */
function openPromoteAppModal(id) {
  const app = findAppById(id);
  if (!app || app.status !== 'published') return;
  promotingAppId = id;
  const nameEl = document.getElementById('promoteAppName');
  if (nameEl) nameEl.textContent = app.name;

  const search = document.getElementById('promotePushMallSearch');
  if (search) search.value = '';
  document.querySelectorAll('input[name="promotePushChannelMode"]').forEach((el) => {
    el.checked = false;
  });
  const panel = document.getElementById('promotePushChannelPanel');
  if (panel) panel.classList.remove('show');

  const config = getAppPushConfig(app);
  if (config.pushChannelMode) {
    const radio = document.querySelector(
      `input[name="promotePushChannelMode"][value="${config.pushChannelMode}"]`
    );
    if (radio) radio.checked = true;
    if (panel) panel.classList.toggle('show', config.pushChannelMode === 'custom');
    const pre = config.pushChannelMode === 'custom' ? new Set(config.pushChannelIds || []) : new Set();
    renderPushMallList('promotePushMallList', 'promotePushMallSearch', pre);
  } else {
    renderPushMallList('promotePushMallList', 'promotePushMallSearch', new Set());
  }
  updatePromotePushChannelHint();
  showModal('promoteAppModal');
}

/**
 * 关闭推送应用弹窗
 */
function closePromoteAppModal() {
  promotingAppId = null;
  closeModal('promoteAppModal');
}

/**
 * 提交推送应用
 */
function submitPromoteApp() {
  const app = findAppById(promotingAppId);
  if (!app) return;
  const mode = document.querySelector('input[name="promotePushChannelMode"]:checked');
  if (!mode) return;
  const channels =
    mode.value === 'all'
      ? (MOCK_PUSH_CHANNELS || []).slice()
      : (MOCK_PUSH_CHANNELS || []).filter((c) =>
          getSelectedPushMallIds('promotePushMallList').includes(c.id)
        );
  if (mode.value === 'custom' && !channels.length) return;

  const existing = getAppPushConfig(app);
  app.pushConfig = {
    ...existing,
    pushChannelMode: mode.value,
    pushChannelIds: channels.map((c) => c.id),
  };
  if (typeof MOCK_APP_PUSH_RECORDS !== 'undefined') {
    MOCK_APP_PUSH_RECORDS.unshift({
      id: String(Date.now()),
      appId: app.id,
      pushName: app.name,
      channelIds: channels.map((c) => c.id),
      channelNames: channels.map((c) => c.name),
      channelCount: channels.length,
      operator: 'admin',
      pushedAt: formatDateTime(),
    });
  }
  const names = new Set([...(app.pushTargets || []), ...channels.map((c) => c.name)]);
  app.pushTargets = Array.from(names);
  app.updatedAt = formatDateTime();
  closePromoteAppModal();
  renderAppGrid();
  showAppToast('操作成功');
}

/**
 * 渲染推送详情页面勾选（只读）
 * @param {string[]} selectedIds
 */
function renderPushDetailPageCheckList(selectedIds) {
  const list = document.getElementById('pushDetailPageCheckList');
  if (!list) return;
  const selected = new Set(selectedIds || []);
  list.innerHTML = (MOCK_BUILD_PAGES || [])
    .map(
      (p) => `
    <label class="page-check-item">
      <input type="checkbox" disabled ${selected.has(p.id) ? 'checked' : ''}>
      <span>${escapeHtml(p.name)}</span>
    </label>`
    )
    .join('');
}

/**
 * 渲染品牌端推送详情简要信息
 * @param {object} app
 * @param {object} config
 */
function fillBrandPushDetailSummary(app, config) {
  const pageList = document.getElementById('pushDetailPageList');
  if (pageList) {
    const names =
      config.pageMode === 'all'
        ? (MOCK_BUILD_PAGES || []).map((p) => p.name)
        : (config.pageIds || [])
            .map((id) => (MOCK_BUILD_PAGES || []).find((p) => p.id === id)?.name)
            .filter(Boolean);
    pageList.innerHTML = names.length
      ? names.map((n) => `<div class="detail-page-item">${escapeHtml(n)}</div>`).join('')
      : '<div class="field-hint">无</div>';
  }
  const productDisplay = document.getElementById('pushDetailProductDisplay');
  if (productDisplay) {
    if (!config.copyProducts) {
      productDisplay.innerHTML = '<div class="detail-info-item">不复制商品数据</div>';
    } else if (config.priceMode === 'supplier') {
      productDisplay.innerHTML = `<div class="detail-info-item">复制商品，供应商价格 × ${config.priceCoeff || 1.2}</div>`;
    } else {
      productDisplay.innerHTML = '<div class="detail-info-item">复制商品，沿用渠道商城价格</div>';
    }
  }
}

/**
 * 渲染推送详情只读渠道列表
 * @param {string[]} channelIds
 */
function renderPushDetailMallListReadonly(channelIds) {
  const list = document.getElementById('pushDetailMallList');
  if (!list) return;
  const ids = new Set(channelIds || []);
  const channels = (MOCK_PUSH_CHANNELS || []).filter((c) => ids.has(c.id));
  if (!channels.length) {
    list.innerHTML = '<div class="push-mall-empty" style="padding:12px">暂无推送渠道</div>';
    return;
  }
  list.innerHTML = channels
    .map(
      (c) => `
    <div class="push-mall-item selected" data-id="${c.id}">
      <span>${escapeHtml(c.name)}</span>
      <span class="push-mall-check">✓</span>
    </div>`
    )
    .join('');
}

/**
 * 填充推送详情表单
 * @param {object} app
 * @param {object} config
 */
function fillPushDetailForm(app, config) {
  const nameInput = document.getElementById('pushDetailAppNameInput');
  if (nameInput) nameInput.value = app.name;

  if (document.getElementById('pushDetailPageList')) {
    fillBrandPushDetailSummary(app, config);
    return;
  }

  const mallSelect = document.getElementById('pushDetailChannelMallSelect');
  if (mallSelect) {
    mallSelect.innerHTML = (MOCK_CHANNEL_MALLS || [])
      .map(
        (m) =>
          `<option value="${m.id}"${m.id === app.sourceMallId || m.name === app.sourceChannel ? ' selected' : ''}>${escapeHtml(m.name)}</option>`
      )
      .join('');
  }

  const pageMode = config.pageMode || 'all';
  document.querySelectorAll('input[name="pushDetailPageMode"]').forEach((el) => {
    el.checked = el.value === pageMode;
  });
  const pagePanel = document.getElementById('pushDetailPageCheckPanel');
  if (pagePanel) pagePanel.classList.toggle('show', pageMode === 'custom');
  renderPushDetailPageCheckList(config.pageIds);

  const copyProducts = document.getElementById('pushDetailCopyProducts');
  if (copyProducts) copyProducts.checked = !!config.copyProducts;
  const pricePanel = document.getElementById('pushDetailPricePanel');
  if (pricePanel) pricePanel.classList.toggle('show', !!config.copyProducts);
  document.querySelectorAll('input[name="pushDetailPriceMode"]').forEach((el) => {
    el.checked =
      el.value === (config.priceMode === 'supplier' ? 'supplier' : 'default');
  });
  const coeffRow = document.getElementById('pushDetailCoeffRow');
  if (coeffRow) coeffRow.classList.toggle('show', config.priceMode === 'supplier');
  const coeffInput = document.getElementById('pushDetailPriceCoeff');
  if (coeffInput) coeffInput.value = String(config.priceCoeff || 1.2);

  const channelMode = config.pushChannelMode || 'custom';
  document.querySelectorAll('input[name="pushDetailChannelMode"]').forEach((el) => {
    el.checked = el.value === channelMode;
  });
  const channelPanel = document.getElementById('pushDetailChannelPanel');
  if (channelPanel) channelPanel.classList.toggle('show', channelMode === 'custom');
  renderPushDetailMallListReadonly(
    channelMode === 'custom' ? config.pushChannelIds || [] : (MOCK_PUSH_CHANNELS || []).map((c) => c.id)
  );

  const pageHint = document.getElementById('pushDetailCopyPageHint');
  if (pageHint) {
    pageHint.textContent =
      pageMode === 'all'
        ? '将复制所选渠道商城的全部搭建页面'
        : `已选择 ${(config.pageIds || []).length} 个页面`;
  }
  const productHint = document.getElementById('pushDetailCopyProductHint');
  if (productHint) {
    if (!config.copyProducts) productHint.textContent = '不复制商品数据，仅复制搭建页面';
    else if (config.priceMode === 'supplier')
      productHint.textContent = `复制商品数据，新价格 = 供应商价格 × ${config.priceCoeff || 1.2}`;
    else productHint.textContent = '复制商品数据，价格沿用渠道商城的商品价格';
  }
  const channelHint = document.getElementById('pushDetailChannelHint');
  if (channelHint) {
    const allCount = (MOCK_PUSH_CHANNELS || []).length;
    if (channelMode === 'all') channelHint.textContent = `全部渠道（共 ${allCount} 个）`;
    else {
      const names = (config.pushChannelIds || [])
        .map((id) => (MOCK_PUSH_CHANNELS || []).find((c) => c.id === id)?.name)
        .filter(Boolean);
      channelHint.textContent = names.length ? `已推送渠道：${names.join('、')}` : '未配置推送渠道';
    }
  }
}

/**
 * 打开推送详情弹窗
 * @param {string} id
 */
function openPushDetailModal(id) {
  const app = findAppById(id);
  if (!app || app.status !== 'published') return;
  pushDetailAppId = id;
  pushDetailPreviewPageId = 'home';
  setPushDetailPreviewMode(false);
  fillPushDetailForm(app, getAppPushConfig(app));
  showModal('pushDetailModal');
}

/**
 * 关闭推送详情弹窗
 */
function closePushDetailModal() {
  pushDetailAppId = null;
  setPushDetailPreviewMode(false);
  closeModal('pushDetailModal');
}

/**
 * 打开使用应用弹窗（品牌端）
 * @param {string} id
 */
function openUseAppModal(id) {
  const app = findAppById(id);
  if (!app) return;
  useAppId = id;
  const nameEl = document.getElementById('useAppName');
  if (nameEl) nameEl.textContent = app.name;
  showModal('useAppModal');
}

/**
 * 关闭使用应用弹窗
 */
function closeUseAppModal() {
  useAppId = null;
  closeModal('useAppModal');
}

/**
 * 确认使用应用
 */
function submitUseApp() {
  const app = findAppById(useAppId);
  if (!app) return;
  const mode = document.querySelector('input[name="useAppDataMode"]:checked');
  const modeText = mode && mode.value === 'merge' ? '合并' : '覆盖';
  closeUseAppModal();
  showAppToast(`已${modeText}应用「${app.name}」数据`);
}

/**
 * 关闭新建选择弹窗（品牌端）
 */
function closeCreateModal() {
  closeModal('createModal');
}

/**
 * 品牌端：选择新建模板
 */
function createTemplate() {
  closeCreateModal();
  if (typeof openCreateTemplateModal === 'function') openCreateTemplateModal();
}

/**
 * 品牌端：选择新建应用
 */
function createApp() {
  closeCreateModal();
  openCreateAppModal();
}

/**
 * 填充状态筛选下拉
 */
function populateStatusFilter() {
  const sel = document.getElementById('statusFilter');
  if (!sel) return;
  sel.innerHTML = `
    <option value="">全部状态</option>
    <option value="draft">草稿</option>
    <option value="published">已发布</option>`;
}

/**
 * 填充标签筛选
 */
function populateTagFilter() {
  const sel = document.getElementById('tagFilter');
  if (!sel) return;
  const tags = new Set();
  (MOCK_TEMPLATES || []).forEach((t) => (t.tags || []).forEach((tag) => tags.add(tag)));
  const options = ['<option value="">全部标签</option>'];
  tags.forEach((tag) => {
    options.push(`<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`);
  });
  sel.innerHTML = options.join('');
}

/**
 * 填充应用来源渠道筛选
 */
function populateAppSourceFilter() {
  const sel = document.getElementById('appSourceFilter');
  if (!sel) return;
  const channels = new Set((MOCK_APPS || []).map((a) => a.sourceChannel).filter(Boolean));
  const options = ['<option value="">全部渠道</option>'];
  channels.forEach((ch) => {
    options.push(`<option value="${escapeHtml(ch)}">${escapeHtml(ch)}</option>`);
  });
  sel.innerHTML = options.join('');
}

/**
 * 绑定筛选与初始化事件
 */
function bindFilters() {
  const keyword = document.getElementById('keywordFilter');
  if (keyword) {
    keyword.addEventListener('input', () => {
      templatePage = 1;
      appPage = 1;
      if (currentListTab === 'template') renderTemplateGrid();
      else renderAppGrid();
    });
  }
  const status = document.getElementById('statusFilter');
  if (status) {
    status.addEventListener('change', () => {
      templatePage = 1;
      appPage = 1;
      if (currentListTab === 'template') renderTemplateGrid();
      else renderAppGrid();
    });
  }
  const tag = document.getElementById('tagFilter');
  if (tag) tag.addEventListener('change', () => {
    templatePage = 1;
    renderTemplateGrid();
  });
  const appSource = document.getElementById('appSourceFilter');
  if (appSource) appSource.addEventListener('change', () => {
    appPage = 1;
    renderAppGrid();
  });
  const appSearchBtn = document.getElementById('appSearchBtn');
  if (appSearchBtn) appSearchBtn.addEventListener('click', () => {
    appPage = 1;
    renderAppGrid();
  });
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      document.querySelectorAll('#templateGrid .tpl-row-check').forEach((cb) => {
        cb.checked = this.checked;
      });
      onTemplateRowCheckChange();
    });
  }
  const batchTagBtn = document.getElementById('batchTagBtn');
  if (batchTagBtn) {
    batchTagBtn.addEventListener('click', () => {
      if (!selectedTemplateIds.length) {
        showAppToast('请先选择模板');
        return;
      }
      showAppToast(`演示：批量设置 ${selectedTemplateIds.length} 个模板的标签`);
    });
  }
  const priceCoeff = document.getElementById('priceCoeff');
  if (priceCoeff) priceCoeff.addEventListener('input', updateCreateAppFormUI);
}

/**
 * 页面初始化
 */
function init() {
  populateStatusFilter();
  populateTagFilter();
  populateAppSourceFilter();
  bindFilters();
  switchListTab('template');
}

document.addEventListener('DOMContentLoaded', init);

/** 暴露给 HTML onclick */
window.switchMainPage = switchMainPage;
window.switchListTab = switchListTab;
window.openCreateAppModal = openCreateAppModal;
window.closeCreateAppModal = closeCreateAppModal;
window.onCopyPageModeChange = onCopyPageModeChange;
window.toggleAllPages = toggleAllPages;
window.onCopyProductsChange = onCopyProductsChange;
window.onPriceModeChange = onPriceModeChange;
window.onCreatePushChannelModeChange = onCreatePushChannelModeChange;
window.filterPushMallList = filterPushMallList;
window.toggleAppPreview = toggleAppPreview;
window.submitCreateAppDraft = submitCreateAppDraft;
window.submitCreateAppPush = submitCreateAppPush;
window.syncCreateAppNameFromMall = syncCreateAppNameFromMall;
window.renderCreateAppPreviewScreen = renderCreateAppPreviewScreen;
window.closePromoteAppModal = closePromoteAppModal;
window.onPromotePushChannelModeChange = onPromotePushChannelModeChange;
window.filterPromotePushMallList = filterPromotePushMallList;
window.submitPromoteApp = submitPromoteApp;
window.closePushDetailModal = closePushDetailModal;
window.togglePushDetailPreview = togglePushDetailPreview;
window.renderPushDetailPreviewScreen = renderPushDetailPreviewScreen;
window.closeAppDialog = closeAppDialog;
window.onAppDialogOk = onAppDialogOk;
window.onAppDialogCancel = onAppDialogCancel;
window.showAppToast = showAppToast;
window.closeCreateModal = closeCreateModal;
window.createTemplate = createTemplate;
window.createApp = createApp;
window.closeUseAppModal = closeUseAppModal;
window.submitUseApp = submitUseApp;
