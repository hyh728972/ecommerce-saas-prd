/**
 * 商城搭建系统 - 原型演示逻辑
 * 负责页面切换、列表渲染、弹窗与模拟操作
 */

(function () {
  /** 当前要发布/推送的模板 ID（用于弹窗流程） */
  let currentFlowTemplateId = null;

  /** 模板列表当前页码与每页数量（前端分页） */
  let currentTemplatePage = 1;
  const TEMPLATE_PAGE_SIZE = 15;

  /** 当前筛选后的模板列表（分页基准） */
  let filteredTemplates = [];

  /** 模板列表搜索关键词（用于前端过滤） */
  let templateSearchKeyword = '';

  /** 模板中心当前终端 Tab：'' | mp | pc */
  let currentTemplateTerminal = '';

  /** 应用中心当前模式 Tab：single | multi */
  let currentAppMode = 'single';

  /** 应用中心状态筛选 */
  let appStatusFilter = '';

  /** 应用中心终端类型筛选：'' | mp | pc */
  let appTerminalFilter = '';

  /** 待发布应用（二次弹窗确认使用） */
  let pendingPublishAppId = '';

  /** 当前「使用模板」弹窗中的模板 ID */
  let usingTemplateId = '';

  /**
   * 获取已发布模板列表（包含 pushed）
   * @returns {Array}
   */
  function getPublishedTemplates() {
    return [...MOCK_TEMPLATES].filter(
      (t) => t.status === 'published' || t.status === 'pushed'
    );
  }

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
   * 更新模板列表勾选摘要
   */
  function updateTemplateSelectionSummary() {
    const summary = document.getElementById('template-selection-summary');
    if (summary) {
      summary.textContent = '已选择 ' + selectedTemplateIds.length + ' 个模板';
    }
  }

  /**
   * PC 端封面预览图（模板中心 / 我的应用共用）
   * @returns {string}
   */
  function getPcTemplatePreviewSrc() {
    return 'assets/pc-preview.png';
  }

  /**
   * 小程序封面预览图（模板中心 / 我的应用共用）
   * @returns {string}
   */
  function getTemplatePreviewSrc() {
    return 'assets/mp-preview.png';
  }

  /**
   * 终端类型角标 HTML
   * @param {string|string[]} terminal - mp | pc | multi | 数组
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
   * 模板是否包含商品数据
   * @param {Object} tpl - 模板数据
   * @returns {boolean}
   */
  function templateHasProducts(tpl) {
    return !!(tpl.hasProducts || (tpl.pushConfig && tpl.pushConfig.copyProducts));
  }

  /**
   * 获取模板推送/详情配置
   * @param {Object} tpl - 模板数据
   * @returns {{copyProducts: boolean, priceMode: string, priceCoeff: number, pageNames: string[]}}
   */
  function getTemplatePushConfig(tpl) {
    if (tpl.pushConfig) return tpl.pushConfig;
    const pages = (MOCK_TEMPLATE_PAGES && MOCK_TEMPLATE_PAGES[tpl.id]) || [];
    return {
      copyProducts: false,
      priceMode: 'default',
      priceCoeff: 1.2,
      pageNames: pages.length ? pages.map((p) => p.title) : ['首页'],
    };
  }

  /**
   * 当前商城是否存在上架商品（带数据模板使用前须先下架）
   * @returns {boolean}
   */
  function mallHasOnShelfProducts() {
    return !!(CURRENT_MALL_PRODUCT_STATUS && CURRENT_MALL_PRODUCT_STATUS.hasOnShelfProducts);
  }

  /**
   * 刷新「使用模板」弹窗上架商品校验提示
   */
  function updateUseTemplateDataHint() {
    const warn = document.getElementById('use-template-off-shelf-warn');
    const submitBtn = document.getElementById('btn-submit-use-template');
    if (!warn) return;
    if (mallHasOnShelfProducts()) {
      const n = CURRENT_MALL_PRODUCT_STATUS.onShelfCount || 0;
      warn.textContent = n > 0
        ? `检测到现有商城中有 ${n} 个商品仍在上架，请先下架商品，才能使用带数据的模板。`
        : '检测到有上架商品，请先下架商品，才能使用带数据的模板。';
      warn.hidden = false;
      if (submitBtn) submitBtn.disabled = true;
    } else {
      warn.textContent = '';
      warn.hidden = true;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  /**
   * 使用模板：带商品数据弹窗确认，否则进入编辑页
   * @param {string} id - 模板 ID
   */
  function useTemplate(id) {
    const tpl = MOCK_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    if (templateHasProducts(tpl)) {
      openUseTemplateModal(id);
    } else {
      openEditor(id);
    }
  }

  /**
   * 打开使用模板弹窗
   * @param {string} id - 模板 ID
   */
  function openUseTemplateModal(id) {
    const tpl = MOCK_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    usingTemplateId = id;
    const nameEl = document.getElementById('use-template-app-name');
    if (nameEl) nameEl.value = tpl.name;
    updateUseTemplateDataHint();
    document.getElementById('modal-use-template')?.classList.add('show');
  }

  /**
   * 预览模板
   * @param {string} id - 模板 ID
   */
  function previewTemplate(id) {
    const tpl = MOCK_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      alert('演示：预览模板「' + tpl.name + '」，实际可在新窗口打开预览 URL。');
    }
  }

  /**
   * 关闭使用模板弹窗
   */
  function closeUseTemplateModal() {
    usingTemplateId = '';
    closeModal('modal-use-template');
  }

  /**
   * 确认使用模板
   */
  function submitUseTemplate() {
    if (mallHasOnShelfProducts()) return;
    const tpl = MOCK_TEMPLATES.find((t) => t.id === usingTemplateId);
    if (!tpl) return;
    addMallFromTemplate(usingTemplateId, 'save');
    closeUseTemplateModal();
    alert(`演示：已使用模板「${tpl.name}」，并已加入到我的应用列表。`);
    document.querySelector('.nav-item[data-page="mall-list"]')?.click();
  }

  /**
   * 打开模板详情弹窗
   * @param {string} id - 模板 ID
   */
  function openTemplateDetailModal(id) {
    const tpl = MOCK_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    const config = getTemplatePushConfig(tpl);
    const nameInput = document.getElementById('template-detail-name');
    if (nameInput) nameInput.value = tpl.name;
    const pageList = document.getElementById('template-detail-pages');
    if (pageList) {
      pageList.innerHTML = (config.pageNames || [])
        .map((name) => `<span class="template-detail-page-tag">${escapeHtml(name)}</span>`)
        .join('');
    }
    const productEl = document.getElementById('template-detail-product');
    if (productEl) {
      const items = [
        `<div class="template-detail-info-row"><span class="label">是否包含商品数据</span><span>${config.copyProducts ? '是' : '否'}</span></div>`,
      ];
      if (config.copyProducts) {
        const priceText =
          config.priceMode === 'supplier'
            ? `商品供应商价格 × ${config.priceCoeff || 1.2}`
            : '该商城的商品价格';
        items.push(
          `<div class="template-detail-info-row"><span class="label">商品价格</span><span>${escapeHtml(priceText)}</span></div>`
        );
      }
      productEl.innerHTML = items.join('');
    }
    document.getElementById('modal-template-detail')?.classList.add('show');
  }

  /**
   * 封面悬浮预览按钮 HTML
   * @param {string} className - 额外 class（如 btn-preview-template）
   * @param {string} attrs - data 属性等
   * @returns {string}
   */
  function getCoverPreviewBtnHtml(className, attrs) {
    return `<div class="template-card-preview-mask">
      <button type="button" class="template-preview-btn ${className}" ${attrs}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>预览</span>
      </button>
    </div>`;
  }

  /**
   * 渲染模板列表卡片（接收当前页数据）
   * @param {Array} list - 当前页模板列表
   */
  function renderTemplateList(list) {
    const container = document.getElementById('template-tbody');
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<div class="template-empty">暂无符合条件的模板</div>';
      return;
    }
    container.innerHTML = list
      .map((t) => {
        const isPc = (t.terminal || 'mp') === 'pc';
        const productBadge = templateHasProducts(t)
          ? '<span class="template-card-product-badge">带商品数据</span>'
          : '';
        const previewBtn = getCoverPreviewBtnHtml('btn-preview-template', `data-id="${t.id}"`);
        const coverSrc = isPc ? getPcTemplatePreviewSrc() : getTemplatePreviewSrc();
        const coverHtml = `<div class="template-card-cover">
              ${productBadge}
              <img class="template-card-cover-image" src="${coverSrc}" alt="${escapeHtml(t.name)} 预览图" />
              ${getTerminalBadgeHtml(isPc ? 'pc' : 'mp')}
              ${previewBtn}
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
            <button type="button" class="btn btn-sm btn-primary btn-use-template" data-id="${t.id}">使用</button>
            ${templateHasProducts(t) ? `<button type="button" class="btn btn-sm btn-ghost btn-template-detail" data-id="${t.id}">详情</button>` : ''}
          </div>
        </div>
      </article>
    `;
      })
      .join('');

    container.querySelectorAll('.btn-preview-template').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        previewTemplate(el.dataset.id);
      });
    });
    container.querySelectorAll('.btn-use-template').forEach((el) => {
      el.addEventListener('click', () => useTemplate(el.dataset.id));
    });
    container.querySelectorAll('.btn-template-detail').forEach((el) => {
      el.addEventListener('click', () => openTemplateDetailModal(el.dataset.id));
    });
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
   * 应用筛选并重绘列表（仅展示已发布模板）
   */
  function applyFiltersAndRender() {
    const tag = document.getElementById('filter-tag')?.value || '';
    const terminal = currentTemplateTerminal || document.getElementById('filter-terminal')?.value || '';
    let list = getPublishedTemplates();
    if (tag) {
      list = list.filter((t) => (t.tags || []).includes(tag));
    }
    if (terminal) {
      list = list.filter((t) => (t.terminal || 'mp') === terminal);
    }
    if (templateSearchKeyword && templateSearchKeyword.trim()) {
      const kw = templateSearchKeyword.trim().toLowerCase();
      list = list.filter((t) => {
        const name = (t.name || '').toLowerCase();
        return name.includes(kw);
      });
    }
    list = list.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    filteredTemplates = list;
    currentTemplatePage = 1;
    renderTemplatePage();
  }

  /**
   * 读取模板搜索关键词并应用筛选
   */
  function applyTemplateSearch() {
    const input = document.getElementById('template-search-input');
    templateSearchKeyword = (input && input.value) || '';
    applyFiltersAndRender();
  }

  /**
   * 重置模板列表筛选条件与搜索
   */
  function resetTemplateFilters() {
    const tagEl = document.getElementById('filter-tag');
    const terminalEl = document.getElementById('filter-terminal');
    const searchInput = document.getElementById('template-search-input');
    if (tagEl) tagEl.value = '';
    if (terminalEl) terminalEl.value = '';
    if (searchInput) searchInput.value = '';
    templateSearchKeyword = '';
    currentTemplateTerminal = '';
    syncTemplateTabs();
    applyFiltersAndRender();
  }

  /**
   * 同步模板中心 Tab 选中态
   */
  function syncTemplateTabs() {
    document.querySelectorAll('#main-tabs-templates .main-tab[data-terminal]').forEach((tab) => {
      const val = tab.getAttribute('data-terminal') || '';
      tab.classList.toggle('active', val === currentTemplateTerminal);
    });
    const terminalEl = document.getElementById('filter-terminal');
    if (terminalEl) terminalEl.value = currentTemplateTerminal;
  }

  /**
   * 切换模板中心终端 Tab
   * @param {string} terminal - '' | mp | pc
   */
  function switchTemplateTerminalTab(terminal) {
    currentTemplateTerminal = terminal || '';
    syncTemplateTabs();
    applyFiltersAndRender();
  }

  /**
   * 搜索栏「终端类型」变更：与 Tab 同步后筛选
   */
  function onFilterTerminalChange() {
    const sel = document.getElementById('filter-terminal');
    currentTemplateTerminal = sel ? sel.value || '' : '';
    syncTemplateTabs();
    applyFiltersAndRender();
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
    copySelect.innerHTML = MOCK_TEMPLATES.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

    document.querySelectorAll('input[name="create-type"]').forEach((radio) => {
      radio.addEventListener('change', function () {
        copyWrap.classList.toggle('hidden', this.value !== 'copy');
      });
    });

    modal.classList.add('show');
  }

  /**
   * 确认新建模板（演示：跳转到编辑器或仅提示）
   */
  function confirmNewTemplate() {
    const type = document.querySelector('input[name="create-type"]:checked').value;
    const nameInput = document.getElementById('template-name');
    const name = (nameInput && nameInput.value.trim()) || '未命名模板';
    closeModal('modal-new-template');
    if (type === 'copy') {
      const copySelect = document.getElementById('copy-template-select');
      const srcId = copySelect && copySelect.value;
      alert('演示：将复制模板 ' + (srcId || '') + ' 并进入编辑。\n新建模板名称：' + name);
    } else {
      alert('演示：从空白创建模板「' + name + '」并进入编辑器。');
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
    renderPushRecord();
  }

  // 批量标签与模板删除相关逻辑已移除

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
      name = id === 'new' ? '新建模板' : (MOCK_TEMPLATES.find((t) => t.id === id) || {}).name || id;
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

    // 切换可见页面：隐藏所有 .page，仅展示 page-template-pages
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

  /**
   * 渲染推送记录表
   */
  function renderPushRecord() {
    const tbody = document.getElementById('push-record-tbody');
    if (!tbody) return;
    tbody.innerHTML = MOCK_PUSH_RECORDS.map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.time)}</td>
          <td>${escapeHtml(r.templateName)}</td>
          <td>${escapeHtml(r.brands)}</td>
          <td>${escapeHtml(r.pushType)}</td>
          <td>${escapeHtml(r.operator)}</td>
          <td>${escapeHtml(r.brandStatus)}</td>
        </tr>`
    ).join('');
  }

  /** 商城列表搜索关键词（用于前端过滤） */
  let mallListSearchKeyword = '';

  /**
   * 获取当前展示的商城列表（按模式 / 终端 / 状态 / 关键词过滤）
   * @returns {Array}
   */
  function getFilteredMalls() {
    const list = (typeof MOCK_MALLS !== 'undefined' && MOCK_MALLS) || [];
    return list.filter((m) => {
      const mode = m.mode || 'single';
      if (mode !== currentAppMode) return false;
      if (appStatusFilter && m.status !== appStatusFilter) return false;
      if (appTerminalFilter && mode === 'single') {
        if ((m.terminal || 'mp') !== appTerminalFilter) return false;
      }
      if (!mallListSearchKeyword.trim()) return true;
      const kw = mallListSearchKeyword.trim().toLowerCase();
      return (
        (m.name && m.name.toLowerCase().includes(kw)) ||
        (m.brandName && m.brandName.toLowerCase().includes(kw))
      );
    });
  }

  /**
   * 解析应用终端展示信息
   * @param {Object} app - 应用数据
   * @param {Object} [tpl] - 关联模板
   * @returns {{isPc: boolean, badgeTerminal: string}}
   */
  function resolveAppTerminalInfo(app, tpl) {
    if ((app.mode || 'single') === 'multi') {
      return { isPc: false, badgeTerminal: 'multi' };
    }
    const terminal = app.terminal || (tpl && tpl.terminal) || 'mp';
    return { isPc: terminal === 'pc', badgeTerminal: terminal === 'pc' ? 'pc' : 'mp' };
  }

  /**
   * 渲染商城列表（支持搜索过滤）
   */
  function renderMallList() {
    const container = document.getElementById('app-tbody');
    const paginationEl = document.getElementById('mall-list-pagination');
    if (!container) return;
    const list = getFilteredMalls();
    if (!list.length) {
      container.innerHTML = '<div class="template-empty">暂无应用</div>';
      if (paginationEl) paginationEl.innerHTML = '<span class="pagination-total">暂无数据</span>';
      return;
    }

    container.innerHTML = list
      .map((app) => {
        const tpl = MOCK_TEMPLATES.find((t) => t.id === app.templateId);
        const { isPc, badgeTerminal } = resolveAppTerminalInfo(app, tpl);
        const statusText = app.status === 'published' ? '已发布' : '草稿';
        const statusClass = app.status === 'published' ? 'status-published' : 'status-draft';
        const tagsHtml =
          (tpl && Array.isArray(tpl.tags) && tpl.tags.length
            ? tpl.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')
            : '') || '<span>未设置标签</span>';
        const previewBtn = getCoverPreviewBtnHtml(
          'btn-preview-app',
          `data-template-id="${escapeHtml(app.templateId || '')}"`
        );
        const coverImgSrc = isPc ? getPcTemplatePreviewSrc() : getTemplatePreviewSrc();
        const coverHtml = `<div class="template-card-cover">
              <img class="template-card-cover-image" src="${coverImgSrc}" alt="${escapeHtml(app.name)} 预览图" />
              <span class="template-card-status status-tag ${statusClass}">${statusText}</span>
              ${getTerminalBadgeHtml(badgeTerminal)}
              ${previewBtn}
            </div>`;
        return `
          <article class="template-card ${isPc ? 'template-card--pc' : 'template-card--mp'}" data-id="${app.id}">
            ${coverHtml}
            <div class="template-card-body">
              <div class="template-card-header">
                <h3 class="template-card-title">${escapeHtml(app.name)}</h3>
              </div>
              <div class="tags template-card-tags">${tagsHtml}</div>
              <div class="template-card-meta">
                <span>创建时间：${escapeHtml(app.createdAt)}</span>
              </div>
              <div class="template-card-actions">
                <button type="button" class="btn btn-sm btn-ghost btn-edit-app" data-template-id="${escapeHtml(
                  app.templateId || ''
                )}">编辑</button>
                ${
                  app.status === 'draft'
                    ? `<button
                        type="button"
                        class="btn btn-sm btn-ghost btn-delete-app"
                        data-app-id="${escapeHtml(app.id)}"
                      >
                        删除
                      </button>`
                    : ''
                }
                <button
                  type="button"
                  class="btn btn-sm ${app.status === 'published' ? 'btn-ghost' : 'btn-primary'} btn-publish-app"
                  data-app-id="${escapeHtml(app.id)}"
                  ${app.status === 'published' ? 'disabled' : ''}
                >
                  ${app.status === 'published' ? '已发布' : '发布'}
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    container.querySelectorAll('.btn-preview-app').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tid = btn.dataset.templateId;
        const tpl = MOCK_TEMPLATES.find((t) => t.id === tid);
        alert('演示：预览模板「' + (tpl ? tpl.name : tid) + '」。');
      });
    });
    container.querySelectorAll('.btn-edit-app').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tid = btn.dataset.templateId;
        if (tid) openEditor(tid);
      });
    });

    container.querySelectorAll('.btn-publish-app').forEach((btn) => {
      btn.addEventListener('click', function () {
        const appId = btn.dataset.appId;
        if (!appId) return;
        openPublishConfirmStep1(appId);
      });
    });
    container.querySelectorAll('.btn-delete-app').forEach((btn) => {
      btn.addEventListener('click', function () {
        const appId = btn.dataset.appId;
        if (!appId) return;
        confirmDeleteDraftMall(appId);
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
   * 发布应用：确保任意时刻只有一个已发布应用
   * @param {string} appId
   */
  function publishApp(appId) {
    if (!appId) return;
    const target = MOCK_MALLS.find((m) => m.id === appId);
    if (!target) return;
    MOCK_MALLS.forEach((m) => {
      if (m.id !== appId && m.status === 'published') m.status = 'draft';
    });
    target.status = 'published';
    renderMallList();
  }

  /**
   * 删除草稿应用（含确认弹窗）
   * @param {string} appId
   */
  function confirmDeleteDraftMall(appId) {
    if (!appId || typeof MOCK_MALLS === 'undefined') return;
    const targetIndex = MOCK_MALLS.findIndex((m) => m.id === appId);
    if (targetIndex < 0) return;
    const target = MOCK_MALLS[targetIndex];
    if (!target || target.status !== 'draft') return;
    const shouldDelete = window.confirm(`确定删除草稿应用「${target.name || appId}」吗？删除后不可恢复。`);
    if (!shouldDelete) return;
    MOCK_MALLS.splice(targetIndex, 1);
    renderMallList();
  }

  /**
   * 打开发布确认（第一步）
   * @param {string} appId
   */
  function openPublishConfirmStep1(appId) {
    pendingPublishAppId = appId;
    const modal = document.getElementById('modal-publish-app-step1');
    if (modal) modal.classList.add('show');
  }

  /**
   * 从模板复制出一个「我的应用」记录（演示：前端内存中追加一条）
   * @param {string} templateId
   */
  function addMallFromTemplate(templateId, action) {
    if (!templateId || typeof MOCK_MALLS === 'undefined') return;
    const tpl = MOCK_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const act = action === 'publish' ? 'publish' : 'save';
    const status = act === 'publish' ? 'published' : 'draft';
    const getBrandNameFromTemplate = function (template) {
      const tags = Array.isArray(template.tags) ? template.tags : [];
      if (tags.includes('美妆')) return '品牌A - 美妆';
      if (tags.includes('食品')) return '品牌B - 食品';
      if (tags.includes('服饰')) return '品牌C - 服饰';
      return '品牌E - 综合';
    };
    if (status === 'published') {
      // 同时最多只允许一个“已发布应用”
      MOCK_MALLS.forEach((m) => {
        if (m && m.status === 'published') m.status = 'draft';
      });
    }
    const now = new Date();
    const id = 'm-from-' + templateId + '-' + now.getTime();
    const name = tpl.name || '未命名模板应用';
    const brandName = getBrandNameFromTemplate(tpl);
    const createdAt =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');
    MOCK_MALLS.push({
      id,
      name,
      brandName,
      templateId: tpl.id,
      status,
      mode: 'single',
      terminal: tpl.terminal || 'mp',
      createdAt,
    });
    renderMallList();
  }

  /**
   * 一键复制商城（演示：复制配置生成新商城）
   * @param {string} mallId - 商城 ID
   */
  function onCopyMall(mallId) {
    const mall = (MOCK_MALLS || []).find((m) => m.id === mallId);
    if (!mall) return;
    alert('演示：一键复制商城「' + (mall.name || mallId) + '」，将复制其配置并生成新商城（实际会请求后端并刷新列表）。');
  }

  /**
   * 新建商城（演示）
   */
  function onNewMall() {
    alert('演示：新建商城。实际可跳转至商城创建向导或弹窗填写名称、关联品牌等。');
  }

  /**
   * 应用商城搜索并重新渲染
   */
  function applyMallSearch() {
    const input = document.getElementById('mall-search-input');
    const statusEl = document.getElementById('filter-app-status');
    const terminalEl = document.getElementById('filter-app-terminal');
    if (input) mallListSearchKeyword = input.value || '';
    appStatusFilter = statusEl ? statusEl.value || '' : '';
    appTerminalFilter = terminalEl ? terminalEl.value || '' : '';
    renderMallList();
  }

  /**
   * 重置我的应用筛选
   */
  function resetMallFilters() {
    const input = document.getElementById('mall-search-input');
    const statusEl = document.getElementById('filter-app-status');
    const terminalEl = document.getElementById('filter-app-terminal');
    if (input) input.value = '';
    if (statusEl) statusEl.value = '';
    if (terminalEl) terminalEl.value = '';
    mallListSearchKeyword = '';
    appStatusFilter = '';
    appTerminalFilter = '';
    renderMallList();
  }

  /**
   * 同步应用中心 Tab 选中态
   */
  function syncAppTabs() {
    document.querySelectorAll('#main-tabs-apps .main-tab[data-app-mode]').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.appMode === currentAppMode);
    });
  }

  /**
   * 切换应用中心模式 Tab
   * @param {string} mode - single | multi
   */
  function switchAppModeTab(mode) {
    currentAppMode = mode === 'multi' ? 'multi' : 'single';
    syncAppTabs();
    renderMallList();
  }

  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== 营销弹窗 ==========
  let popupSearchKeyword = '';
  let popupFilterStatus = '';
  let popupFilterPage = '';
  let popupFilterTarget = '';
  let popupFilterJump = '';
  let popupFilterTimeStart = '';
  let popupFilterTimeEnd = '';
  let popupQueryCollapsed = false;
  let editingPopupId = null;
  let selectedMaterialId = null;
  let pendingMaterialId = null;
  let uploadedImageDataUrl = null;
  let popupPreviewPage = 'home';

  const POPUP_STATUS_MAP = {
    active: { text: '投放中', class: 'status-popup-active' },
    scheduled: { text: '待投放', class: 'status-popup-scheduled' },
    ended: { text: '已结束', class: 'status-popup-ended' },
    draft: { text: '草稿', class: 'status-popup-draft' },
    paused: { text: '已停用', class: 'status-popup-ended' },
  };

  /**
   * 根据当前时间计算弹窗实际状态
   * @param {Object} popup
   * @returns {string}
   */
  function getEffectiveStatus(popup) {
    var s = popup.status;
    if (s === 'paused' || s === 'draft') return s;
    var now = new Date();
    if (popup.timeEnd && now > new Date(popup.timeEnd)) return 'ended';
    if (popup.timeStart && now < new Date(popup.timeStart)) return 'scheduled';
    return s || 'draft';
  }

  const POPUP_FREQUENCY_MAP = {
    every: '每次打开页面都触发',
    daily: '每自然日首次触发',
    weekly: '每自然周首次触发',
    first: '账号生命周期只弹一次',
    custom: '自定义',
  };

  const POPUP_TARGET_MAP = {
    all: '全部用户',
    new: '新用户',
    old: '老用户',
    specific: '特定用户',
  };

  const POPUP_JUMP_BEHAVIOR_MAP = {
    activity: '活动页',
    product: '商品详情',
  };

  /**
   * 格式化投放时间展示
   * @param {string} start
   * @param {string} end
   * @returns {string}
   */
  function formatPopupTimeRange(start, end) {
    const fmt = (v) => (v || '').replace('T', ' ').slice(0, 16);
    return fmt(start) + ' ~ ' + fmt(end);
  }

  /**
   * 投放页面标签列表
   * @param {string[]} pages
   * @returns {string}
   */
  function formatPopupDeliveryPages(pages) {
    const labels = POPUP_DELIVERY_PAGE_LABELS || {};
    const first = (pages || [])[0];
    return (first ? (labels[first] || first) : '') || '-';
  }

  /**
   * 触发时机展示文案
   * @param {Object} popup
   * @returns {string}
   */
  function formatPopupTrigger(popup) {
    if (popup.trigger === 'enter') return '进入页面 ' + (popup.triggerDelay || 3) + ' 秒';
    if (popup.trigger === 'behavior') {
      if (popup.triggerBehavior === 'add_cart') return '用户行为：加购';
      if (popup.triggerBehavior === 'browse') {
        return '用户行为：浏览 ' + (popup.browseSeconds || 10) + ' 秒';
      }
    }
    return '-';
  }

  /**
   * 展示频次详情文案
   * @param {Object} popup
   * @returns {string}
   */
  function formatPopupFrequencyDetail(popup) {
    if (popup.frequency === 'custom' && popup.frequencyCustomValue) {
      return '间隔 ' + popup.frequencyCustomValue + ' 分钟再次弹窗';
    }
    return POPUP_FREQUENCY_MAP[popup.frequency] || '-';
  }

  /**
   * 关闭方式展示
   * @param {Object} popup
   * @returns {string}
   */
  function formatPopupCloseMethods(popup) {
    if (popup.closeCountdown) return '倒计时 ' + (popup.closeSeconds || 5) + ' 秒';
    return '否';
  }

  /**
   * 获取素材缩略图样式
   * @param {string} materialId
   * @returns {string}
   */
  function getMaterialThumbStyle(materialId) {
    const mat = (MOCK_MATERIAL_IMAGES || []).find((m) => m.id === materialId);
    return mat ? mat.thumb : 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)';
  }

  /**
   * 筛选后的弹窗列表
   * @returns {Array}
   */
  function getFilteredPopups() {
    var list = [].concat(MOCK_MARKETING_POPUPS || []);
    if (popupFilterStatus) {
      list = list.filter(function (p) {
        return getEffectiveStatus(p) === popupFilterStatus;
      });
    }
    if (popupSearchKeyword.trim()) {
      const kw = popupSearchKeyword.trim().toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(kw));
    }
    if (popupFilterPage) {
      list = list.filter((p) => (p.deliveryPages || []).includes(popupFilterPage));
    }
    if (popupFilterTarget) {
      list = list.filter((p) => p.targetUser === popupFilterTarget);
    }
    if (popupFilterJump) {
      list = list.filter((p) => p.jumpBehavior === popupFilterJump);
    }
    if (popupFilterTimeStart) {
      list = list.filter((p) => (p.timeStart || '').slice(0, 10) >= popupFilterTimeStart);
    }
    if (popupFilterTimeEnd) {
      list = list.filter((p) => (p.timeEnd || '').slice(0, 10) <= popupFilterTimeEnd);
    }
    return list;
  }

  /**
   * 渲染营销弹窗列表
   */
  function renderPopupList() {
    const tbody = document.getElementById('popup-tbody');
    const paginationEl = document.getElementById('popup-pagination');
    if (!tbody) return;
    const list = getFilteredPopups();
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">暂无弹窗数据</td></tr>';
      if (paginationEl) paginationEl.innerHTML = '<span class="pagination-total">共 0 条</span>';
      return;
    }
    tbody.innerHTML = list
      .map(function (p) {
        var eff = getEffectiveStatus(p);
        var st = POPUP_STATUS_MAP[eff] || { text: eff, class: '' };
        var actions = '';

        if (eff === 'draft') {
          actions += '<button type="button" class="btn btn-sm btn-primary btn-popup-enable" data-id="' + escapeHtml(p.id) + '">启用</button>';
          actions += '<button type="button" class="btn btn-sm btn-ghost btn-popup-detail" data-id="' + escapeHtml(p.id) + '">详情</button>';
          actions += '<button type="button" class="btn btn-sm btn-danger btn-popup-delete" data-id="' + escapeHtml(p.id) + '">删除</button>';
        } else if (eff === 'active' || eff === 'scheduled') {
          actions += '<button type="button" class="btn btn-sm btn-warning btn-popup-pause" data-id="' + escapeHtml(p.id) + '">停用</button>';
          actions += '<button type="button" class="btn btn-sm btn-ghost btn-popup-detail" data-id="' + escapeHtml(p.id) + '">详情</button>';
        } else if (eff === 'paused') {
          if (p.timeEnd && new Date() < new Date(p.timeEnd)) {
            actions += '<button type="button" class="btn btn-sm btn-primary btn-popup-enable" data-id="' + escapeHtml(p.id) + '">重新启用</button>';
          }
          actions += '<button type="button" class="btn btn-sm btn-ghost btn-popup-detail" data-id="' + escapeHtml(p.id) + '">详情</button>';
          actions += '<button type="button" class="btn btn-sm btn-danger btn-popup-delete" data-id="' + escapeHtml(p.id) + '">删除</button>';
        } else {
          actions += '<button type="button" class="btn btn-sm btn-ghost btn-popup-detail" data-id="' + escapeHtml(p.id) + '">详情</button>';
          actions += '<button type="button" class="btn btn-sm btn-danger btn-popup-delete" data-id="' + escapeHtml(p.id) + '">删除</button>';
        }

        return '\n        <tr data-id="' + escapeHtml(p.id) + '">\n          <td>' + escapeHtml(p.name) + '</td>\n          <td>' + escapeHtml(formatPopupTimeRange(p.timeStart, p.timeEnd)) + '</td>\n          <td>' + escapeHtml(formatPopupDeliveryPages(p.deliveryPages)) + '</td>\n          <td>' + escapeHtml(p.jumpPageLabel || '-') + '</td>\n          <td><span class="status-tag ' + st.class + '">' + escapeHtml(st.text) + '</span></td>\n          <td class="table-actions">\n            ' + actions + '\n          </td>\n        </tr>';
      })
      .join('');

    tbody.querySelectorAll('.btn-popup-detail').forEach(function (btn) {
      btn.addEventListener('click', function () { openPopupDetail(btn.dataset.id); });
    });
    tbody.querySelectorAll('.btn-popup-delete').forEach(function (btn) {
      btn.addEventListener('click', function () { deletePopup(btn.dataset.id); });
    });
    tbody.querySelectorAll('.btn-popup-enable').forEach(function (btn) {
      btn.addEventListener('click', function () { enablePopup(btn.dataset.id); });
    });
    tbody.querySelectorAll('.btn-popup-pause').forEach(function (btn) {
      btn.addEventListener('click', function () { pausePopup(btn.dataset.id); });
    });

    if (paginationEl) {
      paginationEl.innerHTML = `<span class="pagination-total">共 ${list.length} 条</span>`;
    }
  }

  /**
   * 获取当前表单选中的弹窗素材（用于右侧预览）
   * @returns {{type: 'upload'|'library'|'none', src: string|null, gradient: string|null}}
   */
  function getPopupPreviewImageState() {
    const imageSource =
      document.querySelector('input[name="popup-image-source"]:checked')?.value || 'upload';
    if (imageSource === 'upload' && uploadedImageDataUrl) {
      return { type: 'upload', src: uploadedImageDataUrl, gradient: null };
    }
    if (imageSource === 'library' && selectedMaterialId) {
      const mat = (MOCK_MATERIAL_IMAGES || []).find((m) => m.id === selectedMaterialId);
      if (mat) return { type: 'library', src: null, gradient: mat.thumb };
    }
    return { type: 'none', src: null, gradient: null };
  }

  /**
   * 读取单选 toggle 组当前值
   * @param {string} groupId
   * @param {string} defaultValue
   * @returns {string}
   */
  function getPopupToggleValue(groupId, defaultValue) {
    const btn = document.querySelector('#' + groupId + ' .popup-toggle-btn.active');
    return (btn && btn.dataset.value) || defaultValue;
  }

  /**
   * 设置单选 toggle 组
   * @param {string} groupId
   * @param {string} value
   */
  function setPopupToggleValue(groupId, value) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.popup-toggle-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  }

  /**
   * 读取关闭方式配置
   * @returns {{closeOverlay: boolean, closeButton: boolean, closeCountdown: boolean, closeSeconds: number}}
   */
  function getPopupCloseSettings() {
    const group = document.getElementById('popup-close-group');
    const yesBtn = group && group.querySelector('[data-key="delay"][data-value="yes"]');
    const closeCountdown = !!(yesBtn && yesBtn.classList.contains('active'));
    return {
      closeOverlay: true,
      closeButton: true,
      closeCountdown,
      closeSeconds: Number(document.getElementById('popup-close-seconds')?.value) || 5,
    };
  }

  /**
   * 写入关闭方式配置
   * @param {Object} settings
   */
  function setPopupCloseSettings(settings) {
    const group = document.getElementById('popup-close-group');
    if (!group) return;
    const yesBtn = group.querySelector('[data-key="delay"][data-value="yes"]');
    const noBtn = group.querySelector('[data-key="delay"][data-value="no"]');
    const isDelay = !!settings.closeCountdown;
    if (yesBtn) yesBtn.classList.toggle('active', isDelay);
    if (noBtn) noBtn.classList.toggle('active', !isDelay);
    const closeSec = document.getElementById('popup-close-seconds');
    if (closeSec) {
      closeSec.value = String(settings.closeSeconds || 5);
      closeSec.disabled = !isDelay;
    }
    const wrap = document.getElementById('popup-close-countdown-wrap');
    if (wrap) wrap.hidden = !isDelay;
  }

  /**
   * 重置右侧预览面板状态
   */
  function resetPopupPreviewPanel() {
    popupPreviewPage = 'home';
    const panel = document.getElementById('popup-preview-panel');
    const modal = document.querySelector('.modal-popup-editor');
    const toggleBtn = document.getElementById('btn-popup-toggle-preview');
    if (panel) panel.classList.remove('is-hidden');
    if (modal) modal.classList.remove('preview-collapsed');
    if (toggleBtn) toggleBtn.textContent = '关闭预览';
    document.querySelectorAll('.popup-preview-page-tab').forEach((tab, index) => {
      tab.classList.toggle('active', index === 0);
    });
    updatePopupPreviewPageContent();
  }

  /**
   * 根据预览 Tab 更新手机内页面骨架
   */
  function updatePopupPreviewPageContent() {
    const content = document.getElementById('popup-preview-page-content');
    if (!content) return;
    const page = popupPreviewPage || 'home';
    content.className = 'popup-preview-phone-content popup-preview-skeleton-page-' + page;

    if (page === 'category') {
      content.innerHTML = `
        <div class="popup-preview-skeleton popup-preview-skeleton-banner"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton-row">
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
        </div>
        <div class="popup-preview-skeleton-row">
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
        </div>`;
    } else if (page === 'product') {
      content.innerHTML = `
        <div class="popup-preview-skeleton popup-preview-skeleton-hero"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton-row">
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
        </div>`;
    } else if (page === 'activity') {
      content.innerHTML = `
        <div class="popup-preview-skeleton popup-preview-skeleton-banner"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-card" style="height:80px"></div>`;
    } else if (page === 'mine') {
      content.innerHTML = `
        <div class="popup-preview-skeleton popup-preview-skeleton-banner"></div>
        <div class="popup-preview-skeleton-row popup-preview-skeleton-row-4">
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
        </div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>`;
    } else {
      content.innerHTML = `
        <div class="popup-preview-skeleton popup-preview-skeleton-banner"></div>
        <div class="popup-preview-skeleton-row popup-preview-skeleton-row-4">
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-icon"></div>
        </div>
        <div class="popup-preview-skeleton popup-preview-skeleton-block"></div>
        <div class="popup-preview-skeleton-row">
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
          <div class="popup-preview-skeleton popup-preview-skeleton-card"></div>
        </div>`;
    }

    const labels = POPUP_DELIVERY_PAGE_LABELS || {};
    const pageNameEl = document.getElementById('popup-live-page-name');
    if (pageNameEl) pageNameEl.textContent = labels[page] || page;
  }

  /**
   * 绑定预览区页面 Tab 与折叠按钮
   */
  function bindPopupPreviewPanel() {
    document.querySelectorAll('.popup-preview-page-tab').forEach((tab) => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.popup-preview-page-tab').forEach((t) => t.classList.remove('active'));
        this.classList.add('active');
        popupPreviewPage = this.dataset.page || 'home';
        updatePopupPreviewPageContent();
      });
    });

    const toggleBtn = document.getElementById('btn-popup-toggle-preview');
    const panel = document.getElementById('popup-preview-panel');
    const modal = document.querySelector('.modal-popup-editor');
    toggleBtn?.addEventListener('click', function () {
      if (!panel || !modal) return;
      const hidden = panel.classList.toggle('is-hidden');
      modal.classList.toggle('preview-collapsed', hidden);
      toggleBtn.textContent = hidden ? '打开预览' : '关闭预览';
    });
  }

  function bindPopupToggleGroups() {
    document.querySelectorAll('.popup-toggle-group').forEach((group) => {
      group.addEventListener('click', function (e) {
        const btn = e.target.closest('.popup-toggle-btn');
        if (!btn || !group.contains(btn)) return;
        if (e.target.classList.contains('popup-inline-number')) return;

        if (group.dataset.type === 'multi') {
          btn.classList.toggle('active');
        } else {
          group.querySelectorAll('.popup-toggle-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          if (group.id === 'popup-close-group') {
            const isDelay = btn.dataset.value === 'yes';
            const wrap = document.getElementById('popup-close-countdown-wrap');
            if (wrap) wrap.hidden = !isDelay;
            const closeSec = document.getElementById('popup-close-seconds');
            if (closeSec) closeSec.disabled = !isDelay;
          }
          if (group.id === 'popup-target-group') updatePopupTargetUI();
          if (group.id === 'popup-frequency-group') updatePopupFrequencyUI();
        }
        updatePopupLivePreview();
      });
    });

    document.getElementById('popup-close-seconds')?.addEventListener('input', updatePopupLivePreview);
    document.getElementById('popup-target-ids')?.addEventListener('input', updatePopupLivePreview);
  }

  /**
   * 更新新建/编辑弹窗右侧实时预览
   */
  function updatePopupLivePreview() {
    const imageState = getPopupPreviewImageState();
    const liveImg = document.getElementById('popup-live-image');
    const placeholder = document.getElementById('popup-live-image-placeholder');
    const imageWrap = document.getElementById('popup-live-image-wrap');
    if (liveImg && placeholder) {
      if (imageState.src) {
        liveImg.src = imageState.src;
        liveImg.hidden = false;
        placeholder.hidden = true;
        if (imageWrap) imageWrap.style.background = '';
      } else if (imageState.gradient) {
        liveImg.hidden = true;
        liveImg.removeAttribute('src');
        placeholder.hidden = true;
        if (imageWrap) imageWrap.style.background = imageState.gradient;
      } else {
        liveImg.hidden = true;
        liveImg.removeAttribute('src');
        placeholder.hidden = false;
        if (imageWrap) imageWrap.style.background = '';
      }
    }

    const closeSettings = getPopupCloseSettings();
    const closeBtn = document.getElementById('popup-live-close-btn');
    if (closeBtn) closeBtn.hidden = !closeSettings.closeButton;

    const countdownEl = document.getElementById('popup-live-countdown');
    if (countdownEl) {
      countdownEl.hidden = !closeSettings.closeCountdown;
      countdownEl.textContent = closeSettings.closeCountdown
        ? closeSettings.closeSeconds + 's 后关闭'
        : '';
    }

    const overlay = document.getElementById('popup-live-overlay');
    if (overlay) overlay.classList.toggle('no-overlay-close', !closeSettings.closeOverlay);

    const pageNameEl = document.getElementById('popup-live-page-name');
    if (pageNameEl) {
      const labels = POPUP_DELIVERY_PAGE_LABELS || {};
      pageNameEl.textContent = labels[popupPreviewPage] || popupPreviewPage || '商城页面';
    }
  }

  /**
   * 绑定弹窗表单内选项变更（触发、跳转等）
   */
  function bindPopupFormOptionEvents() {
    const formModal = document.getElementById('modal-popup-form');
    if (!formModal) return;

    formModal.addEventListener('change', function (e) {
      const t = e.target;
      if (!t.closest('.popup-form-main')) return;
      if (
        t.matches(
          '[name="popup-trigger"], [name="popup-jump-behavior"], #popup-trigger-behavior, #popup-jump-target'
        )
      ) {
        if (t.matches('[name="popup-trigger"], #popup-trigger-behavior')) updatePopupTriggerUI();
        if (t.matches('[name="popup-jump-behavior"]')) updatePopupJumpTargetOptions(t.value);
        updatePopupLivePreview();
      }
    });

    formModal.addEventListener('input', function (e) {
      if (e.target.closest('.popup-form-main')) updatePopupLivePreview();
    });

    formModal.addEventListener('click', function (e) {
      if (e.target.closest('.popup-inline-number')) return;
      const option = e.target.closest('.popup-option-chip, .popup-radio-inline label');
      if (option && option.closest('.popup-form-main')) {
        window.requestAnimationFrame(function () {
          updatePopupTriggerUI();
          updatePopupLivePreview();
        });
      }
    });
  }

  /**
   * 更新素材区 UI（上传预览 / 素材库选中态）
   */
  function updatePopupMaterialUI() {
    const reupload = document.getElementById('btn-popup-reupload');
    const hasUpload = !!uploadedImageDataUrl;
    if (reupload) reupload.hidden = !hasUpload;
    const libraryBtn = document.getElementById('btn-open-material-library');
    const selectedMat = document.getElementById('popup-selected-material');
    const hasMaterial = !!selectedMaterialId;
    if (libraryBtn) libraryBtn.hidden = hasMaterial;
    if (selectedMat) selectedMat.hidden = !hasMaterial;
  }

  /**
   * 更新跳转目标下拉选项
   * @param {string} behavior
   * @param {string} [selected]
   */
  function updatePopupJumpTargetOptions(behavior, selected, selectedLabel) {
    const select = document.getElementById('popup-jump-target');
    const searchWrap = document.getElementById('popup-product-search');
    const searchInput = document.getElementById('popup-product-search-input');
    const searchResults = document.getElementById('popup-product-search-results');
    const selectedWrap = document.getElementById('popup-product-selected');
    const selectedName = document.getElementById('popup-product-selected-name');
    const productValue = document.getElementById('popup-product-value');

    if (behavior === 'product') {
      if (select) select.hidden = true;
      if (searchWrap) searchWrap.hidden = false;
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.hidden = true;
      if (selected) {
        if (productValue) productValue.value = selected;
        if (selectedLabel && selectedName) selectedName.textContent = selectedLabel;
        if (selectedWrap) selectedWrap.hidden = !selectedLabel;
      } else {
        if (productValue && productValue.value && selectedName && selectedName.textContent) {
          if (selectedWrap) selectedWrap.hidden = false;
        } else {
          if (productValue) productValue.value = '';
          if (selectedWrap) selectedWrap.hidden = true;
        }
      }
    } else {
      if (select) {
        select.hidden = false;
        const options = (POPUP_JUMP_TARGETS && POPUP_JUMP_TARGETS[behavior]) || [];
        select.innerHTML = options
          .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
          .join('');
        if (selected) select.value = selected;
      }
      if (searchWrap) searchWrap.hidden = true;
      if (selectedWrap) selectedWrap.hidden = true;
      if (searchResults) searchResults.hidden = true;
    }
  }

  /**
   * 商品搜索 - 根据关键词过滤
   * @param {string} keyword
   */
  function searchProducts(keyword) {
    const list = MOCK_PRODUCT_LIST || [];
    if (!keyword || !keyword.trim()) return [];
    const kw = keyword.trim().toLowerCase();
    return list.filter(function (p) {
      return p.label.toLowerCase().includes(kw) || p.spu.toLowerCase().includes(kw);
    });
  }

  /**
   * 渲染商品搜索结果下拉
   * @param {Array} results
   */
  function renderProductSearchResults(results) {
    const resultsEl = document.getElementById('popup-product-search-results');
    if (!resultsEl) return;
    if (!results.length) {
      resultsEl.innerHTML = '<div class="popup-product-search-empty">未找到匹配的商品</div>';
      resultsEl.hidden = false;
      return;
    }
    resultsEl.innerHTML = results
      .map(function (p) {
        return (
          '<div class="popup-product-search-result-item" data-value="' +
          escapeHtml(p.value) +
          '" data-label="' +
          escapeHtml(p.label) +
          '">' +
          '<div class="product-thumb" style="background:' +
          escapeHtml(p.thumb || '#eee') +
          '"></div>' +
          '<div class="product-info">' +
          '<div class="product-name">' +
          escapeHtml(p.label) +
          '</div>' +
          '<div class="product-spu">' +
          escapeHtml(p.spu) +
          '</div>' +
          '</div>' +
          '<div class="product-price">&yen;' +
          escapeHtml(p.price) +
          '</div>' +
          '</div>'
        );
      })
      .join('');
    resultsEl.hidden = false;
  }

  /**
   * 选中商品
   * @param {string} value
   * @param {string} label
   */
  function selectProductItem(value, label) {
    const productValue = document.getElementById('popup-product-value');
    const selectedWrap = document.getElementById('popup-product-selected');
    const selectedName = document.getElementById('popup-product-selected-name');
    const searchInput = document.getElementById('popup-product-search-input');
    const searchResults = document.getElementById('popup-product-search-results');
    if (productValue) productValue.value = value;
    if (selectedName) selectedName.textContent = label;
    if (selectedWrap) selectedWrap.hidden = false;
    if (searchInput) searchInput.value = '';
    if (searchResults) {
      searchResults.hidden = true;
      searchResults.innerHTML = '';
    }
    updatePopupLivePreview();
  }

  /**
   * 清除已选商品
   */
  function clearSelectedProduct() {
    const productValue = document.getElementById('popup-product-value');
    const selectedWrap = document.getElementById('popup-product-selected');
    const selectedName = document.getElementById('popup-product-selected-name');
    if (productValue) productValue.value = '';
    if (selectedName) selectedName.textContent = '';
    if (selectedWrap) selectedWrap.hidden = true;
    updatePopupLivePreview();
  }

  /**
   * 绑定商品搜索事件
   */
  function bindProductSearchEvents() {
    const searchInput = document.getElementById('popup-product-search-input');
    const searchResults = document.getElementById('popup-product-search-results');
    const clearBtn = document.getElementById('popup-product-clear');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var results = searchProducts(this.value);
        renderProductSearchResults(results);
      });

      searchInput.addEventListener('blur', function () {
        setTimeout(function () {
          if (searchResults) searchResults.hidden = true;
        }, 200);
      });

      searchInput.addEventListener('focus', function () {
        if (this.value.trim()) {
          var results = searchProducts(this.value);
          renderProductSearchResults(results);
        }
      });
    }

    if (searchResults) {
      searchResults.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var item = e.target.closest('.popup-product-search-result-item');
        if (item) {
          var value = item.getAttribute('data-value');
          var label = item.getAttribute('data-label');
          selectProductItem(value, label);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', clearSelectedProduct);
    }
  }

  /** 已选目标用户列表 @type {Array<{id:string,name:string,phone:string}>} */
  var selectedUserList = [];

  /**
   * 搜索用户
   * @param {string} keyword
   * @returns {Array}
   */
  function searchUsers(keyword) {
    var list = MOCK_USER_LIST || [];
    if (!keyword || !keyword.trim()) return [];
    var kw = keyword.trim().toLowerCase();
    return list.filter(function (u) {
      return u.name.toLowerCase().includes(kw) || u.phone.includes(kw);
    });
  }

  /**
   * 渲染用户搜索结果
   * @param {Array} results
   */
  function renderUserSearchResults(results) {
    var resultsEl = document.getElementById('popup-user-search-results');
    if (!resultsEl) return;
    var ids = selectedUserList.map(function (u) { return u.id; });
    if (!results.length) {
      resultsEl.innerHTML = '<div class="popup-user-search-empty">未找到匹配的用户</div>';
      resultsEl.hidden = false;
      return;
    }
    resultsEl.innerHTML = results
      .map(function (u) {
        var already = ids.indexOf(u.id) !== -1;
        return (
          '<div class="popup-user-search-result-item' + (already ? ' disabled' : '') + '" data-id="' + escapeHtml(u.id) + '" data-name="' + escapeHtml(u.name) + '" data-phone="' + escapeHtml(u.phone) + '">' +
          '<div class="user-avatar" style="background:' + escapeHtml(u.avatar || '#eee') + '"></div>' +
          '<div class="user-info">' +
          '<div class="user-name">' + escapeHtml(u.name) + '</div>' +
          '<div class="user-phone">' + escapeHtml(u.phone) + '</div>' +
          '</div>' +
          (already ? '<span class="user-added-tag">已添加</span>' : '') +
          '</div>'
        );
      })
      .join('');
    resultsEl.hidden = false;
  }

  /** 同步隐藏域中已选用户 ID */
  function syncSelectedUserIds() {
    var idsInput = document.getElementById('popup-target-ids');
    if (idsInput) idsInput.value = selectedUserList.map(function (u) { return u.id; }).join(',');
  }

  /**
   * 渲染已选用户标签列表
   */
  function renderSelectedUserTags() {
    var listEl = document.getElementById('popup-user-selected-list');
    if (!listEl) return;
    if (!selectedUserList.length) {
      listEl.innerHTML = '';
      listEl.hidden = true;
      return;
    }
    listEl.hidden = false;
    listEl.innerHTML = selectedUserList
      .map(function (u) {
        return (
          '<span class="popup-user-tag" data-id="' + escapeHtml(u.id) + '">' +
          escapeHtml(u.name) + '（' + escapeHtml(u.phone) + '）' +
          '<button type="button" class="popup-user-tag-remove">&times;</button>' +
          '</span>'
        );
      })
      .join('');
  }

  /**
   * 添加已选用户
   * @param {string} id
   * @param {string} name
   * @param {string} phone
   */
  function addSelectedUser(id, name, phone) {
    if (selectedUserList.some(function (u) { return u.id === id; })) return;
    selectedUserList.push({ id: id, name: name, phone: phone });
    syncSelectedUserIds();
    renderSelectedUserTags();
    var input = document.getElementById('popup-user-search-input');
    var results = document.getElementById('popup-user-search-results');
    if (input) input.value = '';
    if (results) { results.hidden = true; results.innerHTML = ''; }
  }

  /**
   * 移除已选用户
   * @param {string} id
   */
  function removeSelectedUser(id) {
    selectedUserList = selectedUserList.filter(function (u) { return u.id !== id; });
    syncSelectedUserIds();
    renderSelectedUserTags();
  }

  /**
   * 绑定用户搜索事件
   */
  function bindUserSearchEvents() {
    var searchInput = document.getElementById('popup-user-search-input');
    var searchResults = document.getElementById('popup-user-search-results');
    var selectedList = document.getElementById('popup-user-selected-list');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var results = searchUsers(this.value);
        renderUserSearchResults(results);
      });

      searchInput.addEventListener('blur', function () {
        setTimeout(function () {
          if (searchResults) searchResults.hidden = true;
        }, 200);
      });

      searchInput.addEventListener('focus', function () {
        if (this.value.trim()) {
          var results = searchUsers(this.value);
          renderUserSearchResults(results);
        }
      });
    }

    if (searchResults) {
      searchResults.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var item = e.target.closest('.popup-user-search-result-item');
        if (item && !item.classList.contains('disabled')) {
          var id = item.getAttribute('data-id');
          var name = item.getAttribute('data-name');
          var phone = item.getAttribute('data-phone');
          addSelectedUser(id, name, phone);
        }
      });
    }

    if (selectedList) {
      selectedList.addEventListener('click', function (e) {
        var btn = e.target.closest('.popup-user-tag-remove');
        if (btn) {
          var tag = btn.closest('.popup-user-tag');
          if (tag) removeSelectedUser(tag.getAttribute('data-id'));
        }
      });
    }
  }

  function updatePopupTriggerUI() {
    const trigger = document.querySelector('input[name="popup-trigger"]:checked');
    const type = trigger ? trigger.value : 'enter';
    const delayInput = document.getElementById('popup-trigger-delay');
    const behaviorWrap = document.getElementById('popup-trigger-behavior-wrap');
    const browseWrap = document.getElementById('popup-browse-seconds-wrap');
    const behaviorSelect = document.getElementById('popup-trigger-behavior');
    if (delayInput) delayInput.disabled = type !== 'enter';
    if (behaviorWrap) behaviorWrap.hidden = type !== 'behavior';
    if (browseWrap && behaviorSelect) {
      browseWrap.hidden = type !== 'behavior' || behaviorSelect.value !== 'browse';
    }
  }

  /**
   * 更新目标用户输入框
   */
  function updatePopupTargetUI() {
    const target = getPopupToggleValue('popup-target-group', 'all');
    const userSearch = document.getElementById('popup-target-user-search');
    if (userSearch) userSearch.hidden = target !== 'specific';
  }

  /**
   * 更新展示频次自定义间隔显示
   */
  function updatePopupFrequencyUI() {
    const frequency = getPopupToggleValue('popup-frequency-group', 'daily');
    const customWrap = document.getElementById('popup-frequency-custom-wrap');
    if (customWrap) customWrap.style.display = frequency === 'custom' ? '' : 'none';
  }

  /**
   * 更新图片来源区域
   */
  function updatePopupImageSourceUI() {
    const source = document.querySelector('input[name="popup-image-source"]:checked');
    const uploadWrap = document.getElementById('popup-upload-wrap');
    const libraryWrap = document.getElementById('popup-library-wrap');
    const isUpload = !source || source.value === 'upload';
    if (uploadWrap) uploadWrap.hidden = !isUpload;
    if (libraryWrap) libraryWrap.hidden = isUpload;
  }

  /**
   * 重置弹窗表单
   */
  function resetPopupForm() {
    editingPopupId = null;
    selectedMaterialId = null;
    pendingMaterialId = null;
    uploadedImageDataUrl = null;
    const nameEl = document.getElementById('popup-name');
    if (nameEl) nameEl.value = '';
    const startEl = document.getElementById('popup-time-start');
    const endEl = document.getElementById('popup-time-end');
    if (startEl) startEl.value = '';
    if (endEl) endEl.value = '';
    document.querySelectorAll('#popup-delivery-pages input[type="radio"]').forEach((rb) => {
      rb.checked = false;
    });
    const enterRadio = document.querySelector('input[name="popup-trigger"][value="enter"]');
    if (enterRadio) enterRadio.checked = true;
    setPopupToggleValue('popup-frequency-group', 'daily');
    setPopupToggleValue('popup-target-group', 'all');
    setPopupCloseSettings({
      closeOverlay: true,
      closeButton: true,
      closeCountdown: false,
      closeSeconds: 5,
    });
    const activityRadio = document.querySelector('input[name="popup-jump-behavior"][value="activity"]');
    if (activityRadio) activityRadio.checked = true;
    const uploadRadio = document.querySelector('input[name="popup-image-source"][value="upload"]');
    if (uploadRadio) uploadRadio.checked = true;
    const delayInput = document.getElementById('popup-trigger-delay');
    if (delayInput) delayInput.value = '3';
    const browseInput = document.getElementById('popup-browse-seconds');
    if (browseInput) browseInput.value = '10';
    selectedUserList = [];
    syncSelectedUserIds();
    renderSelectedUserTags();
    const preview = document.getElementById('popup-image-preview');
    const placeholder = document.getElementById('popup-image-placeholder');
    if (preview) {
      preview.hidden = true;
      preview.src = '';
    }
    if (placeholder) placeholder.hidden = false;
    const reupload = document.getElementById('btn-popup-reupload');
    if (reupload) reupload.hidden = true;
    const fileInput = document.getElementById('popup-image-file');
    if (fileInput) fileInput.value = '';
    const selectedMat = document.getElementById('popup-selected-material');
    if (selectedMat) selectedMat.hidden = true;
    const libPreview = document.getElementById('popup-library-preview');
    if (libPreview) libPreview.style.background = '';
    updatePopupJumpTargetOptions('activity');
    var freqCustomValReset = document.getElementById('popup-frequency-custom-value');
    if (freqCustomValReset) freqCustomValReset.value = '60';
    updatePopupFrequencyUI();
    updatePopupTriggerUI();
    updatePopupTargetUI();
    updatePopupImageSourceUI();
    updatePopupMaterialUI();
    resetPopupPreviewPanel();
    updatePopupLivePreview();
  }

  /**
   * 填充弹窗表单（编辑）
   * @param {Object} popup
   */
  function fillPopupForm(popup) {
    editingPopupId = popup.id;
    document.getElementById('popup-name').value = popup.name || '';
    document.getElementById('popup-time-start').value = popup.timeStart || '';
    document.getElementById('popup-time-end').value = popup.timeEnd || '';
    document.querySelectorAll('#popup-delivery-pages input[type="radio"]').forEach((rb) => {
      rb.checked = (popup.deliveryPages || [])[0] === rb.value;
    });
    const behaviorRadio = document.querySelector(
      `input[name="popup-jump-behavior"][value="${popup.jumpBehavior || 'activity'}"]`
    );
    if (behaviorRadio) behaviorRadio.checked = true;
    updatePopupJumpTargetOptions(popup.jumpBehavior || 'activity', popup.jumpTarget, popup.jumpPageLabel);
    const triggerRadio = document.querySelector(`input[name="popup-trigger"][value="${popup.trigger || 'enter'}"]`);
    if (triggerRadio) triggerRadio.checked = true;
    const delayInput = document.getElementById('popup-trigger-delay');
    if (delayInput && popup.triggerDelay) delayInput.value = String(popup.triggerDelay);
    const behaviorSelect = document.getElementById('popup-trigger-behavior');
    if (behaviorSelect && popup.triggerBehavior) behaviorSelect.value = popup.triggerBehavior;
    const browseInput = document.getElementById('popup-browse-seconds');
    if (browseInput && popup.browseSeconds) browseInput.value = String(popup.browseSeconds);
    setPopupToggleValue('popup-frequency-group', popup.frequency || 'daily');
    if (popup.frequency === 'custom' && popup.frequencyCustomValue) {
      var freqCustomEdit = document.getElementById('popup-frequency-custom-value');
      if (freqCustomEdit) freqCustomEdit.value = String(popup.frequencyCustomValue);
    }
    setPopupToggleValue('popup-target-group', popup.targetUser || 'all');
    selectedUserList = [];
    if (popup.targetUserIds) {
      var idArr = popup.targetUserIds.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      idArr.forEach(function (uid) {
        var found = (MOCK_USER_LIST || []).find(function (u) { return u.id === uid; });
        if (found) selectedUserList.push({ id: found.id, name: found.name, phone: found.phone });
      });
    }
    syncSelectedUserIds();
    renderSelectedUserTags();
    setPopupCloseSettings({
      closeOverlay: !!popup.closeOverlay,
      closeButton: !!popup.closeButton,
      closeCountdown: !!popup.closeCountdown,
      closeSeconds: popup.closeSeconds || 5,
    });
    const sourceRadio = document.querySelector(
      `input[name="popup-image-source"][value="${popup.imageSource || 'library'}"]`
    );
    if (sourceRadio) sourceRadio.checked = true;
    selectedMaterialId = popup.materialId || null;
    uploadedImageDataUrl = popup.uploadedImage || null;
    if (popup.imageSource === 'upload') {
      selectedMaterialId = null;
      const selectedMat = document.getElementById('popup-selected-material');
      if (selectedMat) selectedMat.hidden = true;
      const libPreview = document.getElementById('popup-library-preview');
      if (libPreview) libPreview.style.background = '';
    } else {
      uploadedImageDataUrl = null;
      const preview = document.getElementById('popup-image-preview');
      const placeholder = document.getElementById('popup-image-placeholder');
      const reupload = document.getElementById('btn-popup-reupload');
      if (preview) {
        preview.hidden = true;
        preview.src = '';
      }
      if (placeholder) placeholder.hidden = false;
      if (reupload) reupload.hidden = true;
    }
    if (popup.imageSource === 'upload' && popup.uploadedImage) {
      const preview = document.getElementById('popup-image-preview');
      const placeholder = document.getElementById('popup-image-placeholder');
      if (preview) {
        preview.src = popup.uploadedImage;
        preview.hidden = false;
      }
      if (placeholder) placeholder.hidden = true;
      const reupload = document.getElementById('btn-popup-reupload');
      if (reupload) reupload.hidden = false;
    }
    if (popup.imageSource === 'library' && popup.materialId) {
      const mat = (MOCK_MATERIAL_IMAGES || []).find((m) => m.id === popup.materialId);
      const selectedMat = document.getElementById('popup-selected-material');
      const libPreview = document.getElementById('popup-library-preview');
      const libName = document.getElementById('popup-library-name');
      if (mat && selectedMat && libPreview && libName) {
        libPreview.style.background = mat.thumb;
        libName.textContent = mat.name;
        selectedMat.hidden = false;
      }
    }
    updatePopupMaterialUI();
    updatePopupFrequencyUI();
    updatePopupTriggerUI();
    updatePopupTargetUI();
    updatePopupImageSourceUI();
    updatePopupLivePreview();
  }

  /**
   * 打开新建/编辑弹窗表单
   * @param {'create'|'edit'} mode
   * @param {string} [id]
   */
  function openPopupFormModal(mode, id) {
    resetPopupForm();
    const titleEl = document.getElementById('popup-form-title');
    if (titleEl) titleEl.textContent = mode === 'edit' ? '修改弹窗' : '新建弹窗';
    if (mode === 'edit' && id) {
      const popup = (MOCK_MARKETING_POPUPS || []).find((p) => p.id === id);
      if (!popup) {
        alert('未找到该弹窗数据。');
        return;
      }
      fillPopupForm(popup);
    }
    document.getElementById('modal-popup-form')?.classList.add('show');
    updatePopupLivePreview();
  }

  /**
   * 收集表单数据
   * @returns {Object|null}
   */
  function collectPopupFormData() {
    const name = (document.getElementById('popup-name')?.value || '').trim();
    const timeStart = document.getElementById('popup-time-start')?.value || '';
    const timeEnd = document.getElementById('popup-time-end')?.value || '';
    const deliveryPage = document.querySelector('#popup-delivery-pages input:checked')?.value || '';
    const deliveryPages = deliveryPage ? [deliveryPage] : [];
    const jumpBehavior =
      document.querySelector('input[name="popup-jump-behavior"]:checked')?.value || 'activity';
    let jumpTarget;
    let jumpLabel;
    if (jumpBehavior === 'product') {
      jumpTarget = document.getElementById('popup-product-value')?.value || '';
      jumpLabel = document.getElementById('popup-product-selected-name')?.textContent || '';
    } else {
      jumpTarget = document.getElementById('popup-jump-target')?.value || '';
      jumpLabel =
        document.getElementById('popup-jump-target')?.selectedOptions?.[0]?.text || '';
    }
    const trigger = document.querySelector('input[name="popup-trigger"]:checked')?.value || 'enter';
    const triggerDelay = Number(document.getElementById('popup-trigger-delay')?.value) || 3;
    const triggerBehavior = document.getElementById('popup-trigger-behavior')?.value || 'add_cart';
    const browseSeconds = Number(document.getElementById('popup-browse-seconds')?.value) || 10;
    const frequency = getPopupToggleValue('popup-frequency-group', 'daily');
    const frequencyCustomValue = frequency === 'custom'
      ? Number(document.getElementById('popup-frequency-custom-value')?.value) || 60
      : null;
    const targetUser = getPopupToggleValue('popup-target-group', 'all');
    const targetUserIds = (document.getElementById('popup-target-ids')?.value || '').trim();
    const closeSettings = getPopupCloseSettings();
    const closeOverlay = closeSettings.closeOverlay;
    const closeButton = closeSettings.closeButton;
    const closeCountdown = closeSettings.closeCountdown;
    const closeSeconds = closeSettings.closeSeconds;
    const imageSource =
      document.querySelector('input[name="popup-image-source"]:checked')?.value || 'upload';

    if (!name) {
      alert('请填写弹窗名称。');
      return null;
    }
    if (!timeStart || !timeEnd) {
      alert('请设置投放时间。');
      return null;
    }
    if (timeStart >= timeEnd) {
      alert('投放结束时间须晚于开始时间。');
      return null;
    }
    if (!deliveryPages.length) {
      alert('请至少选择一个投放页面。');
      return null;
    }
    if (jumpBehavior === 'product' && !jumpTarget) {
      alert('请搜索并选择一个商品。');
      return null;
    }
    if (targetUser === 'specific' && !targetUserIds) {
      alert('请搜索并选择至少一位特定用户。');
      return null;
    }
    if (imageSource === 'upload' && !uploadedImageDataUrl && !editingPopupId) {
      alert('请上传弹窗图片。');
      return null;
    }
    if (imageSource === 'library' && !selectedMaterialId) {
      alert('请从素材库选择图片。');
      return null;
    }

    const mat = (MOCK_MATERIAL_IMAGES || []).find((m) => m.id === selectedMaterialId);
    return {
      name,
      timeStart,
      timeEnd,
      deliveryPages,
      jumpBehavior,
      jumpTarget,
      jumpPageLabel: jumpLabel,
      trigger,
      triggerDelay: trigger === 'enter' ? triggerDelay : null,
      triggerBehavior: trigger === 'behavior' ? triggerBehavior : null,
      browseSeconds: trigger === 'behavior' && triggerBehavior === 'browse' ? browseSeconds : null,
      frequency,
      frequencyCustomValue,
      targetUser,
      targetUserIds: targetUser === 'specific' ? targetUserIds : '',
      closeOverlay,
      closeButton,
      closeCountdown,
      closeSeconds,
      imageSource,
      materialId: imageSource === 'library' ? selectedMaterialId : null,
      imageName: imageSource === 'library' && mat ? mat.name : '本地上传',
      uploadedImage: imageSource === 'upload' ? uploadedImageDataUrl : null,
      status: 'draft',
    };
  }

  /**
   * 保存弹窗
   * @param {boolean} [publish=false] 是否保存并启用
   */
  function submitPopup(publish) {
    var data = collectPopupFormData();
    if (!data) return;
    var now = new Date();
    if (publish) {
      data.status = data.timeStart && now < new Date(data.timeStart) ? 'scheduled' : 'active';
    } else {
      data.status = 'draft';
    }
    var updatedAt =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      ' ' +
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0');

    if (editingPopupId) {
      var idx = MOCK_MARKETING_POPUPS.findIndex(function (p) { return p.id === editingPopupId; });
      if (idx >= 0) {
        var prev = MOCK_MARKETING_POPUPS[idx];
        if (data.imageSource === 'upload' && !data.uploadedImage && prev.uploadedImage) {
          data.uploadedImage = prev.uploadedImage;
        }
        MOCK_MARKETING_POPUPS[idx] = Object.assign({}, prev, data, { id: editingPopupId, status: data.status, updatedAt: updatedAt });
      }
    } else {
      var id = 'pop-' + now.getTime();
      MOCK_MARKETING_POPUPS.unshift(Object.assign({}, data, { id: id, updatedAt: updatedAt }));
    }
    closeModal('modal-popup-form');
    renderPopupList();
    if (publish) {
      alert(editingPopupId ? '演示：弹窗已更新并启用。' : '演示：弹窗已创建并启用。');
    } else {
      alert(editingPopupId ? '演示：弹窗已保存为草稿。' : '演示：弹窗已保存为草稿。');
    }
  }

  /**
   * 打开弹窗详情
   * @param {string} id
   */
  function openPopupDetail(id) {
    const popup = (MOCK_MARKETING_POPUPS || []).find((p) => p.id === id);
    if (!popup) return;
    const st = POPUP_STATUS_MAP[getEffectiveStatus(popup)] || { text: getEffectiveStatus(popup) };
    const body = document.getElementById('popup-detail-body');
    if (!body) return;
    const thumbStyle = popup.imageSource === 'library' && popup.materialId
      ? getMaterialThumbStyle(popup.materialId)
      : 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)';
    body.innerHTML = `
      <div class="popup-detail-grid">
        <div class="popup-detail-item"><span class="label">弹窗名称</span>${escapeHtml(popup.name)}</div>
        <div class="popup-detail-item"><span class="label">状态</span>${escapeHtml(st.text)}</div>
        <div class="popup-detail-item full"><span class="label">投放时间</span>${escapeHtml(formatPopupTimeRange(popup.timeStart, popup.timeEnd))}</div>
        <div class="popup-detail-item"><span class="label">投放页面</span>${escapeHtml(formatPopupDeliveryPages(popup.deliveryPages))}</div>
        <div class="popup-detail-item"><span class="label">跳转行为</span>${escapeHtml(POPUP_JUMP_BEHAVIOR_MAP[popup.jumpBehavior] || '-')}</div>
        <div class="popup-detail-item full"><span class="label">跳转页面</span>${escapeHtml(popup.jumpPageLabel || '-')}</div>
        <div class="popup-detail-item"><span class="label">触发时机</span>${escapeHtml(formatPopupTrigger(popup))}</div>
        <div class="popup-detail-item"><span class="label">展示频次</span>${escapeHtml(formatPopupFrequencyDetail(popup))}</div>
        <div class="popup-detail-item"><span class="label">目标用户</span>${escapeHtml(POPUP_TARGET_MAP[popup.targetUser] || '-')}${popup.targetUser === 'specific' && popup.targetUserIds ? '（' + escapeHtml(popup.targetUserIds) + '）' : ''}</div>
        <div class="popup-detail-item"><span class="label">关闭方式</span>${escapeHtml(formatPopupCloseMethods(popup))}</div>
        <div class="popup-detail-item full">
          <span class="label">弹窗素材（${popup.imageSource === 'upload' ? '本地上传' : '素材库'}）</span>
          <div class="popup-detail-preview" style="background:${thumbStyle}"></div>
          <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">${escapeHtml(popup.imageName || '')}</div>
        </div>
      </div>`;
    document.getElementById('modal-popup-detail')?.classList.add('show');
  }

  /**
   * 删除弹窗
   * @param {string} id
   */
  function deletePopup(id) {
    var popup = (MOCK_MARKETING_POPUPS || []).find(function (p) { return p.id === id; });
    if (!popup) return;
    if (!window.confirm('确定删除弹窗「' + popup.name + '」吗？删除后不可恢复。')) return;
    var idx = MOCK_MARKETING_POPUPS.findIndex(function (p) { return p.id === id; });
    if (idx >= 0) MOCK_MARKETING_POPUPS.splice(idx, 1);
    renderPopupList();
  }

  /**
   * 启用弹窗（草稿/已结束/已停用 → 启用）
   * @param {string} id
   */
  function enablePopup(id) {
    var popup = (MOCK_MARKETING_POPUPS || []).find(function (p) { return p.id === id; });
    if (!popup) return;
    var now = new Date();
    popup.status = popup.timeStart && now < new Date(popup.timeStart) ? 'scheduled' : 'active';
    popup.updatedAt = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    renderPopupList();
  }

  /**
   * 停用弹窗（投放中 → 停用）
   * @param {string} id
   */
  function pausePopup(id) {
    var popup = (MOCK_MARKETING_POPUPS || []).find(function (p) { return p.id === id; });
    if (!popup) return;
    popup.status = 'paused';
    popup.updatedAt = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0') + ' ' + String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0');
    renderPopupList();
  }

  /**
   * 打开素材库
   */
  function openMaterialLibrary() {
    pendingMaterialId = selectedMaterialId;
    const grid = document.getElementById('material-library-grid');
    const confirmBtn = document.getElementById('btn-confirm-material');
    if (!grid) return;
    grid.innerHTML = (MOCK_MATERIAL_IMAGES || [])
      .map(
        (m) => `
      <div class="material-library-item" data-id="${escapeHtml(m.id)}">
        <div class="material-library-thumb" style="background:${m.thumb}"></div>
        <div class="material-library-name">${escapeHtml(m.name)}</div>
      </div>`
      )
      .join('');
    if (confirmBtn) confirmBtn.disabled = !pendingMaterialId;
    if (pendingMaterialId) {
      const pre = grid.querySelector(`.material-library-item[data-id="${pendingMaterialId}"]`);
      if (pre) pre.classList.add('selected');
    }
    grid.querySelectorAll('.material-library-item').forEach((item) => {
      item.addEventListener('click', function () {
        grid.querySelectorAll('.material-library-item').forEach((el) => el.classList.remove('selected'));
        this.classList.add('selected');
        pendingMaterialId = this.dataset.id;
        if (confirmBtn) confirmBtn.disabled = false;
      });
    });
    document.getElementById('modal-material-library')?.classList.add('show');
  }

  /**
   * 确认素材库选择
   */
  function confirmMaterialSelection() {
    if (!pendingMaterialId) return;
    selectedMaterialId = pendingMaterialId;
    const mat = (MOCK_MATERIAL_IMAGES || []).find((m) => m.id === selectedMaterialId);
    if (!mat) return;
    const selectedMat = document.getElementById('popup-selected-material');
    const libPreview = document.getElementById('popup-library-preview');
    const libName = document.getElementById('popup-library-name');
    if (libPreview) libPreview.style.background = mat.thumb;
    if (libName) libName.textContent = mat.name;
    if (selectedMat) selectedMat.hidden = false;
    updatePopupMaterialUI();
    closeModal('modal-material-library');
    updatePopupLivePreview();
  }

  /**
   * 处理图片上传
   * @param {File} file
   */
  function handlePopupImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择图片文件。');
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      uploadedImageDataUrl = reader.result;
      const preview = document.getElementById('popup-image-preview');
      const placeholder = document.getElementById('popup-image-placeholder');
      if (preview) {
        preview.src = uploadedImageDataUrl;
        preview.hidden = false;
      }
      if (placeholder) placeholder.hidden = true;
      const reupload = document.getElementById('btn-popup-reupload');
      if (reupload) reupload.hidden = false;
      updatePopupMaterialUI();
      updatePopupLivePreview();
    };
    reader.readAsDataURL(file);
  }

  /**
   * 应用弹窗列表筛选
   */
  function applyPopupFilters() {
    popupFilterStatus = document.getElementById('popup-filter-status')?.value || '';
    popupSearchKeyword = document.getElementById('popup-search-input')?.value || '';
    popupFilterPage = document.getElementById('popup-filter-page')?.value || '';
    popupFilterTarget = document.getElementById('popup-filter-target')?.value || '';
    popupFilterJump = document.getElementById('popup-filter-jump')?.value || '';
    popupFilterTimeStart = document.getElementById('popup-filter-time-start')?.value || '';
    popupFilterTimeEnd = document.getElementById('popup-filter-time-end')?.value || '';
    renderPopupList();
  }

  /**
   * 重置弹窗筛选
   */
  function resetPopupFilters() {
    const fields = [
      'popup-filter-status',
      'popup-search-input',
      'popup-filter-page',
      'popup-filter-target',
      'popup-filter-jump',
      'popup-filter-time-start',
      'popup-filter-time-end',
    ];
    fields.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    popupFilterStatus = '';
    popupSearchKeyword = '';
    popupFilterPage = '';
    popupFilterTarget = '';
    popupFilterJump = '';
    popupFilterTimeStart = '';
    popupFilterTimeEnd = '';
    renderPopupList();
  }

  /**
   * 收起/展开查询区域
   */
  function togglePopupQueryPanel() {
    popupQueryCollapsed = !popupQueryCollapsed;
    const panel = document.getElementById('popup-query-panel');
    const btn = document.getElementById('btn-popup-collapse');
    const textEl = btn?.querySelector('.btn-query-collapse-text');
    if (panel) panel.classList.toggle('collapsed', popupQueryCollapsed);
    if (btn) btn.setAttribute('aria-expanded', popupQueryCollapsed ? 'false' : 'true');
    if (textEl) textEl.textContent = popupQueryCollapsed ? '展开' : '收起';
  }

  /**
   * 同步主区标题、操作按钮、筛选栏与 Tab（对齐搭建端模板中心 / 应用中心）
   * @param {string} page - templates | mall-list | marketing-popup
   */
  function updateMainChrome(page) {
    const titleMap = {
      templates: '模板中心',
      'mall-list': '我的应用',
      'marketing-popup': '营销弹窗',
    };
    const titleEl = document.getElementById('main-page-title');
    if (titleEl) titleEl.textContent = titleMap[page] || '模板中心';

    document.getElementById('btn-new-mall')?.classList.toggle('hidden', page !== 'mall-list');
    document.getElementById('btn-new-popup')?.classList.toggle('hidden', page !== 'marketing-popup');

    document.getElementById('main-filters-templates')?.classList.toggle('hidden', page !== 'templates');
    document.getElementById('main-filters-apps')?.classList.toggle('hidden', page !== 'mall-list');
    document.getElementById('main-filters-popup')?.classList.toggle('hidden', page !== 'marketing-popup');

    const tabsTemplates = document.getElementById('main-tabs-templates');
    const tabsApps = document.getElementById('main-tabs-apps');
    if (tabsTemplates) tabsTemplates.classList.toggle('hidden', page !== 'templates');
    if (tabsApps) tabsApps.classList.toggle('hidden', page !== 'mall-list');

    if (page === 'templates') syncTemplateTabs();
    if (page === 'mall-list') syncAppTabs();
  }

  // 页面切换
  document.querySelectorAll('.nav-item[data-page]').forEach((el) => {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      const page = this.dataset.page;
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      const target = document.getElementById('page-' + page);
      if (target) target.classList.add('active');
      updateMainChrome(page);
      if (page === 'marketing-popup') renderPopupList();
    });
  });

  // 页面管理返回按钮
  document.getElementById('btn-back-to-templates')?.addEventListener('click', () => {
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const templatesSection = document.getElementById('page-templates');
    if (templatesSection) templatesSection.classList.add('active');
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

  // 筛选
  document.getElementById('filter-tag')?.addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-terminal')?.addEventListener('change', onFilterTerminalChange);
  document.getElementById('filter-app-status')?.addEventListener('change', applyMallSearch);
  document.getElementById('filter-app-terminal')?.addEventListener('change', applyMallSearch);

  // 模板中心 / 应用中心 Tab
  document.querySelectorAll('#main-tabs-templates .main-tab[data-terminal]').forEach((tab) => {
    tab.addEventListener('click', function () {
      switchTemplateTerminalTab(this.getAttribute('data-terminal') || '');
    });
  });
  document.querySelectorAll('#main-tabs-apps .main-tab[data-app-mode]').forEach((tab) => {
    tab.addEventListener('click', function () {
      switchAppModeTab(this.dataset.appMode || 'single');
    });
  });

  // 按钮
  document.getElementById('btn-new-template')?.addEventListener('click', openNewTemplateModal);
  document.getElementById('btn-confirm-new')?.addEventListener('click', confirmNewTemplate);
  document.getElementById('btn-confirm-publish')?.addEventListener('click', confirmPublish);
  document.getElementById('btn-confirm-push')?.addEventListener('click', confirmPush);
  document.getElementById('btn-confirm-category-template')?.addEventListener('click', confirmCategoryTemplate);

  // 应用发布（一次确认）
  document.getElementById('btn-confirm-publish-app-step1')?.addEventListener('click', function () {
    closeModal('modal-publish-app-step1');
    publishApp(pendingPublishAppId);
    pendingPublishAppId = '';
  });
  document.getElementById('btn-cancel-publish-app-step1')?.addEventListener('click', function () {
    pendingPublishAppId = '';
  });

  // 模板列表搜索与重置
  document.getElementById('btn-template-search')?.addEventListener('click', applyTemplateSearch);
  document.getElementById('template-search-input')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') applyTemplateSearch();
  });
  document.getElementById('btn-template-reset')?.addEventListener('click', resetTemplateFilters);

  document.getElementById('btn-submit-use-template')?.addEventListener('click', submitUseTemplate);

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

  // 商城列表：搜索、新建
  document.getElementById('btn-mall-search')?.addEventListener('click', applyMallSearch);
  document.getElementById('btn-mall-reset')?.addEventListener('click', resetMallFilters);
  document.getElementById('mall-search-input')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') applyMallSearch();
  });
  document.getElementById('btn-new-mall')?.addEventListener('click', onNewMall);

  // 营销弹窗
  document.getElementById('btn-new-popup')?.addEventListener('click', () => openPopupFormModal('create'));
  document.getElementById('btn-submit-popup')?.addEventListener('click', () => submitPopup(false));
  document.getElementById('btn-submit-popup-publish')?.addEventListener('click', () => submitPopup(true));
  document.getElementById('btn-popup-search')?.addEventListener('click', applyPopupFilters);
  document.getElementById('popup-search-input')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') applyPopupFilters();
  });
  document.getElementById('btn-popup-reset')?.addEventListener('click', resetPopupFilters);
  document.getElementById('btn-popup-collapse')?.addEventListener('click', togglePopupQueryPanel);
  document.getElementById('btn-open-material-library')?.addEventListener('click', openMaterialLibrary);
  document.getElementById('btn-popup-change-material')?.addEventListener('click', openMaterialLibrary);
  document.getElementById('btn-confirm-material')?.addEventListener('click', confirmMaterialSelection);
  document.getElementById('btn-popup-reupload')?.addEventListener('click', function (e) {
    e.stopPropagation();
    document.getElementById('popup-image-file')?.click();
  });

  bindPopupToggleGroups();
  bindPopupFormOptionEvents();
  bindProductSearchEvents();
  bindUserSearchEvents();
  bindPopupPreviewPanel();

  document.querySelectorAll('input[name="popup-image-source"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      updatePopupImageSourceUI();
      updatePopupMaterialUI();
      updatePopupLivePreview();
    });
  });
  document.querySelectorAll('#popup-delivery-pages input').forEach((cb) => {
    cb.addEventListener('change', updatePopupLivePreview);
  });

  const uploadZone = document.getElementById('popup-image-upload-zone');
  const fileInput = document.getElementById('popup-image-file');
  uploadZone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', function () {
    if (this.files && this.files[0]) handlePopupImageUpload(this.files[0]);
  });
  uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer?.files?.[0]) handlePopupImageUpload(e.dataTransfer.files[0]);
  });

  document.querySelectorAll('#modal-popup-form .popup-inline-number').forEach((el) => {
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => e.stopPropagation());
  });

  // 初始化
  updateMainChrome('templates');
  applyFiltersAndRender();
  renderPushRecord();
  renderMallList();

  // 暴露给编辑器窗口调用
  window.addMallFromTemplate = addMallFromTemplate;
})();
