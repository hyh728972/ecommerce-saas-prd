/**
 * 品牌商城后台 - 公共侧边栏导航
 * 用法：页面 body 内放置 <aside class="sidebar" id="app-sidebar"></aside>
 *       可选 data-nav-active="nav-id" 覆盖自动高亮
 *       菜单结构对齐《301 导航栏规划》与品牌商城后台PRD 4.2
 */
(function (global) {
  'use strict';

  var ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    channel: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    category: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    template: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="8" x2="21" y2="8"/><rect x="5" y="11" width="6" height="7" rx="1"/><line x1="14" y1="11" x2="19" y2="11"/><line x1="14" y1="14" x2="19" y2="14"/><line x1="14" y1="17" x2="17" y2="17"/>',
    customer: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    points: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    order: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    mall: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="15" x2="15" y2="15"/>',
    sitemap: '<rect x="9" y="3" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><path d="M12 9v3"/><path d="M5 15v-3h14v3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    log: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    platform: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>',
    logo: '<rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>'
  };

  /** 子页面归属：详情/子页高亮父级菜单（商品中心/订单列表下的子页） */
  var PAGE_ACTIVE_MAP = {
    '01a.商品详情-原型页面.html': 'mall-products',
    '01b.客户编码映射-原型页面.html': 'mall-products',
    '09a.订单详情-原型页面.html': 'order-list',
    '09b.线下订单导入-原型页面.html': 'order-list',
    '06a.积分池明细详情-原型页面.html': 'mall-points',
    '06b.用户权益发放-原型页面.html': 'mall-points',
    '08a.用户权益流水-原型页面.html': 'user-equity-overview'
  };

  // 营销模块提取版：仅本目录存在的页面保留真实链接，其余页面以 # 占位（见售后模块-V1.4 同款处理）
  var NAV_SECTIONS = [
    { id: 'dashboard', type: 'item', label: '运营数据看板', href: '#', icon: 'home' },
    {
      label: '商品管理',
      items: [
        { id: 'mall-products', label: '在售商品中心', href: '#', icon: 'channel' }
      ]
    },
    {
      label: '前台配置',
      items: [
        { id: 'page-decoration', label: '商城页面装修', href: '#', icon: 'template' },
        { id: 'front-category', label: '前台分类管理', href: '#', icon: 'category' },
        { id: 'product-tag', label: '商品标签管理', href: '#', icon: 'tag' }
      ]
    },
    {
      label: '客户管理',
      items: [
        { id: 'mall-users', label: '商城用户列表', href: '#', icon: 'customer' }
      ]
    },
    {
      label: '营销管理',
      items: [
        { id: 'mall-points', label: '商城积分管理', href: '06.商城积分管理-原型页面.html', icon: 'points' },
        { id: 'coupon-issue', label: '卡券发放管理', href: '07.卡券发放管理-原型页面.html', icon: 'send' },
        { id: 'user-equity-overview', label: '用户权益总览', href: '08.用户权益总览-原型页面.html', icon: 'activity' }
      ]
    },
    {
      label: '订单监控',
      items: [
        { id: 'order-list', label: '用户订单列表', href: '#', icon: 'order' },
        { id: 'order-trade-config', label: '订单交易配置', href: '#', icon: 'settings' },
        { id: 'points-deduct-config', label: '积分抵扣配置', href: '#', icon: 'points' }
      ]
    },
    {
      label: '系统设置',
      items: [
        { id: 'corp-info', label: '企业信息', href: '#', icon: 'mall' },
        { id: 'org-structure', label: '组织架构', href: '#', icon: 'sitemap' },
        { id: 'role-permission', label: '角色权限', href: '#', icon: 'shield' },
        { id: 'operation-log', label: '操作日志', href: '#', icon: 'log' },
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
    try { page = decodeURIComponent(page); } catch (e) { /* 畸形 % 序列保留原值 */ }
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
        '<div class="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + ICONS.mall + '</svg>品牌商城后台</div>' +
        '<div class="sub">Brand Mall Admin</div>' +
      '</div>' +
      '<nav class="sidebar-nav">' + navHtml + '</nav>';
  }

  function toggleSection(label) {
    label.parentElement.classList.toggle('collapsed');
  }

  function ensureBadgeStyle() {
    if (document.getElementById('sidebar-badge-style')) return;
    var style = document.createElement('style');
    style.id = 'sidebar-badge-style';
    style.textContent = '.nav-item .badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:600;padding:1px 7px;border-radius:10px;min-width:20px;text-align:center;line-height:18px;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function init() {
    var container = document.getElementById('app-sidebar');
    if (container) {
      ensureBadgeStyle();
      renderSidebar(container);
    }
  }

  global.toggleSection = toggleSection;
  global.BrandSidebar = { init: init, render: renderSidebar, NAV_SECTIONS: NAV_SECTIONS };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
