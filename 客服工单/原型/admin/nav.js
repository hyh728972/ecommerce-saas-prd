/**
 * CS 商城客服系统 — 公共导航
 * 所有管理端页面共享此文件，侧边栏由 renderSidebar() 渲染到 #sidebar-nav。
 *
 * 使用方式：
 *   1. <aside class="admin-sidebar" id="sidebar-nav" data-active="dashboard"></aside>
 *   2. <script src="nav.js"></script>
 *
 * 菜单结构：部分项独立为一级、部分项归入可折叠分组。
 *   { type:'item',  id, label, href }                         —— 一级独立项
 *   { type:'group', label, icon, items:[{id,label,href}] }    —— 分组（可折叠）
 *   含当前页(data-active)的分组默认展开，其余默认折叠。
 */

const MENU_DATA = [
  { type: 'item', id: 'dashboard', label: '数据仪表盘', href: 'admin-dashboard.html', version: 'V2.0', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  {
    type: 'group', label: '会话管理', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    items: [
      { id: 'workbench',      label: '客服工作台', href: 'admin-workbench.html', version: 'V1.0' },
      { id: 'todo',           label: '待办事项',   href: 'admin-todo.html', version: 'V1.0' },
      { id: 'session-record', label: '会话记录',   href: 'admin-session-record.html', version: 'V1.0' },
      { id: 'transfer',       label: '会话转接',   href: 'admin-transfer.html', version: 'V1.0' },
      { id: 'rating',         label: '评价管理',   href: 'admin-rating-mgmt.html', version: 'V1.0' },
    ]
  },
  {
    type: 'group', label: '订单与售后', icon: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    items: [
      /* 订单列表为「商城运营后台」复刻页(自带侧栏、无返回入口),跨系统跳转,始终新开页签 */
      { id: 'order-list', label: '订单列表', href: 'admin-order-list.html', version: 'V0.5', blank: true },
      /* 客服工单属订单与售后模块(2026-07-27:迁入本分组+骨架换商城运营后台,同订单列表跨系统新开页签) */
      { id: 'ticket',     label: '客服工单', href: 'admin-ticket.html', version: 'V1.5', blank: true },
    ]
  },
  {
    type: 'group', label: '知识库', icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    items: [
      { id: 'scripts',   label: '话术库', href: 'admin-scripts.html', version: 'V1.0' },
      { id: 'faq',       label: 'FAQ',   href: 'admin-faq.html', version: 'V1.0' },
      { id: 'knowledge', label: '知识文档', href: 'admin-knowledge.html', version: 'V3.0' },
    ]
  },
  {
    type: 'group', label: '客服设置', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09c-.658.003-1.25.396-1.51 1z"/>',
    items: [
      { id: 'session-rule', label: '会话规则', href: 'admin-settings.html', version: 'V1.0' },
      /* 工单设置(工单配置)2026-07-27 十轮:移入商城运营后台侧栏「系统设置」组(mo 页面 4 个),本组不再挂 */
      { id: 'autoreply',    label: '自动回复', href: 'admin-auto-reply.html', version: 'V1.0' },
    ]
  },
];

/**
 * 渲染侧边栏到 #sidebar-nav 容器；读取 data-active 决定高亮项与展开分组。
 */
function renderSidebar() {
  const el = document.getElementById('sidebar-nav');
  if (!el) return;
  const activeId = el.getAttribute('data-active') || '';

  let html = '<div class="logo">客服模块</div>';

  MENU_DATA.forEach(entry => {
    if (entry.type === 'group') {
      // 默认铺开（不折叠）
      html += '<div class="nav-group">';
      html += '<div class="nav-group-head">';
      html += '<svg class="gp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' + entry.icon + '</svg>';
      html += '<span class="gp-label">' + entry.label + '</span>';
      html += '<svg class="gp-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div>';
      html += '<div class="nav-group-body">';
      entry.items.forEach(it => {
        const isActive = it.id === activeId ? ' active' : '';
        // 跨「工作台边界」才新开页签：点的菜单与当前页分处工作台/非工作台两侧 → target="_blank"（异或）;blank 项(跨系统)始终新开
        const openNew = (it.id === 'workbench') !== (activeId === 'workbench');
        const t = (openNew || it.blank) ? ' target="_blank"' : '';
        html += '<a href="' + it.href + '" class="menu-item nav-sub' + isActive + '"' + t + '>' + it.label + (it.version ? '<span class="menu-ver">' + it.version + '</span>' : '') + '</a>';
      });
      html += '</div></div>';
    } else {
      const isActive = entry.id === activeId ? ' active' : '';
      const openNew = (entry.id === 'workbench') !== (activeId === 'workbench');
      const t = (openNew || entry.blank) ? ' target="_blank"' : '';
      const iconSvg = entry.icon ? '<svg class="gp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="vertical-align:-2px;margin-right:8px;">' + entry.icon + '</svg>' : '';
      html += '<a href="' + entry.href + '" class="menu-item' + isActive + '"' + t + '>' + iconSvg + entry.label + (entry.version ? '<span class="menu-ver">' + entry.version + '</span>' : '') + '</a>';
    }
  });

  el.innerHTML = html;

  // 分组折叠：点分组头切换
  el.querySelectorAll('.nav-group-head').forEach(function (head) {
    head.addEventListener('click', function () { head.parentElement.classList.toggle('collapsed'); });
  });
}

// 自动渲染
document.addEventListener('DOMContentLoaded', renderSidebar);
