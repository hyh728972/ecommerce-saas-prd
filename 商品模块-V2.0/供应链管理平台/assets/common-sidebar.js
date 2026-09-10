/**
 * 供应链管理平台 - 公共侧边栏导航
 * 用法：页面 body 内放置 <aside class="sidebar" id="app-sidebar"></aside>
 *       可选 data-nav-active="nav-id" 覆盖自动高亮
 */
(function (global) {
  'use strict';

  var ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    search: '<circle cx="11" cy="11" r="6"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    customer: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    order: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    truck: '<rect x="1" y="3" width="15" height="13" rx="1"/><polyline points="16 8 20 8 23 11 23 16 16 16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    chat: '<path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
    logo: '<rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    folder: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    combo: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="12" y="4" width="8" height="8" rx="1"/><rect x="4" y="12" width="9" height="8" rx="1"/><rect x="13" y="12" width="7" height="7" rx="1"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="11.49"/>',
    category: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>',
    brand: '<rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8.5" cy="10.5" r="2.5"/><path d="M21 15l-5-5L8.5 18"/>',
    'clipboard-check': '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>',
    aftersale: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    sitemap: '<rect x="9" y="3" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><path d="M12 9v3"/><path d="M5 15v-3h14v3"/>',
    log: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    platform: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>',
    'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    channel: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    headset: '<path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
    'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/>'
  };

  /** 子页面归属：详情/配置页高亮父级菜单 */
  var PAGE_ACTIVE_MAP = {
    '04.全量商品列表-原型页面.html': 'supply-pool',
    '04a.供应链商品详情页-原型页面.html': 'supply-pool',
    '05.组合商品管理-原型页面.html': 'combo-product',
    '05a.组合商品详情页-原型页面.html': 'combo-product',
    '07.关联商品管理-原型页面.html': 'product-relation',
    '10.商品标签-原型页面.html': 'product-tag',
    '11a.一件代发订单详情页-原型页面.html': 'order-dropship',
    '11b.手动补单-原型页面.html': 'order-dropship',
    '12a.集采直发订单详情页-原型页面.html': 'order-purchase'
  };

  var NAV_SECTIONS = [
    {
      id: 'home',
      type: 'item',
      label: '工作台首页',
      href: '#',
      icon: 'home'
    },
    {
      label: '供应商管理',
      items: [
        { id: 'supplier-list', label: '供应商档案列表', href: '#', icon: 'customer' },
        { id: 'supplier-grade', label: '供应商分级配置', href: '#', icon: 'award' },
        { id: 'supplier-cert', label: '供应商证件管理', href: '#', icon: 'file-text' }
      ]
    },
    {
      label: '商品管理',
      items: [
        { id: 'supply-pool', label: '全量商品列表', href: '04.全量商品列表-原型页面.html', icon: 'grid' },
        { id: 'combo-product', label: '组合商品管理', href: '05.组合商品管理-原型页面.html', icon: 'combo' },
        { id: 'product-relation', label: '关联商品管理', href: '07.关联商品管理-原型页面.html', icon: 'share' },
        { id: 'product-category', label: '商品类目', href: '08.商品类目-原型页面.html', icon: 'category' },
        { id: 'product-brand', label: '商品品牌', href: '09.商品品牌-原型页面.html', icon: 'brand' },
        { id: 'product-tag', label: '商品标签', href: '10.商品标签-原型页面.html', icon: 'tag' }
      ]
    },
    {
      label: '订单管理',
      items: [
        { id: 'order-purchase', label: '集采直发订单', href: '12.集采直发订单-原型页面.html', icon: 'order' },
        { id: 'order-dropship', label: '一件代发订单', href: '11.一件代发订单-原型页面.html', icon: 'truck' }
      ]
    },
    {
      label: '售后管理',
      items: [
        { id: 'aftersale-ticket', label: '售后协同工单', href: '#', icon: 'headset' },
        { id: 'aftersale-monitor', label: '售后监控列表', href: '#', icon: 'aftersale' }
      ]
    },
    {
      label: '结算管理',
      items: [
        { id: 'settle-purchase', label: '集采直发对账', href: '#', icon: 'wallet' },
        { id: 'settle-dropship', label: '一件代发对账', href: '#', icon: 'credit-card' }
      ]
    },
    {
      label: '协同管理',
      items: [
        { id: 'platform-approval', label: '平台审批管理', href: '#', icon: 'clipboard-check' },
        { id: 'notify-config', label: '信息通知配置', href: '#', icon: 'bell' },
        { id: 'sensitive-word', label: '敏感词库管理', href: '#', icon: 'shield' }
      ]
    },
    {
      label: '基础配置',
      items: [
        { id: 'manual', label: '操作手册配置', href: '#', icon: 'book' },
        { id: 'channel', label: '商城渠道管理', href: '#', icon: 'channel' },
        { id: 'freight', label: '物流公司配置', href: '#', icon: 'send' },
        { id: 'return-address', label: '退货地址管理', href: '#', icon: 'map-pin' }
      ]
    },
    {
      label: '系统设置',
      items: [
        { id: 'org', label: '组织架构', href: '#', icon: 'sitemap' },
        { id: 'role', label: '角色权限', href: '#', icon: 'key' },
        { id: 'system-log', label: '系统日志', href: '#', icon: 'log' },
        { id: 'platform-info', label: '平台信息', href: '#', icon: 'platform' }
      ]
    }
  ];

  function iconSvg(name) {
    var paths = ICONS[name] || '';
    return '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + paths + '</svg>';
  }

  function renderNavItem(item, activeId) {
    var cls = 'nav-item' + (item.id === activeId ? ' active' : '');
    var badge = item.badge ? '<span class="badge">' + item.badge + '</span>' : '';
    return '<a class="' + cls + '" href="' + item.href + '">' + iconSvg(item.icon) + item.label + badge + '</a>';
  }

  function renderSection(section, activeId) {
    if (section.type === 'item') {
      return renderNavItem(section, activeId);
    }
    var items = section.items.map(function (item) {
      return renderNavItem(item, activeId);
    }).join('');
    return (
      '<div class="nav-section">' +
        '<div class="nav-section-label" onclick="toggleSection(this)"><span class="section-arrow">▾</span>' + section.label + '</div>' +
        '<div class="nav-section-items">' + items + '</div>' +
      '</div>'
    );
  }

  function getCurrentPage() {
    var path = global.location.pathname || '';
    var parts = path.split('/');
    var page = parts[parts.length - 1] || '';
    // file:// 协议下中文文件名会被百分号编码，需还原后再与字面中文 href/MAP key 比较
    try { page = decodeURIComponent(page); } catch (e) { /* 畸形 % 序列时保留原始值 */ }
    return page;
  }

  function resolveActiveId(container) {
    var override = container.getAttribute('data-nav-active');
    if (override) return override;

    var page = getCurrentPage();
    if (PAGE_ACTIVE_MAP[page]) return PAGE_ACTIVE_MAP[page];

    var activeId = null;
    NAV_SECTIONS.forEach(function (section) {
      if (section.type === 'item') {
        if (section.href === page) activeId = section.id;
      } else if (section.items) {
        section.items.forEach(function (item) {
          if (item.href === page) activeId = item.id;
        });
      }
    });
    return activeId;
  }

  function renderSidebar(container) {
    var activeId = resolveActiveId(container);
    var navHtml = NAV_SECTIONS.map(function (section) {
      return renderSection(section, activeId);
    }).join('');

    container.innerHTML =
      '<div class="sidebar-brand">' +
        '<div class="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + ICONS.logo + '</svg>供应链管理平台</div>' +
        '<div class="sub">Supply Chain Management</div>' +
      '</div>' +
      '<nav class="sidebar-nav">' + navHtml + '</nav>';
  }

  function toggleSection(label) {
    label.parentElement.classList.toggle('collapsed');
  }

  function init() {
    var container = document.getElementById('app-sidebar');
    if (container) renderSidebar(container);
  }

  global.toggleSection = toggleSection;
  global.SupplySidebar = { init: init, render: renderSidebar, NAV_SECTIONS: NAV_SECTIONS };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
