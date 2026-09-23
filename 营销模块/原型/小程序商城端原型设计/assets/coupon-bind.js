/**
 * 卡密兑换（小程序原型）
 * 独立页面：41.卡密兑换；兑换后跳转积分中心或我的卡包
 */
(function(window) {
  var PAGES = {
    bind: '73.卡密兑换-原型页面.html',
    points: '71.积分中心-原型页面.html',
    coupons: '74.我的卡券-原型页面.html'
  };

  var history = [
    { type: '满减券', secret: '****8821', time: '2026-06-01 10:20', result: '满200减20' },
    { type: '积分卡', secret: '****3390', time: '2026-05-18 16:45', result: '5000苏银豆' }
  ];

  function detectType(secret) {
    var s = (secret || '').trim().toUpperCase();
    if (!s) return '';
    if (/^MJ/.test(s)) return '满减券';
    if (/^ZK/.test(s)) return '折扣券';
    if (/^JF|^SY/.test(s)) return '积分卡';
    if (/^MV|^DY/.test(s)) return '电影次卡';
    if (/^LP|^GIFT/.test(s)) return '礼品卡';
    return '优惠券';
  }

  function updateDetectPreview() {
    var el = document.getElementById('couponBindDetect');
    if (!el) return;
    var secretEl = document.getElementById('couponBindSecret');
    var secret = secretEl ? secretEl.value.trim() : '';
    var type = detectType(secret);
    if (!secret) {
      el.textContent = '输入卡密后将显示类型';
      el.className = 'coupon-bind-detect pending';
      return;
    }
    el.textContent = type;
    el.className = 'coupon-bind-detect';
  }

  function renderHistory() {
    var el = document.getElementById('couponBindHistory');
    if (!el) return;
    if (!history.length) {
      el.innerHTML = '<div class="coupon-bind-history-item" style="color:#999">暂无兑换记录</div>';
      return;
    }
    el.innerHTML = history.slice(0, 5).map(function(h) {
      return '<div class="coupon-bind-history-item">' + h.result + ' · ' + h.type +
        '<span>' + h.secret + ' · ' + h.time + '</span></div>';
    }).join('');
  }

  function maskSecret(secret) {
    if (secret.length <= 4) return '****';
    return '****' + secret.slice(-4);
  }

  function mockCoupon(type) {
    var map = {
      '优惠券': { n: '¥30优惠券', d: '满200可用', e: '2026-09-30' },
      '满减券': { n: '满300减30', d: '全场通用', e: '2026-08-31' },
      '折扣券': { n: '9.5折券', d: '指定品类 最高减100', e: '2026-08-15' },
      '积分卡': { n: '5000苏银豆', d: '绑定后直充账户', e: '2026-12-31' },
      '电影次卡': { n: '电影次卡×2', d: '全国通用', e: '2026-10-01' },
      '礼品卡': { n: '¥200礼品卡', d: '蛋糕叔叔品牌通用', e: '2027-07-15' }
    };
    return map[type] || { n: '新卡券', d: '兑换成功', e: '2026-12-31' };
  }

  function isPointsType(type) {
    return type === '积分卡';
  }

  function parsePointsAmount(coupon) {
    var m = (coupon.n || '').match(/([\d,]+)/);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : 5000;
  }

  function nowStr() {
    var d = new Date();
    var p = function(n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function routeAfterBind(coupon, meta) {
    var payload = {
      action: isPointsType(meta.type) ? 'points' : 'coupon',
      coupon: coupon,
      meta: meta,
      amount: isPointsType(meta.type) ? parsePointsAmount(coupon) : 0
    };
    try {
      sessionStorage.setItem('couponBindResult', JSON.stringify(payload));
    } catch (e) {
      window.__couponBindResult = payload;
    }
    location.href = payload.action === 'points' ? PAGES.points : PAGES.coupons;
  }

  function consumeBindResult() {
    var raw = null;
    try {
      raw = sessionStorage.getItem('couponBindResult');
      if (raw) sessionStorage.removeItem('couponBindResult');
    } catch (e) {}
    if (!raw && window.__couponBindResult) {
      var tmp = window.__couponBindResult;
      window.__couponBindResult = null;
      return tmp;
    }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function submit() {
    var secretEl = document.getElementById('couponBindSecret');
    var secret = secretEl ? secretEl.value.trim() : '';
    if (!secret) {
      alert('请输入卡密');
      return;
    }
    var type = detectType(secret);
    if (!type) {
      alert('无法识别卡券类型，请检查卡密是否正确');
      return;
    }
    var coupon = mockCoupon(type);
    history.unshift({
      type: type,
      secret: maskSecret(secret),
      time: nowStr().slice(0, 16),
      result: coupon.n
    });
    renderHistory();
    routeAfterBind(coupon, { type: type, secret: secret });
  }

  function initPage() {
    var secretInput = document.getElementById('couponBindSecret');
    if (!secretInput) return;
    secretInput.oninput = updateDetectPreview;
    var confirmBtn = document.getElementById('couponBindConfirm');
    if (confirmBtn) confirmBtn.onclick = submit;
    updateDetectPreview();
    renderHistory();
    secretInput.focus();
  }

  window.CouponBind = {
    initPage: initPage,
    consumeBindResult: consumeBindResult,
    detectType: detectType,
    PAGES: PAGES
  };
})(window);
