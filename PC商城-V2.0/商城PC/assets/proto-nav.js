/* 原型导航（评审工具）：仅收录含在线客服入口的页面，分组 + 状态标记 + 当前页高亮 */
(function (w, d) {
  // done = 客服入口已存在；todo = 待补（验收时逐个转 done）
  var GROUPS = [
    {
      name: '商品咨询',
      pages: [
        { file: '05.商品详情页-原型页面.html', label: '商品详情', done: true }
      ]
    },
    {
      name: '交易流程',
      pages: [
        { file: '06.购物车-原型页面.html', label: '购物车', done: true },
        { file: '07.结算付款-原型页面.html', label: '结算付款', done: true },
        { file: '08.支付成功-原型页面.html', label: '支付成功', done: true },
        { file: '09.支付失败-订单关闭-原型页面.html', label: '支付失败', done: true }
      ]
    },
    {
      name: '订单售后',
      pages: [
        { file: '10.订单页-原型页面.html', label: '订单页', done: true },
        { file: '11.订单详情-原型页面.html', label: '订单详情', done: true },
        { file: '12.售后记录-原型页面.html', label: '售后记录', done: true },
        { file: '13.申请售后-原型页面.html', label: '申请售后', done: true },
        { file: '14.售后详情-原型页面.html', label: '售后详情', done: true }
      ]
    },
    {
      name: '个人中心',
      pages: [
        { file: '17.积分中心-原型页面.html', label: '积分中心', done: true },
        { file: '25.设置-原型页面.html', label: '设置', done: true }
      ]
    },
    {
      name: '服务支持',
      pages: [
        { file: '24.帮助中心-原型页面.html', label: '帮助中心', done: true },
        { file: '26.在线客服-原型页面.html', label: '在线客服', done: true }
      ]
    }
  ];

  function currentPage() {
    return decodeURIComponent((location.pathname || '').split(/[\/\\]/).pop() || '');
  }

  function mount() {
    if (d.getElementById('protoNav')) return;
    var cur = currentPage();
    var inScope = GROUPS.some(function (g) {
      return g.pages.some(function (p) { return p.file === cur; });
    });

    var nav = d.createElement('div');
    nav.className = 'proto-nav';
    nav.id = 'protoNav';
    nav.innerHTML =
      '<button type="button" class="proto-nav-toggle"><span class="pn-dot"></span>原型导航 · 客服页面<span class="pn-arrow">▲</span></button>' +
      '<div class="proto-nav-panel">' +
      '<div class="proto-nav-hd"><strong>在线客服 · 页面清单</strong><em>' + (inScope ? '当前页在清单内' : '当前页不在清单内') + '</em></div>' +
      GROUPS.map(function (g) {
        return '<div class="proto-nav-group"><h4>' + g.name + '</h4><div class="proto-nav-items">' +
          g.pages.map(function (p) {
            var cls = 'proto-nav-item' + (p.file === cur ? ' current' : '') + (p.done ? ' done' : ' todo');
            return '<a class="' + cls + '" href="' + p.file + '" title="' + p.file + '">' +
              '<span class="st">' + (p.done ? '●' : '○') + '</span>' + p.label +
              (p.file === cur ? ' ✓' : '') + '</a>';
          }).join('') +
          '</div></div>';
      }).join('') +
      '<div class="proto-nav-legend">● 客服入口已就位　○ 待补　✓ 当前页 · 点击跳转</div>' +
      '</div>';
    d.body.appendChild(nav);

    var toggle = nav.querySelector('.proto-nav-toggle');
    toggle.onclick = function () { nav.classList.toggle('open'); };
    d.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(e.target)) nav.classList.remove('open');
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount);
  else mount();

  w.ProtoNav = { mount: mount };
})(window, document);
