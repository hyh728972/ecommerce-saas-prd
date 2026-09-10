(function (w, d) {
  var PAGES = {
    order: '10.订单页-原型页面.html',
    points: '17.积分中心-原型页面.html',
    coupons: '18.我的卡券-原型页面.html',
    address: '21.收货地址-原型页面.html',
    refund: '12.售后记录-原型页面.html',
    help: '24.帮助中心-原型页面.html',
    login: '27.登录-原型页面.html'
  };

  var QUICK_REPLIES = [
    '查询订单物流',
    '如何申请售后',
    '苏银豆怎么用',
    '优惠券无法使用',
    '修改收货地址'
  ];

  var TOPIC_PROMPTS = {
    welcome: '您好，我是客服小苏，很高兴为您服务。请问有什么可以帮您？',
    order: '如需查询订单，请提供订单号，或登录后在「我的订单」中查看详情。',
    refund: '售后支持退货退款、换货与仅退款。您可在订单详情或售后记录中发起申请，我会协助您跟进进度。',
    points: '苏银豆 1 豆 = ¥0.01，可用于兑换或组合支付抵扣，不可提现。余额与明细请前往积分中心查看。',
    shipping: '发货后可在订单详情查看物流轨迹。分批发货时，不同包裹会分别展示物流信息。',
    account: '账户资料、收货地址可在个人中心修改。如遇到登录或安全问题，请描述具体情况。'
  };

  var ctx = { order: '', product: '', topic: 'welcome' };

  function isStandaloneHost() {
    return /26\.在线客服/.test(location.pathname || '') || /26\.在线客服/.test(location.href || '');
  }
  var mounted = false;
  var els = {};

  function pageUrl(key) {
    var pp = w.ProtoPages;
    return (pp && pp[key]) || PAGES[key] || '#';
  }

  function isLogged() {
    return w.ProtoAuth && w.ProtoAuth.isLogged && w.ProtoAuth.isLogged();
  }

  function ensureStyle() {
    if (d.getElementById('cs-widget-css')) return;
    var link = d.createElement('link');
    link.id = 'cs-widget-css';
    link.rel = 'stylesheet';
    link.href = '../assets/cs-widget.css';
    d.head.appendChild(link);
  }

  function mount() {
    if (mounted) return;
    ensureStyle();
    var overlay = d.createElement('div');
    overlay.className = 'cs-overlay';
    overlay.id = 'csOverlay';
    overlay.innerHTML =
      '<div class="cs-modal" role="dialog" aria-label="在线客服">' +
      '<button type="button" class="cs-close" id="csCloseBtn" aria-label="关闭">×</button>' +
      '<div class="cs-layout">' +
      '<aside class="cs-side">' +
      '<div class="cs-side-head"><div class="cs-avatar">苏</div><h2>客服小苏</h2><p>企业福利购物顾问</p></div>' +
      '<div class="cs-meta"><div><strong>服务时间</strong> 工作日 9:00–18:00</div>' +
      '<div><strong>客服热线</strong> 400-888-6688</div><div><strong>平均响应</strong> &lt; 30 秒</div></div>' +
      '<div class="cs-topics"><h3>常见问题</h3>' +
      '<button type="button" class="cs-topic active" data-topic="welcome">开始咨询</button>' +
      '<button type="button" class="cs-topic" data-topic="order">订单查询</button>' +
      '<button type="button" class="cs-topic" data-topic="refund">售后退换</button>' +
      '<button type="button" class="cs-topic" data-topic="points">苏银豆积分</button>' +
      '<button type="button" class="cs-topic" data-topic="shipping">配送物流</button>' +
      '<button type="button" class="cs-topic" data-topic="account">账户问题</button></div>' +
      '<div class="cs-side-foot">也可前往 <a href="' + pageUrl('help') + '">帮助中心</a> 自助查询</div>' +
      '</aside>' +
      '<section class="cs-chat">' +
      '<div class="cs-chat-head"><h1>在线客服</h1><span class="cs-status">客服在线</span></div>' +
      '<div class="cs-messages" id="csMessages"></div>' +
      '<div class="cs-quick" id="csQuick"></div>' +
      '<div class="cs-input-bar">' +
      '<div class="cs-input-wrap"><button type="button" class="cs-tool" id="csAttachBtn" title="上传图片">📎</button>' +
      '<textarea id="csInput" rows="1" placeholder="请输入您的问题，Enter 发送，Shift+Enter 换行" maxlength="500"></textarea></div>' +
      '<button type="button" class="cs-send" id="csSendBtn">发送</button></div>' +
      '</section></div></div>';
    d.body.appendChild(overlay);

    els.overlay = overlay;
    els.messages = d.getElementById('csMessages');
    els.input = d.getElementById('csInput');
    els.send = d.getElementById('csSendBtn');
    els.quick = d.getElementById('csQuick');

    d.getElementById('csCloseBtn').onclick = close;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    els.send.onclick = function () { sendUserMessage(els.input.value); };
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendUserMessage(els.input.value);
      }
    });
    d.getElementById('csAttachBtn').onclick = function () {
      if (w.ProtoToast) w.ProtoToast.info('图片上传（原型演示）');
    };
    overlay.querySelectorAll('.cs-topic').forEach(function (btn) {
      btn.onclick = function () {
        overlay.querySelectorAll('.cs-topic').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var topic = btn.getAttribute('data-topic');
        if (topic === 'welcome') return;
        sendUserMessage(TOPIC_PROMPTS[topic].split('。')[0] + '？');
      };
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });

    mounted = true;
  }

  function nowTime() {
    var dt = new Date();
    return (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
  }

  function scrollToBottom() {
    if (els.messages) els.messages.scrollTop = els.messages.scrollHeight;
  }

  function appendMessage(role, text, extraHtml) {
    var html = '<div class="cs-msg ' + role + '">' +
      '<div class="cs-msg-avatar">' + (role === 'bot' ? '苏' : '我') + '</div>' +
      '<div><div class="cs-bubble">' + text + (extraHtml || '') + '</div>' +
      '<div class="cs-time">' + nowTime() + '</div></div></div>';
    els.messages.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
  }

  function botReply(userText) {
    var reply = '收到您的问题，客服小苏正在为您核实，请稍候。';
    var extra = '';

    if (/订单|物流|发货|到哪/.test(userText)) {
      reply = ctx.order
        ? '已为您定位订单 ' + ctx.order + '。商品发出后可在订单详情查看物流，如需催发货请说明具体商品。'
        : '请提供订单号，或登录后点击「我的订单」查看。未登录用户可先登录以便查询关联订单。';
      if (!isLogged()) {
        extra = '<div class="cs-card"><a href="' + pageUrl('login') + '?redirect=' + encodeURIComponent(pageUrl('order')) + '">去登录查看订单</a></div>';
      } else {
        extra = '<div class="cs-card"><a href="' + pageUrl('order') + '">前往我的订单</a></div>';
      }
    } else if (/售后|退货|退款|换货/.test(userText)) {
      reply = '您可在订单详情发起售后，或在售后记录查看进度。退货退款需按指引寄回商品。';
      extra = '<div class="cs-card"><a href="' + pageUrl('refund') + '">售后记录</a> · <a href="' + pageUrl('help') + '">退换货政策</a></div>';
    } else if (/苏银豆|积分|豆/.test(userText)) {
      reply = TOPIC_PROMPTS.points;
      extra = '<div class="cs-card"><a href="' + pageUrl('points') + '">积分中心</a></div>';
    } else if (/优惠券|卡券|卡密/.test(userText)) {
      reply = '结算时可选择可用优惠券；卡密可在积分中心或我的卡券兑换绑定。';
      extra = '<div class="cs-card"><a href="' + pageUrl('coupons') + '">我的卡券</a></div>';
    } else if (/地址|收货/.test(userText)) {
      reply = '您可在收货地址管理中新增或修改地址，结算时将默认选中默认地址。';
      extra = '<div class="cs-card"><a href="' + pageUrl('address') + '">收货地址</a></div>';
    } else if (/人工|转接/.test(userText)) {
      reply = '正在为您转接人工客服（原型演示）。工作日 9:00–18:00 也可拨打 400-888-6688。';
    } else if (/你好|您好|在吗/.test(userText)) {
      reply = TOPIC_PROMPTS.welcome;
    }

    setTimeout(function () {
      appendMessage('bot', reply, extra);
    }, 500 + Math.random() * 350);
  }

  function sendUserMessage(text) {
    var msg = (text || '').trim();
    if (!msg) return;
    appendMessage('user', msg.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    els.input.value = '';
    els.send.disabled = true;
    botReply(msg);
    setTimeout(function () {
      els.send.disabled = false;
      els.input.focus();
    }, 280);
  }

  function renderQuick() {
    els.quick.innerHTML = QUICK_REPLIES.map(function (q) {
      return '<button type="button" class="cs-chip" data-q="' + q + '">' + q + '</button>';
    }).join('');
    els.quick.querySelectorAll('.cs-chip').forEach(function (btn) {
      btn.onclick = function () { sendUserMessage(btn.getAttribute('data-q')); };
    });
  }

  function resetSession(opts) {
    opts = opts || {};
    ctx.order = opts.order || '';
    ctx.product = opts.product || '';
    ctx.topic = opts.topic || 'welcome';
    els.messages.innerHTML = '';
    els.overlay.querySelectorAll('.cs-topic').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-topic') === 'welcome');
    });
    renderQuick();
    appendMessage('bot', TOPIC_PROMPTS.welcome);
    if (ctx.product) {
      setTimeout(function () {
        appendMessage('bot', '看到您正在咨询商品「' + ctx.product + '」，如需规格、库存或配送说明，请直接提问。');
      }, 350);
    }
    if (ctx.order) {
      setTimeout(function () {
        appendMessage('bot', '已带入订单号 ' + ctx.order + '，您可继续描述问题，我会协助查询。');
      }, 600);
    }
  }

  function open(opts) {
    mount();
    resetSession(opts || {});
    els.overlay.classList.add('active');
    if (!isStandaloneHost()) d.body.style.overflow = 'hidden';
    setTimeout(function () { els.input.focus(); }, 120);
  }

  function close() {
    if (!mounted) return;
    els.overlay.classList.remove('active');
    d.body.style.overflow = '';
  }

  function bindTriggers() {
    d.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-cs-open]');
      if (trigger) {
        e.preventDefault();
        openStandalone({
          topic: trigger.getAttribute('data-cs-topic') || '',
          order: trigger.getAttribute('data-cs-order') || '',
          product: trigger.getAttribute('data-cs-product') || ''
        });
        return;
      }
      var legacy = e.target.closest('a[href*="26.在线客服"]');
      if (legacy) {
        e.preventDefault();
        var href = legacy.getAttribute('href') || '';
        var q = href.indexOf('?') >= 0 ? href.slice(href.indexOf('?') + 1) : '';
        var params = new URLSearchParams(q);
        openStandalone({
          topic: params.get('topic') || '',
          order: params.get('order') || '',
          product: params.get('product') ? decodeURIComponent(params.get('product')) : ''
        });
      }
    });
  }

  /* 页面内入口 → 新窗口打开独立客服页（淘宝式）；ProtoCS.open 弹窗保留给悬浮栏轻咨询 */
  function openStandalone(opts) {
    var base = (w.ProtoPages && w.ProtoPages.csStandalone) || '26A.在线客服(新版)-原型页面.html';
    var q = [];
    if (opts && opts.topic) q.push('topic=' + encodeURIComponent(opts.topic));
    if (opts && opts.order) q.push('order=' + encodeURIComponent(opts.order));
    if (opts && opts.product) q.push('product=' + encodeURIComponent(opts.product));
    var url = base + (q.length ? '?' + q.join('&') : '');
    w.open(url, '_blank', 'width=1040,height=720');
  }

  w.ProtoCS = { open: open, close: close, init: mount, openStandalone: openStandalone };
  bindTriggers();
})(window, document);
