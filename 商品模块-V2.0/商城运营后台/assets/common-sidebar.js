/**
 * 商城运营平台 - 公共侧边栏导航
 * 用法：页面 body 内放置 <aside class="sidebar" id="app-sidebar"></aside>
 *       可选 data-nav-active="nav-id" 覆盖自动高亮
 */
(function (global) {
  'use strict';

  var ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    search: '<circle cx="11" cy="11" r="6"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    pending: '<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/>',
    channel: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    category: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    brand: '<rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8.5" cy="10.5" r="2.5"/><path d="M21 15l-5-5L8.5 18"/>',
    template: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="8" x2="21" y2="8"/><rect x="5" y="11" width="6" height="7" rx="1"/><line x1="14" y1="11" x2="19" y2="11"/><line x1="14" y1="14" x2="19" y2="14"/><line x1="14" y1="17" x2="17" y2="17"/>',
    folder: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
    points: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
    coupon: '<rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="10"/>',
    order: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    aftersale: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
    customer: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    mall: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="15" x2="15" y2="15"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    log: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    platform: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>',
    logo: '<rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="11.49"/>',
    sitemap: '<rect x="9" y="3" width="6" height="6" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><path d="M12 9v3"/><path d="M5 15v-3h14v3"/>',
    'clipboard-check': '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    bell: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
    headset: '<path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>',
    combo: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="12" y="4" width="8" height="8" rx="1"/><rect x="4" y="12" width="9" height="8" rx="1"/><rect x="13" y="12" width="7" height="7" rx="1"/>',
    'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/>'
  };

  /** 子页面归属：详情/配置页高亮父级菜单 */
  var PAGE_ACTIVE_MAP = {
    '02a.定价推品配置页-原型页面.html': 'selection-list',
    '04a.商品详情页-原型页面.html': 'channel-products',
    '08a.商城装修编辑-原型页面.html': 'page-template',
    '14a.商城订单详情页-原型页面.html': 'order-list',
    '17.售后监控列表-原型页面.html': 'aftersale-list',
    '17a.售后详情页-原型页面.html': 'aftersale-list',
    '11a.卡券模板编辑-原型页面.html': 'coupon-template',
    '11b.卡券模板查看-原型页面.html': 'coupon-template',
    '12.卡券发放管理-原型页面.html': 'coupon-issue',
    '10c.平台代发-原型页面.html': 'points-list',
    '18a.客诉补偿发放-原型页面.html': 'compensation-stat',
    '10a.商城积分池明细-原型页面.html': 'points-list',
    '10b.积分池明细详情-原型页面.html': 'points-list',
    '13a.用户权益流水-原型页面.html': 'user-equity-overview',
    '28.平台信息-原型页面.html': 'platform-info',
    '30.支付配置-原型页面.html': 'pay-config',
    '32.快递配置-原型页面.html': 'express-config',
    '33.企微配置-原型页面.html': 'wecom-config',
    '34.客服配置-原型页面.html': 'cs-config',
    '25.组织架构-原型页面.html': 'org-structure',
    '26.角色权限-原型页面.html': 'role-permission',
    '27.系统日志-原型页面.html': 'system-log',
    '23.商城审批管理-原型页面.html': 'approval-management',
    '24.消息通知配置-原型页面.html': 'notification-config',
    '22.渠道用户列表-原型页面.html': 'channel-user-list',
    '16.积分抵扣配置-原型页面.html': 'payment-config',
    '19.客服工单列表-原型页面.html': 'cs-ticket-list',
    '31a.敏感词拦截记录-原型页面.html': 'sensitive-word',
    '36a.集采报价详情-原型页面.html': 'jicai-quotes',
    '37a.集采订单详情-原型页面.html': 'jicai-orders'
  };

  var NAV_SECTIONS = [
    {
      id: 'home',
      type: 'item',
      label: '工作台首页',
      href: '00.工作台首页-原型页面.html',
      icon: 'home'
    },
    {
      label: '选品管理',
      items: [
        { id: 'supply-pool', label: '供应链商品池', href: '01.供应链商品池-原型页面.html', icon: 'grid' },
        { id: 'selection-list', label: '选品清单管理', href: '02.选品清单管理-原型页面.html', icon: 'search' },
        { id: 'pending-selection', label: '待处理选品', href: '03.待处理选品-原型页面.html', icon: 'pending', badge: '8' },
        { id: 'channel-products', label: '渠道商品管理', href: '04.渠道商品管理-原型页面.html', icon: 'channel' },
        { id: 'jicai-products', label: '集采商品列表', href: '35.集采商品列表-原型页面.html', icon: 'combo' }
      ]
    },
    {
      label: '运营配置',
      items: [
        { id: 'front-category', label: '前台分类管理', href: '05.前台分类管理-原型页面.html', icon: 'category' },
        { id: 'product-tag', label: '商城标签管理', href: '06.商城标签管理-原型页面.html', icon: 'tag' },
        { id: 'product-brand', label: '商品品牌列表', href: '07.商品品牌列表-原型页面.html', icon: 'brand' }
      ]
    },
    {
      label: '商城装修',
      items: [
        { id: 'page-template', label: '页面模板管理', href: '08.页面模板管理-原型页面.html', icon: 'template' },
        { id: 'asset-library', label: '素材库', href: '09.素材库-原型页面.html', icon: 'folder' }
      ]
    },
    {
      label: '积分卡券',
      items: [
        { id: 'points-list', label: '商城积分列表', href: '10.商城积分列表-原型页面.html', icon: 'points' },
        { id: 'coupon-template', label: '卡券模板管理', href: '11.卡券模板列表-原型页面.html', icon: 'coupon' },
        { id: 'coupon-issue', label: '卡券发放管理', href: '12.卡券发放管理-原型页面.html', icon: 'send' },
        { id: 'user-equity-overview', label: '用户权益总览', href: '13.用户权益总览-原型页面.html', icon: 'activity' }
      ]
    },
    {
      label: '订单监控',
      items: [
        { id: 'order-list', label: '商城订单列表', href: '14.商城订单列表-原型页面.html', icon: 'order' },
        { id: 'order-config', label: '订单交易配置', href: '15.订单交易配置-原型页面.html', icon: 'settings' },
        { id: 'payment-config', label: '积分抵扣配置', href: '16.积分抵扣配置-原型页面.html', icon: 'credit-card' },
        { id: 'jicai-quotes', label: '集采报价管理', href: '36.集采报价管理-原型页面.html', icon: 'file-text' },
        { id: 'jicai-orders', label: '集采订单列表', href: '37.集采订单列表-原型页面.html', icon: 'order' }
      ]
    },
    {
      label: '售后管理',
      items: [
        { id: 'aftersale-list', label: '售后监控列表', href: '17.售后监控列表-原型页面.html', icon: 'aftersale' },
        { id: 'compensation-stat', label: '客诉补偿管理', href: '18.客诉补偿管理-原型页面.html', icon: 'gift' },
        { id: 'cs-ticket-list', label: '客服工单列表', href: '19.客服工单列表-原型页面.html', icon: 'headset' }
      ]
    },
    {
      label: '渠道管理',
      items: [
        { id: 'enterprise-customer', label: '企业客户列表', href: '20.企业客户列表-原型页面.html', icon: 'customer' },
        { id: 'brand-mall', label: '品牌商城列表', href: '21.品牌商城列表-原型页面.html', icon: 'mall' },
        { id: 'channel-user-list', label: '渠道用户列表', href: '22.渠道用户列表-原型页面.html', icon: 'share' }
      ]
    },
    {
      label: '协同管理',
      items: [
        { id: 'approval-management', label: '商城审批管理', href: '23.商城审批管理-原型页面.html', icon: 'clipboard-check' },
        { id: 'notification-config', label: '消息通知配置', href: '24.消息通知配置-原型页面.html', icon: 'bell' },
        { id: 'sensitive-word', label: '敏感词库管理', href: '31.敏感词库管理-原型页面.html', icon: 'activity' }
      ]
    },
    {
      label: '基础配置',
      items: [
        { id: 'pay-config', label: '支付配置', href: '30.支付配置-原型页面.html', icon: 'wallet' },
        { id: 'express-config', label: '快递配置', href: '32.快递配置-原型页面.html', icon: 'send' },
        { id: 'wecom-config', label: '企微配置', href: '33.企微配置-原型页面.html', icon: 'customer' },
        { id: 'cs-config', label: '客服配置', href: '34.客服配置-原型页面.html', icon: 'headset' }
      ]
    },
    {
      label: '系统设置',
      items: [
        { id: 'agreement', label: '协议管理', href: '29.协议管理-原型页面.html', icon: 'file-text' },
        { id: 'org-structure', label: '组织架构', href: '25.组织架构-原型页面.html', icon: 'sitemap' },
        { id: 'role-permission', label: '角色权限', href: '26.角色权限-原型页面.html', icon: 'shield' },
        { id: 'system-log', label: '系统日志', href: '27.系统日志-原型页面.html', icon: 'log' },
        { id: 'platform-info', label: '平台信息', href: '28.平台信息-原型页面.html', icon: 'platform' }
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
        '<div class="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + ICONS.logo + '</svg>商城运营平台</div>' +
        '<div class="sub">Mall Operations Platform</div>' +
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
  global.MallSidebar = { init: init, render: renderSidebar, NAV_SECTIONS: NAV_SECTIONS };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
