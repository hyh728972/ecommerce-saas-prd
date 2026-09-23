/**
 * 商城搭建系统 - 原型演示逻辑
 * 负责页面切换、列表渲染、弹窗与模拟操作
 */

(function () {
  /** 当前选中的模板 ID 列表（用于批量操作） */
  let selectedTemplateIds = [];

  /** 当前要发布/推送的模板 ID（用于弹窗流程） */
  let currentFlowTemplateId = null;

  /** 模板列表当前页码与每页数量（前端分页） */
  let currentTemplatePage = 1;
  const TEMPLATE_PAGE_SIZE = 15;

  /** PC 模板列表当前页码 */
  let currentPcTemplatePage = 1;

  /** 当前中心：templates | apps */
  let currentCenter = 'templates';

  /** 模板中心终端 Tab：'' 全部 | mp | pc */
  let currentTemplateTerminal = '';

  /** 当前列表页：templates | apps | multi-apps */
  let currentMainTab = 'templates';

  /** 当前推送的应用 ID */
  let promotingAppId = null;

  /** 当前查看详情的应用 ID */
  let pushDetailAppId = null;

  /** 推送详情是否处于预览模式 */
  let pushDetailPreviewMode = false;

  /** 推送详情当前预览页面 id */
  let pushDetailPreviewPageId = 'home';

  /** 应用内弹窗确定回调 */
  let appDialogOkCallback = null;

  /** 当前筛选后的模板列表（分页基准） */
  let filteredTemplates = [];

  /** 当前筛选后的 PC 模板列表 */
  let filteredPcTemplates = [];

  /** 当前选中的 PC 模板 ID 列表 */
  let selectedPcTemplateIds = [];

  /** 当前正在查看页面管理的模板 */
  let currentTemplateForPages = null;
  /** 当前页面管理选中的页面类型 */
  let currentTemplatePageType = 'home';

  /**
   * 根据状态码返回显示文案
   * @param {string} status - draft | published | pushed
   * @returns {string}
   */
  function getStatusText(status) {
    const map = { draft: '草稿', published: '已发布', pushed: '已发布' };
    return map[status] || status;
  }

  /**
   * 返回模板封面的渐变样式类
   * @param {string} status - 模板状态
   * @returns {string}
   */
  function getTemplateCoverClass(status) {
    const map = {
      draft: 'cover-draft',
      published: 'cover-published',
      pushed: 'cover-published',
    };
    return map[status] || 'cover-draft';
  }

  /**
   * 返回模板在列表中使用的统一状态值
   * @param {string} status - 原始状态
   * @returns {string}
   */
  function getTemplateDisplayStatus(status) {
    return status === 'pushed' ? 'published' : status;
  }

  /**
   * 生成应用卡片预览图用的 mock 模板对象
   * @param {{name: string, sourceChannel?: string, previewTags?: string[]}} app - 应用数据
   * @returns {{name: string, tags: string[]}}
   */
  function getAppPreviewModel(app) {
    if (app.previewTags && app.previewTags.length) {
      return { name: app.name, tags: app.previewTags };
    }
    const channel = app.sourceChannel || '';
    const name = app.name || '';
    let tags = ['美妆'];
    if (channel.includes('522') || name.includes('522')) tags = ['服饰'];
    else if (channel.includes('测试')) tags = ['食品'];
    else if (name.includes('银行') || name.includes('大促')) tags = ['618大促'];
    return { name: app.name, tags };
  }

  /**
   * 返回应用卡片封面样式类（与模板列表一致）
   * @param {string} status - published | draft
   * @returns {string}
   */
  function getAppCoverClass(status) {
    return status === 'draft' ? 'cover-draft' : 'cover-published';
  }

  /**
   * 更新模板列表勾选摘要
   */
  function updateTemplateSelectionSummary() {
    const summary = document.getElementById('template-selection-summary');
    if (summary) {
      summary.textContent = '已选择 ' + selectedTemplateIds.length + ' 个模板';
    }
  }

  /**
   * 更新 PC 模板列表勾选摘要
   */
  function updatePcTemplateSelectionSummary() {
    const summary = document.getElementById('pc-template-selection-summary');
    if (summary) {
      summary.textContent = '已选择 ' + selectedPcTemplateIds.length + ' 个模板';
    }
  }

  /**
   * 当前是否在按 PC 终端操作（模板 Tab 或新建弹窗）
   * @returns {boolean}
   */
  function isPcTemplatesTab() {
    if (currentTemplateTerminal === 'pc') return true;
    const radio = document.querySelector('input[name="new-template-terminal"]:checked');
    return !!(radio && radio.value === 'pc');
  }

  /**
   * 模板数据源（已合并小程序/H5 与 PC）
   * @returns {Array}
   */
  function getActiveTemplateSource() {
    return MOCK_TEMPLATES;
  }

  /**
   * 当前已选模板 ID
   * @returns {string[]}
   */
  function getActiveSelectedTemplateIds() {
    return selectedTemplateIds;
  }

  /**
   * 按 id 查找模板
   * @param {string} id
   * @returns {Object|undefined}
   */
  function findTemplateById(id) {
    return MOCK_TEMPLATES.find((t) => t.id === id);
  }

  /**
   * PC 端封面预览图（统一使用电商工作台封面）
   * @param {Object} [_template] - 模板/应用数据（预留，便于后续按标签分图）
   * @returns {string}
   */
  function getPcTemplatePreviewSrc(_template) {
    return 'assets/pc-preview-cover.png';
  }

  /**
   * 小程序手机端预览图（统一使用电商营销封面）
   * @param {Object} [_template] - 模板/应用数据（预留，便于后续按标签分图）
   * @returns {string}
   */
  function getTemplatePreviewSrc(_template) {
    return 'assets/mp-preview-cover.png';
  }

  /**
   * 渲染模板列表卡片（接收当前页数据）
   * @param {Array} list - 当前页模板列表
   */
  function renderTemplateList(list) {
    const container = document.getElementById('template-tbody');
    if (!container) return;
    if (!list.length) {
      selectedTemplateIds = [];
      container.innerHTML = '<div class="template-empty">暂无符合条件的模板</div>';
      const checkAll = document.getElementById('check-all');
      if (checkAll) {
        checkAll.checked = false;
        checkAll.indeterminate = false;
      }
      updateTemplateSelectionSummary();
      return;
    }
    container.innerHTML = list.map((t) => {
      const displayStatus = getTemplateDisplayStatus(t.status);
      const isPc = t.terminal === 'pc';
      const actionsHtml =
        t.status === 'draft'
          ? `<button type="button" class="btn btn-sm btn-ghost btn-edit" data-id="${t.id}">编辑</button>
            <button type="button" class="btn btn-sm btn-ghost btn-publish" data-id="${t.id}">发布</button>
            <button type="button" class="btn btn-sm btn-danger btn-delete" data-id="${t.id}">删除</button>`
          : `<button type="button" class="btn btn-sm btn-ghost btn-unpublish" data-id="${t.id}">取消发布</button>`;
      const coverSrc = isPc ? getPcTemplatePreviewSrc(t) : getTemplatePreviewSrc(t);
      const coverHtml = `<div class="template-card-cover">
          <img class="template-card-cover-image" src="${coverSrc}" alt="${escapeHtml(t.name)} 预览图" />
          <label class="template-card-check">
            <input type="checkbox" class="row-check" value="${t.id}" ${selectedTemplateIds.includes(t.id) ? 'checked' : ''} />
          </label>
          <span class="template-card-status status-tag status-${displayStatus}">${getStatusText(t.status)}</span>
          ${getTerminalBadgeHtml(isPc ? 'pc' : 'mp')}
          <div class="template-card-preview-mask">
            <button type="button" class="template-preview-btn btn-preview" data-id="${t.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>预览</span>
            </button>
          </div>
        </div>`;
      return `
      <article class="template-card ${isPc ? 'template-card--pc' : 'template-card--mp'}" data-id="${t.id}">
        ${coverHtml}
        <div class="template-card-body">
          <div class="template-card-header">
            <h3 class="template-card-title">${escapeHtml(t.name)}</h3>
            <span class="template-card-used">使用 ${t.useCount ?? 0} 次</span>
          </div>
          <div class="tags template-card-tags">${(t.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('') || '<span>未设置标签</span>'}</div>
          <div class="template-card-meta">
            <span>最近修改：${escapeHtml(t.updatedAt)}</span>
          </div>
          <div class="template-card-actions">
            ${actionsHtml}
          </div>
        </div>
      </article>
    `;
    }).join('');

    // 行内操作绑定
    container.querySelectorAll('.row-check').forEach((el) => {
      el.addEventListener('change', onRowCheckChange);
    });
    container.querySelectorAll('.btn-preview').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const tpl = findTemplateById(id);
        alert('演示：预览模板「' + (tpl ? tpl.name : id) + '」，实际可在新窗口打开预览 URL。');
      });
    });
    container.querySelectorAll('.btn-edit').forEach((el) => {
      el.addEventListener('click', () => openEditor(el.dataset.id));
    });
    container.querySelectorAll('.btn-publish').forEach((el) => {
      el.addEventListener('click', () => openPublishPreview(el.dataset.id));
    });
    container.querySelectorAll('.btn-unpublish').forEach((el) => {
      el.addEventListener('click', () => onUnpublishTemplate(el.dataset.id));
    });
    container.querySelectorAll('.btn-delete').forEach((el) => {
      el.addEventListener('click', () => onDeleteTemplate(el.dataset.id));
    });
    updateTemplateSelectionSummary();
    onRowCheckChange();
  }

  /**
   * 渲染模板列表分页区域
   * @param {number} total - 当前筛选条件下的模板总数
   */
  function renderTemplatePagination(total) {
    const container = document.getElementById('template-pagination');
    if (!container) return;

    if (total === 0) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(total / TEMPLATE_PAGE_SIZE);
    if (currentTemplatePage > totalPages) {
      currentTemplatePage = totalPages;
    }

    let html = '';
    html += `<span class="pagination-total">共 ${total} 条</span>`;
    html += `<button type="button" class="btn btn-sm btn-ghost" data-page="${currentTemplatePage - 1}" ${currentTemplatePage === 1 ? 'disabled' : ''}>上一页</button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button type="button" class="btn btn-sm ${i === currentTemplatePage ? 'btn-primary' : 'btn-ghost'}" data-page="${i}">${i}</button>`;
    }

    html += `<button type="button" class="btn btn-sm btn-ghost" data-page="${currentTemplatePage + 1}" ${currentTemplatePage === totalPages ? 'disabled' : ''}>下一页</button>`;

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const target = Number(this.getAttribute('data-page'));
        if (!Number.isFinite(target)) return;
        if (target < 1 || target > totalPages || target === currentTemplatePage) return;
        currentTemplatePage = target;
        renderTemplatePage();
      });
    });
  }

  /**
   * 根据当前页码渲染模板列表与分页
   */
  function renderTemplatePage() {
    const total = filteredTemplates.length;
    const start = (currentTemplatePage - 1) * TEMPLATE_PAGE_SIZE;
    const pageList = filteredTemplates.slice(start, start + TEMPLATE_PAGE_SIZE);
    renderTemplateList(pageList);
    renderTemplatePagination(total);
  }

  /**
   * 渲染 PC 模板列表卡片
   * @param {Array} list - 当前页 PC 模板列表
   */
  function renderPcTemplateList(list) {
    const container = document.getElementById('pc-template-tbody');
    if (!container) return;
    if (!list.length) {
      selectedPcTemplateIds = [];
      container.innerHTML = '<div class="template-empty">暂无符合条件的 PC 模板</div>';
      const checkAll = document.getElementById('check-all-pc');
      if (checkAll) {
        checkAll.checked = false;
        checkAll.indeterminate = false;
      }
      updatePcTemplateSelectionSummary();
      return;
    }
    container.innerHTML = list
      .map((t) => {
        const displayStatus = getTemplateDisplayStatus(t.status);
        return `
      <article class="template-card template-card--pc" data-id="${t.id}">
        <div class="template-card-cover">
          <img class="template-card-cover-image" src="${getPcTemplatePreviewSrc(t)}" alt="${escapeHtml(t.name)} 预览图" />
          <label class="template-card-check">
            <input type="checkbox" class="row-check-pc" value="${t.id}" ${selectedPcTemplateIds.includes(t.id) ? 'checked' : ''} />
          </label>
          <span class="template-card-status status-tag status-${displayStatus}">${getStatusText(t.status)}</span>
          <div class="template-card-preview-mask">
            <button type="button" class="template-preview-btn btn-pc-preview" data-id="${t.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>预览</span>
            </button>
          </div>
        </div>
        <div class="template-card-body">
          <div class="template-card-header">
            <h3 class="template-card-title">${escapeHtml(t.name)}</h3>
          </div>
          <div class="tags template-card-tags">${(t.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('') || '<span>未设置标签</span>'}</div>
          <div class="template-card-meta">
            <span>最近修改：${escapeHtml(t.updatedAt)}</span>
          </div>
          <div class="template-card-actions">
            ${
              t.status === 'draft'
                ? `<button type="button" class="btn btn-sm btn-ghost btn-pc-edit" data-id="${t.id}">编辑</button>
            <button type="button" class="btn btn-sm btn-ghost btn-pc-publish" data-id="${t.id}">发布</button>
            <button type="button" class="btn btn-sm btn-danger btn-pc-delete" data-id="${t.id}">删除</button>`
                : `<button type="button" class="btn btn-sm btn-ghost btn-pc-unpublish" data-id="${t.id}">取消发布</button>`
            }
          </div>
        </div>
      </article>
    `;
      })
      .join('');

    container.querySelectorAll('.row-check-pc').forEach((el) => {
      el.addEventListener('change', onPcRowCheckChange);
    });
    container.querySelectorAll('.btn-pc-preview').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const tpl = findTemplateById(id);
        alert('演示：预览 PC 模板「' + (tpl ? tpl.name : id) + '」，实际可在新窗口打开预览 URL。');
      });
    });
    container.querySelectorAll('.btn-pc-edit').forEach((el) => {
      el.addEventListener('click', () => openEditor(el.dataset.id));
    });
    container.querySelectorAll('.btn-pc-publish').forEach((el) => {
      el.addEventListener('click', () => openPublishPreview(el.dataset.id));
    });
    container.querySelectorAll('.btn-pc-unpublish').forEach((el) => {
      el.addEventListener('click', () => onUnpublishPcTemplate(el.dataset.id));
    });
    container.querySelectorAll('.btn-pc-delete').forEach((el) => {
      el.addEventListener('click', () => onDeletePcTemplate(el.dataset.id));
    });
    updatePcTemplateSelectionSummary();
    onPcRowCheckChange();
  }

  /**
   * 渲染 PC 模板列表分页
   * @param {number} total - 当前筛选条件下的总数
   */
  function renderPcTemplatePagination(total) {
    const container = document.getElementById('pc-template-pagination');
    if (!container) return;

    if (total === 0) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(total / TEMPLATE_PAGE_SIZE);
    if (currentPcTemplatePage > totalPages) {
      currentPcTemplatePage = totalPages;
    }

    let html = '';
    html += `<span class="pagination-total">共 ${total} 条</span>`;
    html += `<button type="button" class="btn btn-sm btn-ghost" data-page="${currentPcTemplatePage - 1}" ${currentPcTemplatePage === 1 ? 'disabled' : ''}>上一页</button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button type="button" class="btn btn-sm ${i === currentPcTemplatePage ? 'btn-primary' : 'btn-ghost'}" data-page="${i}">${i}</button>`;
    }

    html += `<button type="button" class="btn btn-sm btn-ghost" data-page="${currentPcTemplatePage + 1}" ${currentPcTemplatePage === totalPages ? 'disabled' : ''}>下一页</button>`;

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const target = Number(this.getAttribute('data-page'));
        if (!Number.isFinite(target)) return;
        if (target < 1 || target > totalPages || target === currentPcTemplatePage) return;
        currentPcTemplatePage = target;
        renderPcTemplatePage();
      });
    });
  }

  /**
   * 根据当前页码渲染 PC 模板列表与分页
   */
  function renderPcTemplatePage() {
    const total = filteredPcTemplates.length;
    const start = (currentPcTemplatePage - 1) * TEMPLATE_PAGE_SIZE;
    const pageList = filteredPcTemplates.slice(start, start + TEMPLATE_PAGE_SIZE);
    renderPcTemplateList(pageList);
    renderPcTemplatePagination(total);
  }

  /**
   * 切换顶部筛选区（随当前中心显示模板/应用筛选项）
   * @param {string} center - templates | apps
   */
  function updateMainFilters(center) {
    const templateFilters = document.getElementById('main-filters-templates');
    const appFilters = document.getElementById('main-filters-apps');
    if (templateFilters) templateFilters.classList.toggle('hidden', center !== 'templates');
    if (appFilters) appFilters.classList.toggle('hidden', center !== 'apps');
  }

  /**
   * 更新页面标题与新建按钮
   * @param {string} center - templates | apps
   */
  function updateMainPageHeader(center) {
    const title = document.getElementById('main-page-title');
    const btnNewTemplate = document.getElementById('btn-new-template');
    const btnNewApp = document.getElementById('btn-new-app');
    if (title) title.textContent = center === 'apps' ? '应用中心' : '模板中心';
    if (btnNewTemplate) btnNewTemplate.classList.toggle('hidden', center !== 'templates');
    if (btnNewApp) btnNewApp.classList.toggle('hidden', center !== 'apps');
  }

  /**
   * 同步中心 Tab 显隐与选中态
   * @param {string} center - templates | apps
   * @param {string} page - templates | apps | multi-apps
   */
  function updateCenterTabs(center, page) {
    const tabsTemplates = document.getElementById('main-tabs-templates');
    const tabsApps = document.getElementById('main-tabs-apps');
    if (tabsTemplates) {
      const show = center === 'templates';
      tabsTemplates.classList.toggle('hidden', !show);
      tabsTemplates.style.display = show ? '' : 'none';
      tabsTemplates.querySelectorAll('.main-tab[data-terminal]').forEach((tab) => {
        const val = tab.getAttribute('data-terminal') || '';
        tab.classList.toggle('active', val === currentTemplateTerminal);
      });
    }
    if (tabsApps) {
      tabsApps.classList.toggle('hidden', center !== 'apps');
      tabsApps.style.display = center === 'apps' ? '' : 'none';
    }
    document.querySelectorAll('#main-tabs-apps .main-tab[data-page]').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.page === page);
    });
  }

  /**
   * 切换模板中心终端 Tab
   * @param {string} terminal - '' | mp | pc
   */
  function switchTemplateTerminalTab(terminal) {
    currentTemplateTerminal = terminal || '';
    currentCenter = 'templates';
    currentMainTab = 'templates';
    document.querySelectorAll('.sidebar-menu-item[data-center]').forEach((item) => {
      item.classList.toggle('active', item.dataset.center === 'templates');
    });
    const mainTop = document.getElementById('main-top');
    if (mainTop) mainTop.style.display = '';
    const terminalFilter = document.getElementById('filter-terminal');
    if (terminalFilter) terminalFilter.value = currentTemplateTerminal;
    updateMainPageHeader('templates');
    updateMainFilters('templates');
    updateCenterTabs('templates', 'templates');
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const target = document.getElementById('page-templates');
    if (target) target.classList.add('active');
    applyFiltersAndRender();
  }

  /**
   * 搜索栏「终端类型」变更：与 Tab 同步后筛选
   */
  function onFilterTerminalChange() {
    const sel = document.getElementById('filter-terminal');
    const terminal = sel ? sel.value || '' : '';
    currentTemplateTerminal = terminal;
    updateCenterTabs('templates', 'templates');
    applyFiltersAndRender();
  }

  /**
   * 填充应用「来源渠道」筛选项
   */
  function renderAppChannelFilter() {
    const sel = document.getElementById('filter-app-channel');
    if (!sel || typeof MOCK_PUSH_CHANNELS === 'undefined') return;
    sel.innerHTML =
      '<option value="">全部渠道</option>' +
      MOCK_PUSH_CHANNELS.map(
        (c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
      ).join('');
  }

  /**
   * 应用状态与标签筛选并重绘列表（重置页码）
   */
  function applyFiltersAndRender() {
    const status = document.getElementById('filter-status').value;
    const tag = document.getElementById('filter-tag').value;
    const terminal = currentTemplateTerminal || '';
    const nameInput = document.getElementById('filter-template-name');
    const kw = nameInput ? nameInput.value.trim().toLowerCase() : '';

    let list = [...MOCK_TEMPLATES];
    if (terminal) list = list.filter((t) => (t.terminal || 'mp') === terminal);
    if (status) {
      list = list.filter((t) => {
        if (status === 'published') return t.status === 'published' || t.status === 'pushed';
        return t.status === status;
      });
    }
    if (tag) list = list.filter((t) => (t.tags || []).includes(tag));
    if (kw) {
      list = list.filter((t) => t.name && t.name.toLowerCase().includes(kw));
    }

    filteredTemplates = list;
    currentTemplatePage = 1;
    renderTemplatePage();
  }

  /**
   * 全选/取消全选
   */
  function onRowCheckChange() {
    const checkAll = document.getElementById('check-all');
    const rowChecks = document.querySelectorAll('#template-tbody .row-check');
    selectedTemplateIds = Array.from(rowChecks).filter((c) => c.checked).map((c) => c.value);
    if (checkAll) {
      checkAll.checked = rowChecks.length > 0 && selectedTemplateIds.length === rowChecks.length;
      checkAll.indeterminate = selectedTemplateIds.length > 0 && selectedTemplateIds.length < rowChecks.length;
    }
    updateTemplateSelectionSummary();
  }

  /**
   * PC 模板全选/取消全选
   */
  function onPcRowCheckChange() {
    const checkAll = document.getElementById('check-all-pc');
    const rowChecks = document.querySelectorAll('#pc-template-tbody .row-check-pc');
    selectedPcTemplateIds = Array.from(rowChecks).filter((c) => c.checked).map((c) => c.value);
    if (checkAll) {
      checkAll.checked = rowChecks.length > 0 && selectedPcTemplateIds.length === rowChecks.length;
      checkAll.indeterminate =
        selectedPcTemplateIds.length > 0 && selectedPcTemplateIds.length < rowChecks.length;
    }
    updatePcTemplateSelectionSummary();
  }

  /**
   * 返回应用状态文案
   * @param {string} status - published | draft
   * @returns {string}
   */
  function getAppStatusText(status) {
    const map = { published: '已发布', draft: '草稿' };
    return map[status] || status;
  }

  /**
   * 格式化应用更新时间
   * @returns {string}
   */
  function formatAppDateTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * 终端类型文案
   * @param {'mp'|'pc'} terminal
   * @returns {string}
   */
  function getAppTerminalLabel(terminal) {
    return terminal === 'pc' ? 'PC 端' : '小程序/H5';
  }

  /**
   * 多端终端文案
   * @param {Array<'mp'|'pc'>} terminals
   * @returns {string}
   */
  function getAppTerminalsLabel(terminals) {
    if (!terminals || !terminals.length) return '多端';
    return terminals.map(getAppTerminalLabel).join(' + ');
  }

  /**
   * 封面终端角标 HTML
   * @param {'mp'|'pc'|'multi'|Array<'mp'|'pc'>} terminal
   * @returns {string}
   */
  function getTerminalBadgeHtml(terminal) {
    let kind = 'mp';
    if (Array.isArray(terminal)) {
      kind = terminal.length > 1 ? 'multi' : terminal[0] === 'pc' ? 'pc' : 'mp';
    } else if (terminal === 'pc' || terminal === 'multi') {
      kind = terminal;
    }

    const map = {
      mp: {
        label: '小程序',
        icon:
          '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
      },
      pc: {
        label: 'PC',
        icon:
          '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
      },
      multi: {
        label: '多端',
        icon:
          '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="12" height="9" rx="1.5"/><rect x="12" y="10" width="7" height="10" rx="1.5"/><path d="M6 21h4"/></svg>',
      },
    };
    const item = map[kind] || map.mp;
    return `<span class="terminal-badge terminal-badge--${kind}" title="${escapeHtml(item.label)}">${item.icon}<span>${item.label}</span></span>`;
  }

  /**
   * 根据 id 查找应用（单端 / 多端）
   * @param {string} id - 应用 id
   * @returns {Object|undefined}
   */
  function findAppById(id) {
    const fromSingle = (typeof MOCK_APPS !== 'undefined' ? MOCK_APPS : []).find((a) => a.id === id);
    if (fromSingle) return fromSingle;
    return (typeof MOCK_MULTI_APPS !== 'undefined' ? MOCK_MULTI_APPS : []).find((a) => a.id === id);
  }

  /**
   * 显示应用内 Toast
   * @param {string} message - 提示文案
   */
  function showAppToast(message) {
    const el = document.getElementById('app-toast');
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
    closeModal('modal-app-dialog');
    appDialogOkCallback = null;
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
   * 显示应用内提示弹窗
   * @param {string} message - 提示内容
   * @param {string} [title] - 标题
   */
  function showAppDialog(message, title) {
    document.getElementById('app-dialog-title').textContent = title || '提示';
    document.getElementById('app-dialog-message').textContent = message;
    document.getElementById('app-dialog-cancel').style.display = 'none';
    document.getElementById('app-dialog-ok').textContent = '知道了';
    appDialogOkCallback = null;
    document.getElementById('modal-app-dialog').classList.add('show');
  }

  /**
   * 显示应用内确认弹窗
   * @param {string} message - 确认内容
   * @param {Function} onConfirm - 确认回调
   * @param {string} [title] - 标题
   * @param {string} [okText] - 确定按钮文案
   */
  function showAppConfirm(message, onConfirm, title, okText) {
    document.getElementById('app-dialog-title').textContent = title || '确认';
    document.getElementById('app-dialog-message').textContent = message;
    document.getElementById('app-dialog-cancel').style.display = '';
    document.getElementById('app-dialog-ok').textContent = okText || '确定';
    appDialogOkCallback = onConfirm;
    document.getElementById('modal-app-dialog').classList.add('show');
  }

  /**
   * 获取推送渠道模式
   * @param {string} radioName - 单选框 name
   * @returns {'all'|'custom'|null}
   */
  function getPushChannelMode(radioName) {
    const checked = document.querySelector(`input[name="${radioName}"]:checked`);
    return checked ? /** @type {'all'|'custom'} */ (checked.value) : null;
  }

  /**
   * 根据模式获取已选推送渠道
   * @param {'all'|'custom'|null} mode - 推送模式
   * @param {string} listSelector - 列表选择器
   * @returns {Array<{id: string, name: string}>}
   */
  function getPushMallsByMode(mode, listSelector) {
    if (!mode) return [];
    if (mode === 'all') return (MOCK_PUSH_CHANNELS || []).slice();
    return Array.from(document.querySelectorAll(`${listSelector} .push-mall-item.selected`))
      .map((el) => (MOCK_PUSH_CHANNELS || []).find((c) => c.id === el.dataset.id))
      .filter(Boolean);
  }

  /**
   * 校验推送渠道是否已选择
   * @param {string} radioName - 单选框 name
   * @param {string} listSelector - 列表选择器
   * @returns {boolean}
   */
  function isPushChannelValid(radioName, listSelector) {
    const mode = getPushChannelMode(radioName);
    if (!mode) return false;
    if (mode === 'all') return true;
    return getPushMallsByMode('custom', listSelector).length > 0;
  }

  /**
   * 更新推送确认按钮状态
   * @param {string} btnId - 按钮 id
   * @param {string} radioName - 单选框 name
   * @param {string} listSelector - 列表选择器
   */
  function updatePushConfirmBtn(btnId, radioName, listSelector) {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = !isPushChannelValid(radioName, listSelector);
  }

  /**
   * 获取应用推送配置
   * @param {Object} app - 应用数据
   * @returns {{pageMode: 'all'|'custom', pageIds: string[], copyProducts: boolean, priceMode: 'default'|'supplier', priceCoeff: number, pushChannelMode: 'all'|'custom', pushChannelIds: string[]}}
   */
  function getAppPushConfig(app) {
    if (app.pushConfig) return app.pushConfig;
    const allChannels = MOCK_PUSH_CHANNELS || [];
    const allPageIds = (MOCK_BUILD_PAGES || []).map((p) => p.id);
    const latestRecord = (typeof MOCK_APP_PUSH_RECORDS !== 'undefined' ? MOCK_APP_PUSH_RECORDS : []).find(
      (r) => r.appId === app.id
    );
    const pushChannelIds = latestRecord ? latestRecord.channelIds.slice() : [];
    const isAllChannels =
      pushChannelIds.length === allChannels.length &&
      allChannels.every((c) => pushChannelIds.includes(c.id));
    return {
      pageMode: 'all',
      pageIds: allPageIds,
      copyProducts: true,
      priceMode: 'default',
      priceCoeff: 1.2,
      pushChannelMode: isAllChannels ? 'all' : 'custom',
      pushChannelIds,
    };
  }

  /**
   * 获取推送详情页面名称列表
   * @param {Object} app - 应用数据
   * @param {{pageMode: string, pageIds: string[]}} config - 推送配置
   * @returns {string[]}
   */
  function getPushDetailPageNames(app, config) {
    const allPages = MOCK_BUILD_PAGES || [];
    if (config.pageMode === 'all') return allPages.map((p) => p.name);
    return (config.pageIds || [])
      .map((id) => allPages.find((p) => p.id === id)?.name)
      .filter(Boolean);
  }

  /**
   * 追加应用推送记录
   * @param {Object} app - 应用数据
   * @param {Array<{id: string, name: string}>} channels - 推送渠道
   */
  function appendAppPushRecords(app, channels) {
    if (!channels.length || typeof MOCK_APP_PUSH_RECORDS === 'undefined') return;
    MOCK_APP_PUSH_RECORDS.unshift({
      id: String(Date.now()),
      appId: app.id,
      pushName: app.name,
      channelIds: channels.map((c) => c.id),
      channelNames: channels.map((c) => c.name),
      channelCount: channels.length,
      operator: 'admin',
      pushedAt: formatAppDateTime(),
    });
    const names = new Set([...(app.pushTargets || []), ...channels.map((c) => c.name)]);
    app.pushTargets = Array.from(names);
  }

  /**
   * 发布应用
   * @param {string} id - 应用 id
   */
  function publishApp(id) {
    const app = findAppById(id);
    if (!app || app.status !== 'draft') return;
    showAppConfirm(
      `确定发布应用「${app.name}」吗？`,
      () => {
        app.status = 'published';
        app.updatedAt = formatAppDateTime();
        renderAppList();
        showAppToast('操作成功');
      },
      '发布应用',
      '确认发布'
    );
  }

  /**
   * 取消发布应用
   * @param {string} id - 应用 id
   */
  function unpublishApp(id) {
    const app = findAppById(id);
    if (!app || app.status !== 'published') return;
    showAppConfirm(
      '取消发布后应用将变为草稿，可继续搭建。是否继续？',
      () => {
        app.status = 'draft';
        app.pushTargets = [];
        app.updatedAt = formatAppDateTime();
        renderAppList();
        showAppToast('操作成功');
      },
      '取消发布',
      '确认'
    );
  }

  /**
   * 打开应用搭建编辑器
   * @param {string} appId - 应用 id
   */
  function openAppEditor(appId) {
    const app = findAppById(appId);
    if (!app) return;
    const url = new URL('editor.html', window.location.href);
    url.searchParams.set('type', 'app');
    url.searchParams.set('id', app.id);
    url.searchParams.set('name', app.name);
    window.open(url.toString(), 'editor', 'width=1200,height=800,scrollbars=yes');
  }

  /**
   * 继续搭建应用（草稿二次编辑）
   * @param {string} id - 应用 id
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
   * @param {string} id - 应用 id
   */
  function deleteApp(id) {
    if (typeof MOCK_APPS === 'undefined') return;
    const index = MOCK_APPS.findIndex((a) => a.id === id);
    if (index === -1) return;
    const app = MOCK_APPS[index];
    if (app.status === 'published') return;
    showAppConfirm(
      `确定删除应用「${app.name}」？`,
      () => {
        MOCK_APPS.splice(index, 1);
        renderAppList();
        showAppToast('操作成功');
      },
      '删除应用',
      '确认删除'
    );
  }

  /**
   * 更新推送应用渠道提示
   */
  function updatePromotePushChannelHint() {
    const hint = document.getElementById('promote-push-hint');
    const mode = getPushChannelMode('promote-push-channel');
    const allCount = (MOCK_PUSH_CHANNELS || []).length;
    if (!hint) return;
    if (!mode) {
      hint.textContent = '请选择全部渠道或指定渠道';
    } else if (mode === 'all') {
      hint.textContent = `将推送到全部渠道商城（共 ${allCount} 个）`;
    } else {
      const count = document.querySelectorAll('#promote-push-mall-list .push-mall-item.selected').length;
      hint.textContent = count ? `已选择 ${count} 个渠道` : '请至少选择一个渠道';
    }
    updatePushConfirmBtn('btn-promote-app-confirm', 'promote-push-channel', '#promote-push-mall-list');
  }

  /**
   * 渲染推送应用渠道列表
   * @param {string[]} [preselectedIds] - 预选渠道 id
   */
  function renderPromotePushMallList(preselectedIds) {
    const list = document.getElementById('promote-push-mall-list');
    const searchEl = document.getElementById('promote-push-search');
    if (!list) return;
    const keyword = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const selectedIds = preselectedIds
      ? new Set(preselectedIds)
      : new Set(
          Array.from(document.querySelectorAll('#promote-push-mall-list .push-mall-item.selected')).map(
            (el) => el.dataset.id
          )
        );
    const channels = (MOCK_PUSH_CHANNELS || []).filter(
      (c) => !keyword || c.name.toLowerCase().includes(keyword)
    );
    if (!channels.length) {
      list.innerHTML = '<div class="push-mall-empty">无匹配渠道</div>';
      return;
    }
    list.innerHTML = channels
      .map(
        (c) => `
      <div class="push-mall-item${selectedIds.has(c.id) ? ' selected' : ''}" data-id="${c.id}">
        <span>${escapeHtml(c.name)}</span>
        <span class="push-mall-check">✓</span>
      </div>
    `
      )
      .join('');
    list.querySelectorAll('.push-mall-item').forEach((item) => {
      item.addEventListener('click', function () {
        this.classList.toggle('selected');
        updatePromotePushChannelHint();
      });
    });
  }

  /**
   * 初始化推送应用渠道选择
   * @param {Object} app - 应用数据
   */
  function initPromotePushChannelUI(app) {
    const searchEl = document.getElementById('promote-push-search');
    const panel = document.getElementById('promote-push-channel-panel');
    if (searchEl) searchEl.value = '';
    document.querySelectorAll('input[name="promote-push-channel"]').forEach((el) => {
      el.checked = false;
    });
    if (panel) panel.classList.remove('show');
    renderPromotePushMallList();

    const config = getAppPushConfig(app);
    if (config.pushChannelMode) {
      const radio = document.querySelector(
        `input[name="promote-push-channel"][value="${config.pushChannelMode}"]`
      );
      if (radio) radio.checked = true;
      if (panel) panel.classList.toggle('show', config.pushChannelMode === 'custom');
      if (config.pushChannelMode === 'custom') {
        renderPromotePushMallList(config.pushChannelIds || []);
      }
    }
    updatePromotePushChannelHint();
  }

  /**
   * 打开推送应用弹窗
   * @param {string} id - 应用 id
   */
  function promoteApp(id) {
    const app = findAppById(id);
    if (!app || app.status !== 'published') return;
    promotingAppId = id;
    const nameEl = document.getElementById('promote-app-name');
    if (nameEl) nameEl.textContent = app.name;
    initPromotePushChannelUI(app);
    document.getElementById('modal-promote-app').classList.add('show');
  }

  /**
   * 关闭推送应用弹窗
   */
  function closePromoteAppModal() {
    promotingAppId = null;
    closeModal('modal-promote-app');
  }

  /**
   * 提交推送应用
   */
  function submitPromoteApp() {
    const app = findAppById(promotingAppId);
    if (!app) return;
    if (!isPushChannelValid('promote-push-channel', '#promote-push-mall-list')) return;
    const pushChannels = getPushMallsByMode(getPushChannelMode('promote-push-channel'), '#promote-push-mall-list');
    const channelMode = getPushChannelMode('promote-push-channel');
    const existing = getAppPushConfig(app);
    app.pushConfig = {
      ...existing,
      pushChannelMode: channelMode,
      pushChannelIds: pushChannels.map((c) => c.id),
    };
    appendAppPushRecords(app, pushChannels);
    app.updatedAt = formatAppDateTime();
    closePromoteAppModal();
    renderAppList();
    showAppToast('操作成功');
  }

  /**
   * 渲染推送详情页面勾选列表
   * @param {Object} app - 应用数据
   * @param {string[]} selectedIds - 已选页面 id
   */
  function renderPushDetailPageCheckList(app, selectedIds) {
    const list = document.getElementById('push-detail-page-list');
    if (!list) return;
    const selected = new Set(selectedIds || []);
    list.innerHTML = (MOCK_BUILD_PAGES || [])
      .map(
        (p) => `
      <label class="new-app-checkbox-item">
        <input type="checkbox" disabled ${selected.has(p.id) ? 'checked' : ''} />
        <span>${escapeHtml(p.name)}</span>
      </label>
    `
      )
      .join('');
    const pagePanel = document.getElementById('push-detail-page-panel');
    const config = getAppPushConfig(app);
    if (pagePanel) pagePanel.classList.toggle('hidden', config.pageMode !== 'custom');
  }

  /**
   * 渲染推送详情渠道列表（只读）
   * @param {string[]} channelIds - 渠道 id 列表
   */
  function renderPushDetailMallList(channelIds) {
    const list = document.getElementById('push-detail-mall-list');
    if (!list) return;
    const ids = new Set(channelIds || []);
    const channels = (MOCK_PUSH_CHANNELS || []).filter((c) => ids.has(c.id));
    if (!channels.length) {
      list.innerHTML = '<div class="push-mall-empty">暂无推送渠道</div>';
      return;
    }
    list.innerHTML = channels
      .map(
        (c) => `
      <div class="push-mall-item selected" data-id="${c.id}">
        <span>${escapeHtml(c.name)}</span>
        <span class="push-mall-check">✓</span>
      </div>
    `
      )
      .join('');
  }

  /**
   * 更新推送详情只读提示
   * @param {Object} app - 应用数据
   * @param {ReturnType<typeof getAppPushConfig>} config - 推送配置
   */
  function updatePushDetailReadonlyHints(app, config) {
    const pageHint = document.getElementById('push-detail-page-hint');
    if (pageHint) {
      if (config.pageMode === 'all') {
        pageHint.textContent = '将复制所选渠道商城的全部搭建页面';
      } else {
        const names = getPushDetailPageNames(app, config);
        pageHint.textContent = names.length ? `已选择 ${names.length} 个页面` : '';
      }
    }

    const goodsHint = document.getElementById('push-detail-goods-hint');
    if (goodsHint) {
      if (!config.copyProducts) {
        goodsHint.textContent = '不复制商品数据，仅复制搭建页面';
      } else if (config.priceMode === 'default') {
        goodsHint.textContent = '复制商品数据，价格沿用渠道商城的商品价格';
      } else {
        goodsHint.textContent = `复制商品数据，新价格 = 供应商价格 × ${config.priceCoeff || 1.2}`;
      }
    }

    const channelHint = document.getElementById('push-detail-channel-hint');
    if (channelHint) {
      const allCount = (MOCK_PUSH_CHANNELS || []).length;
      if (config.pushChannelMode === 'all') {
        channelHint.textContent = `全部渠道（共 ${allCount} 个）`;
      } else {
        const names = (config.pushChannelIds || [])
          .map((id) => (MOCK_PUSH_CHANNELS || []).find((c) => c.id === id)?.name)
          .filter(Boolean);
        channelHint.textContent = names.length ? `已推送渠道：${names.join('、')}` : '未配置推送渠道';
      }
    }
  }

  /**
   * 填充推送详情表单
   * @param {Object} app - 应用数据
   * @param {ReturnType<typeof getAppPushConfig>} config - 推送配置
   */
  function fillPushDetailForm(app, config) {
    const nameInput = document.getElementById('push-detail-app-name');
    if (nameInput) nameInput.value = app.name;

    const mallSelect = document.getElementById('push-detail-channel-mall');
    if (mallSelect) {
      mallSelect.innerHTML = (MOCK_CHANNEL_MALLS || [])
        .map(
          (m) =>
            `<option value="${escapeHtml(m.id)}"${m.id === app.sourceMallId || m.name === app.sourceChannel ? ' selected' : ''}>${escapeHtml(m.name)}</option>`
        )
        .join('');
    }

    const pageMode = config.pageMode || 'all';
    const pageModeRadio = document.querySelector(`input[name="push-detail-page-mode"][value="${pageMode}"]`);
    if (pageModeRadio) pageModeRadio.checked = true;
    renderPushDetailPageCheckList(app, config.pageIds);

    const copyGoods = document.getElementById('push-detail-copy-goods');
    if (copyGoods) copyGoods.checked = !!config.copyProducts;
    const priceWrap = document.getElementById('push-detail-price-wrap');
    if (priceWrap) priceWrap.classList.toggle('hidden', !config.copyProducts);
    const priceModeRadio = document.querySelector(
      `input[name="push-detail-price-type"][value="${config.priceMode === 'supplier' ? 'supplier' : 'default'}"]`
    );
    if (priceModeRadio) priceModeRadio.checked = true;
    const priceCoeff = document.getElementById('push-detail-price-coeff');
    if (priceCoeff) priceCoeff.value = String(config.priceCoeff || 1.2);
    const coeffRow = document.getElementById('push-detail-coeff-row');
    if (coeffRow) coeffRow.classList.toggle('show', config.priceMode === 'supplier');

    const channelMode = config.pushChannelMode || 'custom';
    const channelModeRadio = document.querySelector(
      `input[name="push-detail-channel-mode"][value="${channelMode}"]`
    );
    if (channelModeRadio) channelModeRadio.checked = true;
    const channelPanel = document.getElementById('push-detail-channel-panel');
    if (channelPanel) channelPanel.classList.toggle('show', channelMode === 'custom');
    renderPushDetailMallList(channelMode === 'custom' ? config.pushChannelIds || [] : []);

    updatePushDetailReadonlyHints(app, config);
  }

  /**
   * 渲染推送详情预览屏幕
   * @param {string} pageId - 页面 id
   */
  function renderPushDetailPreviewScreen(pageId) {
    const titleEl = document.getElementById('push-detail-preview-title');
    const screenEl = document.getElementById('push-detail-preview-screen');
    if (!titleEl || !screenEl) return;
    const page = (MOCK_BUILD_PAGES || []).find((p) => p.id === pageId);
    const pageName = page ? page.name : '首页';
    titleEl.textContent = pageName;
    pushDetailPreviewPageId = pageId;

    if (pageId === 'category') {
      screenEl.innerHTML =
        '<div class="new-app-preview-list">' +
        '<div class="new-app-preview-block"></div>'.repeat(5) +
        '</div>';
    } else if (pageId === 'mine') {
      screenEl.innerHTML =
        '<div class="new-app-preview-mine">' +
        '<div class="new-app-preview-avatar"></div>' +
        '<div class="new-app-preview-line"></div>' +
        '<div class="new-app-preview-line"></div>' +
        '</div>';
    } else {
      screenEl.innerHTML =
        '<div class="new-app-preview-banner"></div>' +
        '<div class="new-app-preview-grid">' +
        '<div class="new-app-preview-block"></div>'.repeat(6) +
        '</div>';
    }
  }

  /**
   * 更新推送详情预览页切换
   * @param {string[]} pageNames - 页面名称列表
   */
  function updatePushDetailPreviewPageButtons(pageNames) {
    const container = document.getElementById('push-detail-preview-pages');
    if (!container) return;
    const pages = (MOCK_BUILD_PAGES || []).filter((p) => pageNames.includes(p.name));
    if (!pages.length) {
      container.innerHTML = '<span class="form-hint">无可预览页面</span>';
      return;
    }
    if (!pages.some((p) => p.id === pushDetailPreviewPageId)) {
      pushDetailPreviewPageId = pages[0].id;
    }
    container.innerHTML = pages
      .map(
        (p) =>
          `<button type="button" class="new-app-preview-page-btn ${p.id === pushDetailPreviewPageId ? 'active' : ''}" data-page-id="${p.id}">${escapeHtml(p.name)}</button>`
      )
      .join('');
    container.querySelectorAll('.new-app-preview-page-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        renderPushDetailPreviewScreen(this.dataset.pageId);
        updatePushDetailPreviewPageButtons(pageNames);
      });
    });
    renderPushDetailPreviewScreen(pushDetailPreviewPageId);
  }

  /**
   * 设置推送详情预览模式
   * @param {boolean} enabled - 是否开启
   */
  function setPushDetailPreviewMode(enabled) {
    pushDetailPreviewMode = enabled;
    const content = document.getElementById('modal-push-detail-content');
    const panel = document.getElementById('push-detail-preview-panel');
    const openBtn = document.getElementById('btn-push-detail-preview');
    const closeBtn = document.getElementById('btn-push-detail-close-preview');
    if (content) content.classList.toggle('is-preview', enabled);
    if (panel) panel.classList.toggle('hidden', !enabled);
    if (openBtn) openBtn.classList.toggle('hidden', enabled);
    if (closeBtn) closeBtn.classList.toggle('hidden', !enabled);
  }

  /**
   * 切换推送详情应用预览
   */
  function togglePushDetailPreview() {
    const app = findAppById(pushDetailAppId);
    if (!app) return;
    const config = getAppPushConfig(app);
    const pageNames = getPushDetailPageNames(app, config);
    if (!pageNames.length) {
      showAppDialog('无可预览页面');
      return;
    }
    if (pushDetailPreviewMode) {
      setPushDetailPreviewMode(false);
      return;
    }
    setPushDetailPreviewMode(true);
    updatePushDetailPreviewPageButtons(pageNames);
  }

  /**
   * 打开推送详情弹窗
   * @param {string} id - 应用 id
   */
  function openPushDetailModal(id) {
    const app = findAppById(id);
    if (!app || app.status !== 'published') return;
    pushDetailAppId = id;
    setPushDetailPreviewMode(false);
    pushDetailPreviewPageId = 'home';
    fillPushDetailForm(app, getAppPushConfig(app));
    document.getElementById('modal-push-detail').classList.add('show');
  }

  /**
   * 关闭推送详情弹窗
   */
  function closePushDetailModal() {
    pushDetailAppId = null;
    setPushDetailPreviewMode(false);
    closeModal('modal-push-detail');
  }

  /**
   * 渲染应用卡片操作区
   * @param {{id: string, status: string}} app - 应用数据
   * @returns {string}
   */
  function renderAppCardActions(app) {
    if (app.status === 'published') {
      return `
        <button type="button" class="app-card-link btn-app-detail" data-id="${app.id}">详情</button>
        <button type="button" class="app-card-link btn-app-push" data-id="${app.id}">推送</button>
        <button type="button" class="app-card-link btn-app-unpublish" data-id="${app.id}">取消发布</button>
      `;
    }
    return `
      <button type="button" class="app-card-link btn-app-publish" data-id="${app.id}">发布</button>
      <button type="button" class="app-card-link btn-app-edit" data-id="${app.id}">继续搭建</button>
      <button type="button" class="app-card-link danger btn-app-delete" data-id="${app.id}">删除</button>
    `;
  }

  /**
   * 绑定应用卡片操作按钮
   * @param {HTMLElement} container - 卡片容器
   */
  function bindAppCardActions(container) {
    container.querySelectorAll('.btn-app-preview').forEach((btn) => {
      btn.addEventListener('click', () => {
        const app = findAppById(btn.dataset.id);
        alert('演示：预览应用「' + (app ? app.name : btn.dataset.id) + '」，实际可在新窗口打开预览 URL。');
      });
    });
    container.querySelectorAll('.btn-app-detail').forEach((btn) => {
      btn.addEventListener('click', () => openPushDetailModal(btn.dataset.id));
    });
    container.querySelectorAll('.btn-app-push').forEach((btn) => {
      btn.addEventListener('click', () => promoteApp(btn.dataset.id));
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
  }

  /**
   * 切换中心（侧边栏：模板中心 / 应用中心）
   * @param {string} center - templates | apps
   */
  function switchMainCenter(center) {
    currentCenter = center;
    document.querySelectorAll('.sidebar-menu-item[data-center]').forEach((item) => {
      item.classList.toggle('active', item.dataset.center === center);
    });
    const defaultPage = center === 'apps' ? 'apps' : 'templates';
    const pageBelongs =
      (center === 'templates' && currentMainTab === 'templates') ||
      (center === 'apps' && (currentMainTab === 'apps' || currentMainTab === 'multi-apps'));
    switchMainTab(pageBelongs ? currentMainTab : defaultPage);
  }

  /**
   * 切换中心内 Tab
   * @param {string} page - templates | apps | multi-apps
   */
  function switchMainTab(page) {
    // 兼容旧 pc-templates 入口，统一到模板中心
    if (page === 'pc-templates') page = 'templates';
    currentMainTab = page;
    currentCenter = page === 'apps' || page === 'multi-apps' ? 'apps' : 'templates';

    document.querySelectorAll('.sidebar-menu-item[data-center]').forEach((item) => {
      item.classList.toggle('active', item.dataset.center === currentCenter);
    });

    const mainTop = document.getElementById('main-top');
    if (mainTop) mainTop.style.display = '';
    updateMainPageHeader(currentCenter);
    updateMainFilters(currentCenter);
    updateCenterTabs(currentCenter, page);

    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    if (page === 'apps') renderAppList();
    if (page === 'multi-apps') renderMultiAppList();
    if (page === 'templates') renderTemplatePage();
  }

  /**
   * 渲染多端应用列表
   */
  function renderMultiAppList() {
    const grid = document.getElementById('multi-app-list-grid');
    const paginationEl = document.getElementById('multi-app-list-pagination');
    const statusFilter = document.getElementById('filter-app-status');
    const nameInput = document.getElementById('filter-app-name');
    const channelFilter = document.getElementById('filter-app-channel');
    if (!grid) return;

    const status = statusFilter ? statusFilter.value : '';
    const kw = nameInput ? nameInput.value.trim().toLowerCase() : '';
    const channel = channelFilter ? channelFilter.value : '';
    let list = (typeof MOCK_MULTI_APPS !== 'undefined' && MOCK_MULTI_APPS) || [];
    if (status) list = list.filter((a) => a.status === status);
    if (channel) list = list.filter((a) => a.sourceChannel === channel);
    if (kw) list = list.filter((a) => a.name && a.name.toLowerCase().includes(kw));

    grid.innerHTML = list.length
      ? list
          .map((a) => {
            const previewModel = getAppPreviewModel(a);
            return `
        <article class="app-card app-card--pc" data-id="${a.id}">
          <div class="template-card-cover">
            <img class="template-card-cover-image" src="${getPcTemplatePreviewSrc(previewModel)}" alt="${escapeHtml(a.name)} 预览图" />
            <span class="template-card-status status-tag status-${a.status}">${getAppStatusText(a.status)}</span>
            ${getTerminalBadgeHtml(a.terminals || 'multi')}
            <div class="template-card-preview-mask">
              <button type="button" class="template-preview-btn btn-multi-app-preview" data-id="${a.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>预览</span>
              </button>
            </div>
          </div>
          <div class="app-card-body">
            <h3 class="app-card-title">${escapeHtml(a.name)}</h3>
            <div class="app-card-meta">来源渠道：${escapeHtml(a.sourceChannel || '-')}</div>
            <div class="app-card-meta">最近修改：${escapeHtml(a.updatedAt)}</div>
            <div class="app-card-actions">${renderAppCardActions(a)}</div>
          </div>
        </article>
      `;
          })
          .join('')
      : '<div class="app-empty">暂无符合条件的多端应用</div>';

    bindAppCardActions(grid);
    grid.querySelectorAll('.btn-multi-app-preview').forEach((btn) => {
      btn.addEventListener('click', () => {
        const app = findAppById(btn.dataset.id);
        alert('演示：预览多端应用「' + (app ? app.name : btn.dataset.id) + '」。');
      });
    });

    if (paginationEl) {
      paginationEl.innerHTML =
        list.length > 0
          ? `<span class="pagination-total">共 ${list.length} 条</span>`
          : '<span class="pagination-total">暂无数据</span>';
    }
  }

  /**
   * 渲染单端应用列表
   */
  function renderAppList() {
    const grid = document.getElementById('app-list-grid');
    const paginationEl = document.getElementById('app-list-pagination');
    const statusFilter = document.getElementById('filter-app-status');
    const nameInput = document.getElementById('filter-app-name');
    const channelFilter = document.getElementById('filter-app-channel');
    if (!grid) return;

    const status = statusFilter ? statusFilter.value : '';
    const kw = nameInput ? nameInput.value.trim().toLowerCase() : '';
    const channel = channelFilter ? channelFilter.value : '';
    let list = (typeof MOCK_APPS !== 'undefined' && MOCK_APPS) || [];
    if (status) list = list.filter((a) => a.status === status);
    if (channel) list = list.filter((a) => a.sourceChannel === channel);
    if (kw) list = list.filter((a) => a.name && a.name.toLowerCase().includes(kw));

    grid.innerHTML = list.length
      ? list
          .map((a) => {
            const isPc = a.terminal === 'pc';
            const previewModel = getAppPreviewModel(a);
            if (isPc) {
              return `
        <article class="app-card app-card--pc" data-id="${a.id}">
          <div class="template-card-cover">
            <img class="template-card-cover-image" src="${getPcTemplatePreviewSrc(previewModel)}" alt="${escapeHtml(a.name)} 预览图" />
            <span class="template-card-status status-tag status-${a.status}">${getAppStatusText(a.status)}</span>
            ${getTerminalBadgeHtml('pc')}
            <div class="template-card-preview-mask">
              <button type="button" class="template-preview-btn btn-app-preview" data-id="${a.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>预览</span>
              </button>
            </div>
          </div>
          <div class="app-card-body">
            <h3 class="app-card-title">${escapeHtml(a.name)}</h3>
            <div class="app-card-meta">最近修改：${escapeHtml(a.updatedAt)}</div>
            <div class="app-card-actions">${renderAppCardActions(a)}</div>
          </div>
        </article>
      `;
            }
            return `
        <article class="app-card app-card--mp" data-id="${a.id}">
          <div class="template-card-cover">
            <img class="template-card-cover-image" src="${getTemplatePreviewSrc(previewModel)}" alt="${escapeHtml(a.name)} 预览图" />
            <span class="template-card-status status-tag status-${a.status}">${getAppStatusText(a.status)}</span>
            ${getTerminalBadgeHtml('mp')}
            <div class="template-card-preview-mask">
              <button type="button" class="template-preview-btn btn-app-preview" data-id="${a.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>预览</span>
              </button>
            </div>
          </div>
          <div class="app-card-body">
            <h3 class="app-card-title">${escapeHtml(a.name)}</h3>
            <div class="app-card-meta">最近修改：${escapeHtml(a.updatedAt)}</div>
            <div class="app-card-actions">${renderAppCardActions(a)}</div>
          </div>
        </article>
      `;
          })
          .join('')
      : '<div class="app-empty">暂无符合条件的单端应用</div>';

    bindAppCardActions(grid);

    if (paginationEl) {
      paginationEl.innerHTML =
        list.length > 0
          ? `<span class="pagination-total">共 ${list.length} 条</span>`
          : '<span class="pagination-total">暂无数据</span>';
    }
  }

  /**
   * 打开「选择新建类型」弹窗
   */
  function openSelectCreateTypeModal() {
    const modal = document.getElementById('modal-select-create-type');
    if (modal) modal.classList.add('show');
  }

  /**
   * 选择「新建模板」后进入模板创建弹窗
   */
  function onSelectCreateTemplate() {
    closeModal('modal-select-create-type');
    openNewTemplateModal();
  }

  /** 新建应用：是否处于预览模式 */
  let newAppPreviewMode = false;

  /** 新建应用：当前预览页面 id */
  let newAppPreviewPageId = 'home';

  /**
   * 获取当前选中的渠道商城
   * @returns {{id: string, name: string, pageCount: number}|null}
   */
  function getSelectedChannelMall() {
    const sel = document.getElementById('new-app-channel-mall');
    if (!sel || typeof MOCK_CHANNEL_MALLS === 'undefined') return null;
    return MOCK_CHANNEL_MALLS.find((m) => m.id === sel.value) || null;
  }

  /**
   * 同步新建应用名称（默认取渠道商城名称 + 副本）
   */
  function syncNewAppNameFromMall() {
    const mall = getSelectedChannelMall();
    const input = document.getElementById('new-app-name');
    if (mall && input) input.value = mall.name + '副本';
  }

  /**
   * 渲染搭建页面勾选列表
   */
  function renderNewAppPagesList() {
    const container = document.getElementById('new-app-pages-list');
    if (!container || typeof MOCK_BUILD_PAGES === 'undefined') return;
    container.innerHTML = MOCK_BUILD_PAGES.map(
      (p) => `
      <label class="new-app-checkbox-item">
        <input type="checkbox" class="new-app-page-check" value="${p.id}" ${p.defaultChecked ? 'checked' : ''} />
        <span>${escapeHtml(p.name)}</span>
      </label>
    `
    ).join('');
    container.querySelectorAll('.new-app-page-check').forEach((el) => {
      el.addEventListener('change', function () {
        updateNewAppFormUI();
        if (newAppPreviewMode) updateNewAppPreviewUI();
      });
    });
  }

  /**
   * 渲染推送渠道勾选列表
   * @param {string} [keyword] - 搜索关键词
   */
  function renderNewAppChannelList(keyword) {
    const container = document.getElementById('new-app-channel-list');
    if (!container || typeof MOCK_PUSH_CHANNELS === 'undefined') return;
    const checkedIds = Array.from(document.querySelectorAll('.new-app-channel-check:checked')).map(
      (el) => el.value
    );
    const kw = (keyword || '').trim().toLowerCase();
    const list = kw
      ? MOCK_PUSH_CHANNELS.filter((c) => c.name.toLowerCase().includes(kw))
      : MOCK_PUSH_CHANNELS;
    container.innerHTML = list
      .map(
        (c) => `
      <label class="new-app-channel-item">
        <input type="checkbox" class="new-app-channel-check" value="${c.id}" ${checkedIds.includes(c.id) ? 'checked' : ''} />
        <span>${escapeHtml(c.name)}</span>
      </label>
    `
      )
      .join('');
    container.querySelectorAll('.new-app-channel-check').forEach((el) => {
      el.addEventListener('change', updateNewAppFormUI);
    });
  }

  /**
   * 获取当前勾选的搭建页面
   * @returns {Array<{id: string, name: string}>}
   */
  function getCheckedBuildPages() {
    if (typeof MOCK_BUILD_PAGES === 'undefined') return [];
    const copyPages = document.querySelector('input[name="new-app-copy-pages"]:checked');
    if (copyPages && copyPages.value === 'all') return MOCK_BUILD_PAGES.slice();
    return MOCK_BUILD_PAGES.filter((p) => {
      const el = document.querySelector(`.new-app-page-check[value="${p.id}"]`);
      return el && el.checked;
    });
  }

  /**
   * 获取已选推送渠道数量
   * @returns {number}
   */
  function getCheckedPushChannelCount() {
    return document.querySelectorAll('.new-app-channel-check:checked').length;
  }

  /**
   * 渲染手机预览内容
   * @param {string} pageId - 页面 id
   */
  function renderNewAppPreviewScreen(pageId) {
    const titleEl = document.getElementById('new-app-preview-title');
    const screenEl = document.getElementById('new-app-preview-screen');
    if (!titleEl || !screenEl) return;
    const page = (MOCK_BUILD_PAGES || []).find((p) => p.id === pageId);
    const pageName = page ? page.name : '首页';
    titleEl.textContent = pageName;
    newAppPreviewPageId = pageId;

    if (pageId === 'category') {
      screenEl.innerHTML =
        '<div class="new-app-preview-list">' +
        '<div class="new-app-preview-block"></div>'.repeat(5) +
        '</div>';
    } else if (pageId === 'mine') {
      screenEl.innerHTML =
        '<div class="new-app-preview-mine">' +
        '<div class="new-app-preview-avatar"></div>' +
        '<div class="new-app-preview-line"></div>' +
        '<div class="new-app-preview-line"></div>' +
        '</div>';
    } else {
      screenEl.innerHTML =
        '<div class="new-app-preview-banner"></div>' +
        '<div class="new-app-preview-grid">' +
        '<div class="new-app-preview-block"></div>'.repeat(6) +
        '</div>';
    }
  }

  /**
   * 更新右侧预览页切换按钮
   */
  function updateNewAppPreviewPageButtons() {
    const container = document.getElementById('new-app-preview-pages');
    if (!container) return;
    const pages = getCheckedBuildPages();
    if (!pages.length) {
      container.innerHTML = '<span class="form-hint">请先勾选搭建页面</span>';
      return;
    }
    if (!pages.some((p) => p.id === newAppPreviewPageId)) {
      newAppPreviewPageId = pages[0].id;
    }
    container.innerHTML = pages
      .map(
        (p) =>
          `<button type="button" class="new-app-preview-page-btn ${p.id === newAppPreviewPageId ? 'active' : ''}" data-page-id="${p.id}">${escapeHtml(p.name)}</button>`
      )
      .join('');
    container.querySelectorAll('.new-app-preview-page-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        renderNewAppPreviewScreen(this.dataset.pageId);
        updateNewAppPreviewPageButtons();
      });
    });
    renderNewAppPreviewScreen(newAppPreviewPageId);
  }

  /**
   * 更新预览区域
   */
  function updateNewAppPreviewUI() {
    updateNewAppPreviewPageButtons();
  }

  /**
   * 切换新建应用预览模式
   * @param {boolean} enabled - 是否开启预览
   */
  function setNewAppPreviewMode(enabled) {
    newAppPreviewMode = enabled;
    const content = document.getElementById('modal-new-app-content');
    const panel = document.getElementById('new-app-preview-panel');
    const openBtn = document.getElementById('btn-new-app-preview');
    const closeBtn = document.getElementById('btn-new-app-close-preview');
    if (content) content.classList.toggle('is-preview', enabled);
    if (panel) panel.classList.toggle('hidden', !enabled);
    if (openBtn) openBtn.classList.toggle('hidden', enabled);
    if (closeBtn) closeBtn.classList.toggle('hidden', !enabled);
    if (enabled) updateNewAppPreviewUI();
  }

  /**
   * 更新新建应用表单提示文案与控件显隐
   */
  function updateNewAppFormUI() {
    const mall = getSelectedChannelMall();
    const mallName = mall ? mall.name : '—';
    const pageCount = mall ? mall.pageCount : 0;

    const pagesHint = document.getElementById('new-app-pages-hint');
    const pagesSpecifyWrap = document.getElementById('new-app-pages-specify-wrap');
    const copyPages = document.querySelector('input[name="new-app-copy-pages"]:checked');
    const checkedPages = getCheckedBuildPages();

    if (pagesSpecifyWrap) {
      pagesSpecifyWrap.classList.toggle('hidden', !(copyPages && copyPages.value === 'specify'));
    }
    if (pagesHint) {
      if (copyPages && copyPages.value === 'specify') {
        const defaultNames = MOCK_BUILD_PAGES.filter((p) => p.defaultChecked).map((p) => p.name).join('、');
        pagesHint.textContent = `已选择 ${checkedPages.length} 个页面，默认勾选${defaultNames}`;
      } else {
        pagesHint.textContent = `将复制「${mallName}」的全部 ${pageCount} 个搭建页面`;
      }
    }

    const copyGoods = document.getElementById('new-app-copy-goods');
    const priceWrap = document.getElementById('new-app-price-wrap');
    const goodsHint = document.getElementById('new-app-goods-hint');
    const priceType = document.querySelector('input[name="new-app-price-type"]:checked');
    const coeffRow = document.getElementById('new-app-coeff-row');
    const priceCoeff = document.getElementById('new-app-price-coeff');
    const isSupplierPrice = !!(copyGoods && copyGoods.checked && priceType && priceType.value === 'supplier');
    if (priceWrap) {
      priceWrap.classList.toggle('hidden', !(copyGoods && copyGoods.checked));
    }
    if (coeffRow) {
      coeffRow.classList.toggle('show', isSupplierPrice);
    }
    if (goodsHint) {
      if (!copyGoods || !copyGoods.checked) {
        goodsHint.textContent = '未勾选时将不复制商品数据';
      } else if (priceType && priceType.value === 'supplier') {
        const coeff = (priceCoeff && priceCoeff.value) || '1.2';
        goodsHint.textContent = `复制商品数据，新价格 = 供应商价格 × ${coeff}`;
      } else {
        goodsHint.textContent = '复制商品数据，价格沿用渠道商城的商品价格';
      }
    }

    const pushHint = document.getElementById('new-app-push-hint');
    const pushSpecifyWrap = document.getElementById('new-app-push-specify-wrap');
    const pushChannel = document.querySelector('input[name="new-app-push-channel"]:checked');
    const checkedChannelCount = getCheckedPushChannelCount();

    if (pushSpecifyWrap) {
      pushSpecifyWrap.classList.toggle('hidden', !(pushChannel && pushChannel.value === 'specify'));
    }
    if (pushHint) {
      if (!pushChannel) {
        pushHint.textContent = '请选择全部渠道或指定渠道';
      } else if (pushChannel.value === 'all') {
        pushHint.textContent = '将推送到全部渠道商城';
      } else if (checkedChannelCount === 0) {
        pushHint.textContent = '请至少选择一个渠道';
      } else {
        pushHint.textContent = `已选择 ${checkedChannelCount} 个渠道`;
      }
    }

    const confirmBtn = document.getElementById('btn-new-app-confirm-push');
    if (confirmBtn) {
      const canPush =
        pushChannel &&
        (pushChannel.value === 'all' || (pushChannel.value === 'specify' && checkedChannelCount > 0));
      confirmBtn.disabled = !canPush;
    }

    if (newAppPreviewMode) updateNewAppPreviewUI();
  }

  /**
   * 打开新建应用弹窗
   */
  function openNewAppModal() {
    const modal = document.getElementById('modal-new-app');
    const nameInput = document.getElementById('new-app-name');
    const mallSelect = document.getElementById('new-app-channel-mall');
    const channelSearch = document.getElementById('new-app-channel-search');
    const terminalGroup = document.getElementById('new-app-terminal-group');
    const multiHintGroup = document.getElementById('new-app-multi-hint-group');
    const modalTitle = modal ? modal.querySelector('.modal-header h2') : null;
    if (!modal || !nameInput || !mallSelect) return;

    const isMulti = currentMainTab === 'multi-apps';
    if (modalTitle) modalTitle.textContent = isMulti ? '新建多端应用' : '新建单端应用';
    if (terminalGroup) terminalGroup.classList.toggle('hidden', isMulti);
    if (multiHintGroup) multiHintGroup.classList.toggle('hidden', !isMulti);

    setNewAppPreviewMode(false);
    newAppPreviewPageId = 'home';

    mallSelect.innerHTML = (MOCK_CHANNEL_MALLS || [])
      .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`)
      .join('');

    mallSelect.selectedIndex = 0;
    syncNewAppNameFromMall();

    document.querySelectorAll('input[name="new-app-terminal"]').forEach((el) => {
      el.checked = el.value === 'mp';
    });

    document.querySelectorAll('input[name="new-app-copy-pages"]').forEach((el) => {
      el.checked = el.value === 'specify';
    });
    renderNewAppPagesList();

    const copyGoods = document.getElementById('new-app-copy-goods');
    if (copyGoods) copyGoods.checked = true;
    document.querySelectorAll('input[name="new-app-price-type"]').forEach((el) => {
      el.checked = el.value === 'mall';
    });
    const priceCoeff = document.getElementById('new-app-price-coeff');
    if (priceCoeff) priceCoeff.value = '1.2';
    document.querySelectorAll('input[name="new-app-push-channel"]').forEach((el) => {
      el.checked = el.value === 'specify';
    });
    if (channelSearch) channelSearch.value = '';
    renderNewAppChannelList('');

    updateNewAppFormUI();
    modal.classList.add('show');
  }

  /**
   * 读取新建应用的终端配置
   * @returns {{mode: 'single'|'multi', terminal: 'mp'|'pc'|null, terminals: Array<'mp'|'pc'>}}
   */
  function getNewAppTerminalConfig() {
    if (currentMainTab === 'multi-apps') {
      return { mode: 'multi', terminal: null, terminals: ['mp', 'pc'] };
    }
    const checked = document.querySelector('input[name="new-app-terminal"]:checked');
    const terminal = checked && checked.value === 'pc' ? 'pc' : 'mp';
    return { mode: 'single', terminal, terminals: [terminal] };
  }

  /**
   * 保存新建应用草稿（演示）
   */
  function saveNewAppDraft() {
    const name = (document.getElementById('new-app-name')?.value || '').trim();
    if (!name) {
      alert('请输入应用名称');
      return;
    }
    const cfg = getNewAppTerminalConfig();
    if (cfg.mode === 'single' && !cfg.terminal) {
      alert('请选择终端类型');
      return;
    }
    const tip =
      cfg.mode === 'multi'
        ? '演示：多端应用「' + name + '」已保存为草稿（覆盖小程序/H5 + PC）。'
        : '演示：单端应用「' + name + '」已保存为草稿（终端：' + getAppTerminalLabel(cfg.terminal) + '）。';
    alert(tip);
    closeModal('modal-new-app');
    setNewAppPreviewMode(false);
    const target = cfg.mode === 'multi' ? 'multi-apps' : 'apps';
    switchMainTab(target);
  }

  /**
   * 确认推送新建应用（演示）
   */
  function confirmNewAppPush() {
    const name = (document.getElementById('new-app-name')?.value || '').trim();
    if (!name) {
      alert('请输入应用名称');
      return;
    }
    const pushChannel = document.querySelector('input[name="new-app-push-channel"]:checked');
    if (!pushChannel) return;
    const cfg = getNewAppTerminalConfig();
    if (cfg.mode === 'single' && !cfg.terminal) {
      alert('请选择终端类型');
      return;
    }
    const tip =
      cfg.mode === 'multi'
        ? '演示：多端应用「' + name + '」已确认推送（覆盖小程序/H5 + PC）。'
        : '演示：单端应用「' + name + '」已确认推送（终端：' + getAppTerminalLabel(cfg.terminal) + '）。';
    alert(tip);
    closeModal('modal-new-app');
    setNewAppPreviewMode(false);
    const target = cfg.mode === 'multi' ? 'multi-apps' : 'apps';
    switchMainTab(target);
  }

  /**
   * 进入应用预览模式
   */
  function previewNewApp() {
    setNewAppPreviewMode(true);
  }

  /**
   * 关闭应用预览模式
   */
  function closeNewAppPreview() {
    setNewAppPreviewMode(false);
  }

  /**
   * 选择「新建应用」后打开新建应用弹窗
   */
  function onSelectCreateApp() {
    closeModal('modal-select-create-type');
    openNewAppModal();
  }

  /**
   * 打开新建模板弹窗
   */
  function openNewTemplateModal() {
    const modal = document.getElementById('modal-new-template');
    const copyWrap = document.getElementById('copy-source-wrap');
    const copySelect = document.getElementById('copy-template-select');
    const nameInput = document.getElementById('template-name');
    if (!modal || !copyWrap || !copySelect || !nameInput) return;

    nameInput.value = '';
    copyWrap.classList.add('hidden');
    document.querySelectorAll('input[name="create-type"]').forEach((radio) => {
      radio.checked = radio.value === 'blank';
    });
    const defaultTerminal = currentTemplateTerminal === 'pc' ? 'pc' : 'mp';
    document.querySelectorAll('input[name="new-template-terminal"]').forEach((radio) => {
      radio.checked = radio.value === defaultTerminal;
    });

    function refreshCopyOptions() {
      const terminalRadio = document.querySelector('input[name="new-template-terminal"]:checked');
      const terminal = terminalRadio && terminalRadio.value === 'pc' ? 'pc' : 'mp';
      const source = MOCK_TEMPLATES.filter((t) => (t.terminal || 'mp') === terminal);
      copySelect.innerHTML = source.length
        ? source.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')
        : '<option value="">暂无同终端模板可复制</option>';
    }
    refreshCopyOptions();

    document.querySelectorAll('input[name="create-type"]').forEach((radio) => {
      radio.onchange = function () {
        copyWrap.classList.toggle('hidden', this.value !== 'copy');
      };
    });
    document.querySelectorAll('input[name="new-template-terminal"]').forEach((radio) => {
      radio.onchange = refreshCopyOptions;
    });

    modal.classList.add('show');
  }

  /**
   * 确认新建模板（演示：跳转到编辑器或仅提示）
   */
  function confirmNewTemplate() {
    const type = document.querySelector('input[name="create-type"]:checked').value;
    const terminalRadio = document.querySelector('input[name="new-template-terminal"]:checked');
    if (!terminalRadio) {
      alert('请选择终端类型');
      return;
    }
    const terminal = terminalRadio.value === 'pc' ? 'pc' : 'mp';
    const terminalLabel = terminal === 'pc' ? 'PC端' : '小程序/H5端';
    const nameInput = document.getElementById('template-name');
    const name = (nameInput && nameInput.value.trim()) || '未命名模板';
    closeModal('modal-new-template');
    if (type === 'copy') {
      const copySelect = document.getElementById('copy-template-select');
      const srcId = copySelect && copySelect.value;
      alert(
        '演示：将复制模板 ' +
          (srcId || '') +
          ' 并进入编辑。\n终端类型：' +
          terminalLabel +
          '\n新建模板名称：' +
          name
      );
    } else {
      alert('演示：从空白创建「' + terminalLabel + '」模板「' + name + '」并进入编辑器。');
    }
    openEditor('new');
  }

  /**
   * 打开发布前预览弹窗
   * @param {string} id - 模板 ID
   */
  function openPublishPreview(id) {
    currentFlowTemplateId = id;
    const modal = document.getElementById('modal-publish-preview');
    const tabs = modal.querySelectorAll('.preview-tab');
    const frame = document.getElementById('preview-frame');
    if (!modal || !frame) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', function () {
        tabs.forEach((t) => t.classList.remove('active'));
        this.classList.add('active');
        frame.classList.remove('pc', 'mobile');
        frame.classList.add(this.dataset.device);
      });
    });

    modal.classList.add('show');
  }

  /**
   * 确认发布（模拟）
   */
  function confirmPublish() {
    if (!currentFlowTemplateId) return;
    alert('演示：模板已发布。实际会更新状态为「已发布」并记录审计日志。');
    closeModal('modal-publish-preview');
    currentFlowTemplateId = null;
    applyFiltersAndRender();
  }

  /**
   * 打开推送弹窗（可预填模板）
   * @param {string} [templateId] - 可选，预选模板 ID
   */
  function openPushModal(templateId) {
    const modal = document.getElementById('modal-push');
    const templateSelect = document.getElementById('push-template-select');
    const brandList = document.getElementById('push-brand-list');
    if (!modal || !templateSelect || !brandList) return;

    templateSelect.innerHTML = MOCK_TEMPLATES
      .filter((t) => t.status === 'published' || t.status === 'pushed')
      .map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`)
      .join('');
    if (templateId) templateSelect.value = templateId;

    brandList.innerHTML = MOCK_BRANDS.map(
      (b) => `<label><input type="checkbox" value="${b.id}" /> ${escapeHtml(b.name)}</label>`
    ).join('');

    modal.classList.add('show');
  }

  /**
   * 确认推送（模拟）
   */
  function confirmPush() {
    const templateSelect = document.getElementById('push-template-select');
    const pushType = document.querySelector('input[name="push-type"]:checked').value;
    const checked = document.querySelectorAll('#push-brand-list input:checked');
    const names = Array.from(checked).map((c) => c.value);
    if (names.length === 0) {
      alert('请至少选择一个品牌方。');
      return;
    }
    const templateName = templateSelect.options[templateSelect.selectedIndex].text;
    alert('演示：已将「' + templateName + '」以「' + (pushType === 'template-data' ? '模板+数据' : '仅模板') + '」方式推送给 ' + names.length + ' 个品牌。');
    closeModal('modal-push');
  }

  /**
   * 解析逗号分隔的标签输入（支持中英文逗号）。
   * @param {string} raw 原始字符串
   * @returns {string[]}
   */
  function parseTagInput(raw) {
    return String(raw || '')
      .split(/[,，]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  /**
   * 读取标签芯片容器内已确认的标签名。
   * @param {HTMLElement | null} containerEl 芯片容器
   * @returns {string[]}
   */
  function getBatchChipValues(containerEl) {
    if (!containerEl) return [];
    return Array.from(containerEl.querySelectorAll('.batch-tag-chip[data-tag]'))
      .map(function (el) {
        return el.getAttribute('data-tag') || '';
      })
      .filter(Boolean);
  }

  /**
   * 清空标签芯片容器（保留内部输入框）。
   * @param {HTMLElement | null} containerEl 芯片容器
   * @returns {void}
   */
  function clearBatchChipContainer(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.batch-tag-chip').forEach(function (el) {
      el.remove();
    });
  }

  /**
   * 打开弹窗时记录的选中模板标签并集快照，用于与应用时列表做差（删/增）。
   * @type {string[]}
   */
  let batchTagInitialUnion = [];

  /**
   * 创建一枚标签芯片节点。
   * @param {string} text 标签文案
   * @param {'add' | 'remove'} variant 样式类型
   * @returns {HTMLSpanElement}
   */
  function createBatchChipElement(text, variant) {
    const span = document.createElement('span');
    const cls = variant === 'remove' ? 'remove' : 'add';
    span.className = 'batch-tag-chip batch-tag-chip--' + cls;
    span.setAttribute('data-tag', text);
    const label = document.createElement('span');
    label.className = 'batch-tag-chip-text';
    label.textContent = text;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'batch-tag-chip-remove';
    btn.setAttribute('aria-label', '移除');
    btn.textContent = '×';
    span.appendChild(label);
    span.appendChild(btn);
    return span;
  }

  /**
   * 向容器追加一枚标签（去重）。
   * @param {HTMLElement} container 芯片容器
   * @param {HTMLInputElement} input 内联输入框
   * @param {string} text 标签文案
   * @param {'add' | 'remove'} variant 样式类型
   * @returns {void}
   */
  function insertBatchChipIfNew(container, input, text, variant) {
    const t = String(text || '').trim();
    if (!t) return;
    const existing = getBatchChipValues(container);
    if (existing.includes(t)) return;
    const chip = createBatchChipElement(t, variant);
    container.insertBefore(chip, input);
  }

  /**
   * 绑定标签芯片输入：回车/逗号确认、退格删最后一枚、粘贴拆分。
   * @param {HTMLElement | null} container 芯片容器
   * @param {HTMLInputElement | null} input 内联输入框
   * @param {'add' | 'remove'} variant 样式类型
   * @returns {void}
   */
  function bindBatchTagChipField(container, input, variant) {
    if (!container || !input) return;

    container.addEventListener('click', function (e) {
      const btn = e.target.closest('.batch-tag-chip-remove');
      if (btn) {
        e.preventDefault();
        const chip = btn.closest('.batch-tag-chip');
        if (chip) chip.remove();
        return;
      }
      input.focus();
    });

    function commitCurrentInput() {
      const raw = input.value;
      const parts = parseTagInput(raw);
      if (parts.length === 0) {
        const one = raw.trim();
        if (one) insertBatchChipIfNew(container, input, one, variant);
      } else {
        parts.forEach(function (p) {
          insertBatchChipIfNew(container, input, p, variant);
        });
      }
      input.value = '';
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
        e.preventDefault();
        commitCurrentInput();
      } else if (e.key === 'Backspace' && !input.value) {
        const chips = container.querySelectorAll('.batch-tag-chip');
        if (chips.length) chips[chips.length - 1].remove();
      }
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      parseTagInput(text).forEach(function (p) {
        insertBatchChipIfNew(container, input, p, variant);
      });
    });
  }

  /**
   * 汇总当前勾选模板上的全部标签（并集）。
   * @returns {string[]}
   */
  function getUnionTagsForSelectedTemplates() {
    const set = new Set();
    const source = getActiveTemplateSource();
    getActiveSelectedTemplateIds().forEach(function (id) {
      const t = source.find(function (x) {
        return x.id === id;
      });
      if (!t || !Array.isArray(t.tags)) return;
      t.tags.forEach(function (tag) {
        set.add(tag);
      });
    });
    return Array.from(set).sort();
  }

  /**
   * 绑定批量标签弹窗：统一芯片区输入与删除。
   * @returns {void}
   */
  function bindBatchTagModal() {
    const unifiedC = document.getElementById('batch-unified-chips');
    const unifiedI = document.getElementById('batch-unified-input');
    bindBatchTagChipField(unifiedC, unifiedI, 'add');
  }

  /**
   * 对选中模板批量变更标签：当前列表相对打开弹窗时快照，少掉的删除、多出的新增。
   * @returns {{ templateCount: number, removedTotal: number, addedTotal: number }}
   */
  function applyBatchTagChangesToSelected() {
    const unifiedEl = document.getElementById('batch-unified-chips');
    const initialSet = new Set(batchTagInitialUnion);
    const currentSet = new Set(getBatchChipValues(unifiedEl));
    const removeNames = Array.from(initialSet).filter(function (tag) {
      return !currentSet.has(tag);
    });
    const toAdd = Array.from(currentSet).filter(function (tag) {
      return !initialSet.has(tag);
    });

    const removeSet = new Set(removeNames);
    let removedTotal = 0;
    let addedTotal = 0;

    const selectedIds = getActiveSelectedTemplateIds();
    const source = getActiveTemplateSource();
    selectedIds.forEach(function (tid) {
      const t = source.find(function (x) {
        return x.id === tid;
      });
      if (!t) return;
      if (!Array.isArray(t.tags)) t.tags = [];

      if (removeSet.size) {
        const before = t.tags.length;
        t.tags = t.tags.filter(function (tag) {
          return !removeSet.has(tag);
        });
        removedTotal += before - t.tags.length;
      }

      toAdd.forEach(function (tag) {
        if (!t.tags.includes(tag)) {
          t.tags.push(tag);
          addedTotal++;
        }
      });
    });

    return {
      templateCount: selectedIds.length,
      removedTotal: removedTotal,
      addedTotal: addedTotal,
    };
  }

  /**
   * 打开批量设置标签弹窗
   */
  function openBatchTagModal() {
    const modal = document.getElementById('modal-batch-tag');
    const countEl = document.getElementById('batch-count');
    if (!modal || !countEl) return;
    const selectedIds = getActiveSelectedTemplateIds();
    countEl.textContent = selectedIds.length;
    if (selectedIds.length === 0) {
      alert('请先勾选要操作的模板。');
      return;
    }
    const unifiedWrap = document.getElementById('batch-unified-chips');
    const unifiedInput = document.getElementById('batch-unified-input');
    if (!unifiedWrap || !unifiedInput) return;
    clearBatchChipContainer(unifiedWrap);
    unifiedInput.value = '';

    batchTagInitialUnion = getUnionTagsForSelectedTemplates().slice();
    batchTagInitialUnion.forEach(function (tag) {
      insertBatchChipIfNew(unifiedWrap, unifiedInput, tag, 'add');
    });
    modal.classList.add('show');
  }

  /**
   * 确认批量设置标签（演示：直接修改内存中的 MOCK_TEMPLATES）
   */
  function confirmBatchTag() {
    if (getActiveSelectedTemplateIds().length === 0) {
      alert('请先勾选要操作的模板。');
      return;
    }
    const unifiedEl = document.getElementById('batch-unified-chips');
    const currentSet = new Set(getBatchChipValues(unifiedEl));
    const initialSet = new Set(batchTagInitialUnion);
    const hasRemove = Array.from(initialSet).some(function (tag) {
      return !currentSet.has(tag);
    });
    const hasAdd = Array.from(currentSet).some(function (tag) {
      return !initialSet.has(tag);
    });
    if (!hasAdd && !hasRemove) {
      alert('未检测到变更，请删除或添加标签后再应用。');
      return;
    }

    const result = applyBatchTagChangesToSelected();
    closeModal('modal-batch-tag');
    alert(
      '演示：已对 ' +
        result.templateCount +
        ' 个模板更新标签。' +
        (result.removedTotal > 0 ? ' 累计移除 ' + result.removedTotal + ' 处标签。' : '') +
        (result.addedTotal > 0 ? ' 累计新增 ' + result.addedTotal + ' 处标签。' : '')
    );
    applyFiltersAndRender();
  }

  /**
   * 取消发布模板（已发布 → 草稿）
   * @param {string} id - 模板 ID
   */
  function onUnpublishTemplate(id) {
    const t = findTemplateById(id);
    if (!t) return;
    if (t.status !== 'published' && t.status !== 'pushed') return;
    if (!confirm('取消发布后模板将变为草稿，可继续编辑。是否继续？')) return;
    t.status = 'draft';
    alert('演示：已取消发布模板「' + t.name + '」。');
    applyFiltersAndRender();
  }

  /**
   * 取消发布 PC 模板（已发布 → 草稿）
   * @param {string} id - PC 模板 ID
   */
  function onUnpublishPcTemplate(id) {
    onUnpublishTemplate(id);
  }

  /**
   * 删除模板（仅草稿可删）
   * @param {string} id - 模板 ID
   */
  function onDeleteTemplate(id) {
    const t = findTemplateById(id);
    if (!t) return;
    if (t.status !== 'draft') {
      alert('已发布模板不可删除，请先取消发布。');
      return;
    }
    if (!confirm('确认删除模板「' + t.name + '」？（演示中不会真正删除）')) return;
    alert('演示：已删除模板「' + t.name + '」。');
    applyFiltersAndRender();
  }

  /**
   * 删除 PC 模板（仅草稿可删）
   * @param {string} id - PC 模板 ID
   */
  function onDeletePcTemplate(id) {
    onDeleteTemplate(id);
  }

  /** 分类页模板 value -> 显示名称（用于编辑器标题） */
  const CATEGORY_TEMPLATE_NAMES = {
    level3: '三级分类页',
    level2: '二级分类页',
    'level2-list': '二级分类+商品列表页',
    'level1-tab': '一级分类+商品分类页（横向 Tab）',
    'level1-list': '一级分类+商品分类页（直接列表）',
    'level1-list-b': '一级分类+商品分类页（直接列表样式二）',
  };

  /**
   * 打开编辑器（演示：新开页或内嵌占位）
   * @param {string} id - 模板 ID 或 'new'
   * @param {Object} [options] - 可选，{ pageType, categoryTemplate, pageName }
   */
  function openEditor(id, options) {
    let name;
    if (id === 'new' && options && options.pageType === 'category' && options.categoryTemplate) {
      name = options.pageName || ('新建分类页 - ' + (CATEGORY_TEMPLATE_NAMES[options.categoryTemplate] || options.categoryTemplate));
    } else {
      name =
        id === 'new'
          ? '新建模板'
          : (findTemplateById(id) || {}).name || id;
    }
    const url = new URL('editor.html', window.location.href);
    url.searchParams.set('id', id);
    url.searchParams.set('name', name);
    if (options && options.categoryTemplate) {
      url.searchParams.set('categoryTemplate', options.categoryTemplate);
    }
    window.open(url.toString(), 'editor', 'width=1200,height=800,scrollbars=yes');
  }

  /**
   * 打开「分类页选择模板」弹窗
   */
  function openCategoryTemplateModal() {
    const modal = document.getElementById('modal-category-template');
    if (!modal) return;
    const first = document.querySelector('#category-template-list input[name="category-template"]');
    if (first) first.checked = true;
    modal.classList.add('show');
  }

  /**
   * 确认所选分类页模板并进入编辑器
   */
  function confirmCategoryTemplate() {
    const radio = document.querySelector('#modal-category-template input[name="category-template"]:checked');
    if (!radio) {
      alert('请先选择一种分类页模板。');
      return;
    }
    const modal = document.getElementById('modal-category-template');
    if (modal) modal.classList.remove('show');
    const value = radio.value;
    const pageName = '新建分类页 - ' + (CATEGORY_TEMPLATE_NAMES[value] || value);
    openEditor('new', { pageType: 'category', categoryTemplate: value, pageName });
  }

  /**
   * 渲染某个模板下的页面列表，按当前选中的页面类型过滤
   * @param {string} templateId - 模板 ID
   */
  function renderTemplatePages(templateId) {
    const tbody = document.getElementById('template-pages-tbody');
    if (!tbody) return;
    const allPages = (MOCK_TEMPLATE_PAGES && MOCK_TEMPLATE_PAGES[templateId]) || [];
    const pages =
      currentTemplatePageType &&
      ['home', 'category', 'activity', 'mine', 'product-detail'].includes(currentTemplatePageType)
        ? allPages.filter((p) => p.type === currentTemplatePageType)
        : allPages;
    tbody.innerHTML = pages
      .map(
        (p, index) => `
        <tr data-id="${p.id}">
          <td>
            ${p.status === 'published' && index === 0 ? '<span class="page-ribbon">使用中</span>' : ''}
            ${escapeHtml(p.title)}
          </td>
          <td>${
            p.status === 'published'
              ? '<span class="page-status page-status-active">使用中</span>'
              : '<span class="page-status page-status-draft">草稿</span>'
          }</td>
          <td>${escapeHtml(p.updatedAt)}</td>
          <td>
            <button type="button" class="btn btn-sm btn-ghost btn-page-publish" data-id="${p.id}">投放</button>
            <button type="button" class="btn btn-sm btn-ghost btn-page-edit" data-id="${p.id}">编辑</button>
            <button type="button" class="btn btn-sm btn-ghost btn-page-copy" data-id="${p.id}">复制</button>
            <button type="button" class="btn btn-sm btn-danger btn-page-delete" data-id="${p.id}">删除</button>
          </td>
        </tr>
      `
      )
      .join('');

    tbody.querySelectorAll('.btn-page-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pageId = btn.dataset.id;
        openEditor(pageId || 'new');
      });
    });

    tbody.querySelectorAll('.btn-page-publish').forEach((btn) => {
      btn.addEventListener('click', () => {
        alert('演示：页面投放上线。');
      });
    });
    tbody.querySelectorAll('.btn-page-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        alert('演示：复制当前页面，生成一个新的草稿页面。');
      });
    });
    tbody.querySelectorAll('.btn-page-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        alert('演示：删除页面（实际项目中可做软删并校验依赖）。');
      });
    });

    const pagination = document.getElementById('template-pages-pagination');
    if (pagination) {
      if (!pages.length) {
        pagination.innerHTML = '<span class="pagination-total">暂无页面</span>';
      } else {
        pagination.innerHTML = `
          <span class="pagination-total">共 ${pages.length} 条</span>
          <div class="pagination-pages">
            <button type="button" class="pagination-page-btn active">1</button>
          </div>
          <div class="pagination-size">
            <select>
              <option>10 条/页</option>
            </select>
          </div>
        `;
      }
    }
  }

  /**
   * 进入某个模板的页面管理中间页
   * @param {string} templateId - 模板 ID
   */
  function openTemplatePages(templateId) {
    const tpl = MOCK_TEMPLATES.find((t) => t.id === templateId);
    currentTemplateForPages = tpl || null;
    currentTemplatePageType = 'home';
    const titleEl = document.getElementById('template-pages-title');
    if (titleEl) {
      titleEl.textContent = tpl ? `页面管理 - ${tpl.name}` : '页面管理';
    }
    const currentLabel = document.getElementById('template-pages-current-label');
    if (currentLabel) currentLabel.textContent = '当前：首页';
    // 重置左侧菜单选中状态
    document
      .querySelectorAll('#template-pages-menu .template-pages-menu-item')
      .forEach((item) => item.classList.toggle('active', item.dataset.type === 'home'));

    // 切换可见页面：隐藏 Tab，仅展示 page-template-pages
    const tabsTemplates = document.getElementById('main-tabs-templates');
    const tabsApps = document.getElementById('main-tabs-apps');
    const mainTop = document.getElementById('main-top');
    if (tabsTemplates) tabsTemplates.style.display = 'none';
    if (tabsApps) tabsApps.style.display = 'none';
    if (mainTop) mainTop.style.display = 'none';
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const section = document.getElementById('page-template-pages');
    if (section) section.classList.add('active');
    renderTemplatePages(templateId);
  }

  /**
   * 关闭指定弹窗
   * @param {string} modalId - 弹窗元素 id
   */
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  }

  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 侧边栏：模板中心 / 应用中心
  document.querySelectorAll('.sidebar-menu-item[data-center]').forEach((el) => {
    el.addEventListener('click', function () {
      switchMainCenter(this.dataset.center);
    });
  });

  // 模板中心终端 Tab：全部 / 小程序/H5 / PC
  document.querySelectorAll('#main-tabs-templates .main-tab[data-terminal]').forEach((el) => {
    el.addEventListener('click', function () {
      switchTemplateTerminalTab(this.getAttribute('data-terminal') || '');
    });
  });

  // 应用中心 Tab：单端 / 多端
  document.querySelectorAll('#main-tabs-apps .main-tab[data-page]').forEach((el) => {
    el.addEventListener('click', function () {
      switchMainTab(this.dataset.page);
    });
  });

  // 搭建中心折叠/展开
  document.querySelectorAll('.sidebar-menu-parent[data-menu-toggle]').forEach((el) => {
    el.addEventListener('click', function () {
      const key = this.dataset.menuToggle;
      const sub = document.getElementById('menu-' + key);
      const collapsed = this.classList.toggle('is-collapsed');
      if (sub) sub.classList.toggle('is-collapsed', collapsed);
    });
  });

  // 页面管理返回按钮
  document.getElementById('btn-back-to-templates')?.addEventListener('click', () => {
    switchMainCenter('templates');
  });

  // 页面管理左侧类型切换
  document.querySelectorAll('#template-pages-menu .template-pages-menu-item').forEach((btn) => {
    btn.addEventListener('click', function () {
      const type = this.dataset.type;
      if (!type || type === currentTemplatePageType) return;
      currentTemplatePageType = type;
      // 更新菜单选中样式
      document
        .querySelectorAll('#template-pages-menu .template-pages-menu-item')
        .forEach((item) => item.classList.toggle('active', item === this));
      const label = document.getElementById('template-pages-current-label');
      if (label) {
        const map = {
          home: '首页',
          category: '分类页',
          activity: '活动页',
          mine: '我的页面',
          'product-detail': '商品详情页',
        };
        label.textContent = '当前：' + (map[type] || '');
      }
      if (currentTemplateForPages) {
        renderTemplatePages(currentTemplateForPages.id);
      }
    });
  });

  // 全选
  const checkAll = document.getElementById('check-all');
  if (checkAll) {
    checkAll.addEventListener('change', function () {
      document.querySelectorAll('#template-tbody .row-check').forEach((c) => {
        c.checked = this.checked;
      });
      onRowCheckChange();
    });
  }

  const checkAllPc = document.getElementById('check-all-pc');
  if (checkAllPc) {
    checkAllPc.addEventListener('change', function () {
      document.querySelectorAll('#pc-template-tbody .row-check-pc').forEach((c) => {
        c.checked = this.checked;
      });
      onPcRowCheckChange();
    });
  }

  // 筛选
  document.getElementById('filter-status')?.addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-tag')?.addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-template-name')?.addEventListener('input', applyFiltersAndRender);
  document.getElementById('filter-terminal')?.addEventListener('change', onFilterTerminalChange);
  document.getElementById('filter-app-status')?.addEventListener('change', () => {
    if (currentMainTab === 'multi-apps') renderMultiAppList();
    else renderAppList();
  });
  document.getElementById('filter-app-name')?.addEventListener('input', () => {
    if (currentMainTab === 'multi-apps') renderMultiAppList();
    else renderAppList();
  });
  document.getElementById('filter-app-channel')?.addEventListener('change', () => {
    if (currentMainTab === 'multi-apps') renderMultiAppList();
    else renderAppList();
  });

  // 按钮
  document.getElementById('btn-new-template')?.addEventListener('click', openNewTemplateModal);
  document.getElementById('btn-new-app')?.addEventListener('click', openNewAppModal);
  document.getElementById('btn-create-type-template')?.addEventListener('click', onSelectCreateTemplate);
  document.getElementById('btn-create-type-app')?.addEventListener('click', onSelectCreateApp);
  document.getElementById('btn-new-app-preview')?.addEventListener('click', previewNewApp);
  document.getElementById('btn-new-app-close-preview')?.addEventListener('click', closeNewAppPreview);
  document.getElementById('btn-new-app-save-draft')?.addEventListener('click', saveNewAppDraft);
  document.getElementById('btn-new-app-confirm-push')?.addEventListener('click', confirmNewAppPush);
  document.getElementById('btn-promote-app-confirm')?.addEventListener('click', submitPromoteApp);
  document.getElementById('promote-push-search')?.addEventListener('input', () => {
    renderPromotePushMallList();
    updatePromotePushChannelHint();
  });
  document.querySelectorAll('input[name="promote-push-channel"]').forEach((el) => {
    el.addEventListener('change', function () {
      const panel = document.getElementById('promote-push-channel-panel');
      if (panel) panel.classList.toggle('show', this.value === 'custom');
      if (this.value === 'custom') renderPromotePushMallList();
      updatePromotePushChannelHint();
    });
  });
  document.getElementById('btn-push-detail-preview')?.addEventListener('click', togglePushDetailPreview);
  document.getElementById('btn-push-detail-close-preview')?.addEventListener('click', () => setPushDetailPreviewMode(false));
  document.getElementById('app-dialog-ok')?.addEventListener('click', onAppDialogOk);
  document.getElementById('app-dialog-cancel')?.addEventListener('click', closeAppDialog);
  document.getElementById('app-dialog-close')?.addEventListener('click', closeAppDialog);
  document.querySelectorAll('#modal-promote-app .modal-close, #modal-promote-app .modal-cancel').forEach((btn) => {
    btn.addEventListener('click', closePromoteAppModal);
  });
  document.querySelectorAll('#modal-push-detail .modal-close, #modal-push-detail .modal-cancel').forEach((btn) => {
    btn.addEventListener('click', closePushDetailModal);
  });
  document.getElementById('new-app-channel-mall')?.addEventListener('change', function () {
    syncNewAppNameFromMall();
    updateNewAppFormUI();
  });
  document.getElementById('new-app-copy-goods')?.addEventListener('change', updateNewAppFormUI);
  document.getElementById('new-app-price-coeff')?.addEventListener('input', updateNewAppFormUI);
  document.getElementById('new-app-channel-search')?.addEventListener('input', function () {
    renderNewAppChannelList(this.value);
    updateNewAppFormUI();
  });
  document.querySelectorAll('input[name="new-app-copy-pages"]').forEach((el) => {
    el.addEventListener('change', updateNewAppFormUI);
  });
  document.querySelectorAll('input[name="new-app-price-type"]').forEach((el) => {
    el.addEventListener('change', updateNewAppFormUI);
  });
  document.querySelectorAll('input[name="new-app-push-channel"]').forEach((el) => {
    el.addEventListener('change', updateNewAppFormUI);
  });
  document.getElementById('btn-batch-tag')?.addEventListener('click', openBatchTagModal);
  document.getElementById('btn-confirm-new')?.addEventListener('click', confirmNewTemplate);
  document.getElementById('btn-confirm-publish')?.addEventListener('click', confirmPublish);
  document.getElementById('btn-confirm-push')?.addEventListener('click', confirmPush);
  document.getElementById('btn-confirm-batch-tag')?.addEventListener('click', confirmBatchTag);
  document.getElementById('btn-confirm-category-template')?.addEventListener('click', confirmCategoryTemplate);

  // 页面管理 - 新建页面（首页/海报/文章直接进编辑器，分类页先选模板）
  document.getElementById('btn-new-page')?.addEventListener('click', function () {
    if (currentTemplatePageType === 'category') {
      openCategoryTemplateModal();
    } else {
      openEditor('new');
    }
  });

  // 弹窗关闭
  document.querySelectorAll('.modal-close, .modal-cancel').forEach((btn) => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      if (modal) modal.classList.remove('show');
    });
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) closeModal(this.id);
    });
  });

  // 初始化
  bindBatchTagModal();
  renderAppChannelFilter();
  switchTemplateTerminalTab('');
  applyFiltersAndRender();
  renderAppList();
})();
