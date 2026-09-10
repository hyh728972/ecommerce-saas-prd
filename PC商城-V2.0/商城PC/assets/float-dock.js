(function (w) {
  var PP = w.ProtoPages || {};
  var HOME = PP.home || '01.首页-原型页面.html';
  var PAGES = {
    order: PP.order || '10.订单页-原型页面.html',
    points: PP.points || '17.积分中心-原型页面.html',
    coupon: PP.coupons || '18.我的卡券-原型页面.html',
    cart: PP.cart || '06.购物车-原型页面.html'
  };

  var BACK_TOP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/><path d="M5 19h14"/></svg>';

  var NAV = [
    { icon: 'grid', label: '首页', action: goHome },
    { icon: 'list', label: '订单', href: PAGES.order },
    { icon: 'bean', label: '积分', href: PAGES.points },
    { icon: 'ticket', label: '卡券', href: PAGES.coupon },
    { icon: 'cart', label: '购物车', href: PAGES.cart, badge: true },
    { icon: 'chat', label: '客服', action: openService }
  ];

  var state = { cartCount: 15, scrollThreshold: 400 };
  var floorCfg = null;
  var floorScrollBound = false;
  var floorSections = [];

  function shortFloorLabel(title) {
    if (!title) return '';
    var t = String(title).split('/')[0].trim();
    return t.length > 5 ? t.slice(0, 5) : t;
  }

  function isHomePage() {
    var name = (location.pathname || '').split(/[/\\]/).pop() || '';
    return decodeURIComponent(location.href).indexOf(HOME) !== -1 || name === HOME;
  }

  function goHome() {
    if (isHomePage()) w.scrollTo({ top: 0, behavior: 'smooth' });
    else location.href = HOME;
  }

  function ensureCsWidget(cb) {
    if (w.ProtoCS) {
      if (cb) cb();
      return;
    }
    if (document.getElementById('cs-widget-js')) {
      var n = 0;
      var timer = setInterval(function () {
        n += 1;
        if (w.ProtoCS) {
          clearInterval(timer);
          if (cb) cb();
        } else if (n > 40) clearInterval(timer);
      }, 50);
      return;
    }
    var s = document.createElement('script');
    s.id = 'cs-widget-js';
    s.src = '../assets/cs-widget.js';
    s.onload = function () { if (cb) cb(); };
    document.body.appendChild(s);
  }

  function openService() {
    ensureCsWidget(function () {
      /* 悬浮栏客服也走新版独立页（新窗口），与页面内入口一致 */
      if (w.ProtoCS) w.ProtoCS.openStandalone();
    });
  }

  function mount() {
    if (document.getElementById('floatDock')) return;
    var floor = document.createElement('div');
    floor.id = 'floatFloorNav';
    floor.className = 'float-floor-left';
    document.body.appendChild(floor);

    var dock = document.createElement('div');
    dock.id = 'floatDock';
    dock.className = 'float-dock';
    dock.innerHTML =
      '<div class="float-dock-main" id="floatDockMain"></div>' +
      '<div class="float-dock-top" id="floatDockTop">' +
      '<div class="float-dock-item" id="floatBackTop">' +
      '<span class="dock-icon">' + BACK_TOP_SVG + '</span>' +
      '<span class="dock-label">回顶部</span></div></div>';
    document.body.appendChild(dock);

    var main = document.getElementById('floatDockMain');
    main.innerHTML = NAV.map(function (item) {
      var iconInner = item.badge
        ? '<span class="dock-icon-wrap">' +
          '<span class="dock-icon" data-proto-icon="' + item.icon + '" data-icon-size="20"></span>' +
          '<span class="dock-badge" id="floatCartBadge"></span></span>'
        : '<span class="dock-icon" data-proto-icon="' + item.icon + '" data-icon-size="20"></span>';
      if (item.href) {
        return '<a class="float-dock-item" href="' + item.href + '">' +
          iconInner +
          '<span class="dock-label">' + item.label + '</span></a>';
      }
      return '<div class="float-dock-item" data-action="' + item.label + '">' +
        iconInner +
        '<span class="dock-label">' + item.label + '</span></div>';
    }).join('');

    if (w.ProtoIcon) w.ProtoIcon.mount(dock);

    NAV.forEach(function (item, i) {
      if (!item.action) return;
      var el = main.children[i];
      if (el) el.onclick = item.action;
    });

    document.getElementById('floatBackTop').onclick = function () {
      w.scrollTo({ top: 0, behavior: 'smooth' });
    };

    updateCartBadge();
    bindScroll();
  }

  function updateCartBadge() {
    var badge = document.getElementById('floatCartBadge');
    if (!badge) return;
    if (state.cartCount > 0) {
      badge.textContent = state.cartCount > 99 ? '99+' : String(state.cartCount);
    } else {
      badge.textContent = '';
    }
  }

  function bindScroll() {
    var topBtn = document.getElementById('floatDockTop');
    if (!topBtn) return;
    var onScroll = function () {
      topBtn.classList.toggle('visible', w.scrollY > state.scrollThreshold);
    };
    w.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function bindFloorNavBehavior(floors) {
    var el = document.getElementById('floatFloorNav');
    if (!el || !floors.length) return;

    var sections = floors.map(function (f) {
      return document.getElementById(f.id);
    }).filter(Boolean);

    floorSections = sections;

    el.querySelectorAll('.float-floor-item').forEach(function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        var sec = document.getElementById(a.getAttribute('data-floor-id'));
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });

    if (floorScrollBound) {
      updateFloorNavActive();
      return;
    }
    floorScrollBound = true;

    var ticking = false;
    function onScrollFloorNav() {
      if (ticking) return;
      ticking = true;
      w.requestAnimationFrame(function () {
        ticking = false;
        updateFloorNavActive();
      });
    }

    w.addEventListener('scroll', onScrollFloorNav, { passive: true });
    updateFloorNavActive();
  }

  function updateFloorNavActive() {
    var el = document.getElementById('floatFloorNav');
    var sections = floorSections;
    if (!el || !sections.length) return;

    var firstRect = sections[0].getBoundingClientRect();
    var lastRect = sections[sections.length - 1].getBoundingClientRect();
    var inFloorRange = firstRect.top < w.innerHeight && lastRect.bottom > 0;
    el.classList.toggle('visible', inFloorRange);

    if (!inFloorRange) return;

    var offset = w.innerHeight * 0.32;
    var scrollY = w.scrollY;
    var activeId = sections[0].id;
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].getBoundingClientRect().top + scrollY;
      if (scrollY + offset >= top) activeId = sections[i].id;
    }
    el.querySelectorAll('.float-floor-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-floor-id') === activeId);
    });
  }

  function renderFloorNav(cfg) {
    floorCfg = cfg;
    var el = document.getElementById('floatFloorNav');
    if (!el) return;
    if (!cfg || !cfg.floors || !cfg.floors.length) {
      el.innerHTML = '';
      el.classList.remove('visible');
      return;
    }
    el.innerHTML = cfg.floors.map(function (f) {
      var floorTag = f.floor || '';
      var title = f.label || '';
      return '<a class="float-floor-item" href="#' + f.id + '" data-floor-id="' + f.id + '">' +
        (floorTag ? '<span class="fi">' + floorTag + '</span>' : '') +
        title + '</a>';
    }).join('');
    bindFloorNavBehavior(cfg.floors);
  }

  function bindFloorNav(opts) {
    opts = opts || {};
    var floors = typeof opts.getFloors === 'function' ? opts.getFloors() : (opts.floors || []);
    renderFloorNav({
      floors: floors.map(function (f) {
        return {
          id: f.id,
          floor: f.floor || '',
          label: shortFloorLabel(f.title || f.label || '')
        };
      })
    });
  }

  w.FloatDock = {
    init: function (options) {
      state = Object.assign(state, options || {});
      mount();
    },
    setCartCount: function (n) {
      state.cartCount = n;
      updateCartBadge();
    },
    setFloorNav: renderFloorNav,
    bindFloorNav: bindFloorNav
  };

  // 原型导航（评审工具）：随悬浮栏一起注入，引入 float-dock.js 的页面自动生效
  (function injectProtoNav() {
    if (w.__protoNavInjected) return;
    w.__protoNavInjected = true;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '../assets/proto-nav.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = '../assets/proto-nav.js';
    document.body.appendChild(js);
  })();
})(window);
