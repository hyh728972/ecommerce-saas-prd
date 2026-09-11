/* ============================================================
   cs-modal.js — 弹窗抽离通用运行时
   ------------------------------------------------------------
   适配 file:// 直开：用 <iframe> 加载独立弹窗 HTML，postMessage 桥接。
   宿主页（admin/user 各 .html）引入本文件后用 window.csModal 调用：
     csModal.open('modals/modal-suspend.html', {
       variant: 'center',          // center | drawer-right | sheet
       width: 480,                 // 可选，覆盖默认宽度
       onConfirm: function(payload){ ... },   // 弹窗内确认时回调
       onClose:   function(){ ... }           // 关闭时回调
     });
   弹窗页（modals/*.html）内调用注入的桥接对象：
     window.csModalBridge.confirm({ reason: '...', resume: 30 });
     window.csModalBridge.close();
   弹窗页加载完成会自动向父窗 postMessage {event:'ready'}，
   父窗据此淡入遮罩，避免闪烁。
   ============================================================ */
(function () {
  'use strict';

  var MSG_TYPE = 'cs-modal';
  // 每个实例自增 id，便于多实例（理论上同时只开一个，但留扩展）
  var seq = 0;
  var stack = []; // 当前打开的实例栈

  function open(url, opts) {
    opts = opts || {};
    var variant = opts.variant || 'center';
    seq += 1;
    var id = 'csm-' + seq;

    var host = document.createElement('div');
    host.className = 'csm-host ' + variant;
    host.id = id;
    host.setAttribute('data-csm', '');

    var frame = document.createElement('iframe');
    frame.className = 'csm-frame';
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('allowtransparency', 'true');
    frame.style.background = 'transparent';
    if (opts.width) {
      frame.style.width = opts.width + 'px';
    }

    host.appendChild(frame);
    document.body.appendChild(host);
    document.body.style.overflow = 'hidden';

    // 阻止点击 iframe 内部时冒泡到 host（host 点击空白处会关闭）
    frame.addEventListener('load', function () {
      // 主动通知「可淡入」
      try {
        frame.contentWindow.postMessage({ type: MSG_TYPE, event: 'parent-ready' }, '*');
      } catch (e) {}
      // 自动调整 iframe 高度 = 内容高度（center/sheet 变体）
      autoHeight(frame, variant);
    });

    // 点击遮罩空白（非 iframe 区域）→ 关闭
    host.addEventListener('click', function (e) {
      if (e.target === host) {
        close(id, null, /*byBackdrop*/ true);
      }
    });

    var instance = {
      id: id,
      host: host,
      frame: frame,
      opts: opts,
      closed: false
    };
    stack.push(instance);

    // 真正设置 src（放在最后，确保 load 监听已挂好）
    frame.src = url;

    // 下一帧淡入
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { host.classList.add('show'); });
    });

    return id;
  }

  // center / sheet 变体：让 iframe 高度贴合内容（解决 iframe 固定高度问题）
  function autoHeight(frame, variant) {
    if (variant === 'drawer-right') return; // 抽屉占满整高
    try {
      var doc = frame.contentDocument || frame.contentWindow.document;
      var h = doc.body ? doc.body.scrollHeight : 0;
      if (h && h > 0) {
        frame.style.height = h + 'px';
      }
    } catch (e) { /* 跨域时忽略（本原型同源 file:// 下不会触发） */ }
  }

  // 弹窗内调用关闭 / 确认
  function close(id, payload, byBackdrop) {
    var idx = -1;
    var inst = null;
    for (var i = 0; i < stack.length; i++) {
      if (stack[i].id === id) { idx = i; inst = stack[i]; break; }
    }
    if (!inst || inst.closed) return;
    inst.closed = true;

    inst.host.classList.remove('show');
    // 动画结束后移除 DOM
    setTimeout(function () {
      if (inst.host.parentNode) inst.host.parentNode.removeChild(inst.host);
    }, 300);

    stack.splice(idx, 1);
    if (stack.length === 0) document.body.style.overflow = '';

    // 回调
    if (!byBackdrop && typeof inst.opts.onConfirm === 'function' && payload !== undefined) {
      // payload 来自 confirm 事件
    }
    if (typeof inst.opts.onClose === 'function') {
      inst.opts.onClose(payload || null, inst.opts);
    }
  }

  // 关闭栈顶实例（供 ESC / 外部调用）
  function closeTop(payload) {
    if (stack.length) {
      var top = stack[stack.length - 1];
      close(top.id, payload, false);
    }
  }

  // 轻提示 toast（移动端「+」面板图标等不需要弹窗的反馈）
  var toastTimer = null;
  function toast(text, duration) {
    var old = document.querySelector('.csm-toast-host');
    if (old) old.parentNode.removeChild(old);
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    var el = document.createElement('div');
    el.className = 'csm-toast-host';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('show'); });
    });
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
    }, duration || 1600);
  }

  // —— 监听来自弹窗页的 postMessage ——
  window.addEventListener('message', function (e) {
    var data = e.data;
    if (!data || data.type !== MSG_TYPE) return;
    if (data.event === 'ready') {
      // 弹窗页就绪（可在此做加载态处理，当前自动淡入已足够）
      return;
    }
    if (data.event === 'height') {
      // 弹窗页主动上报内容高度（比 autoHeight 更可靠）
      var topFrame = stack.length ? stack[stack.length - 1].frame : null;
      if (topFrame && data.value > 0) {
        var v = stack[stack.length - 1].host.classList.contains('drawer-right') ? 'drawer-right' : '';
        if (v !== 'drawer-right') topFrame.style.height = data.value + 'px';
      }
      return;
    }
    if (data.event === 'confirm') {
      var inst = stack[stack.length - 1];
      if (inst && typeof inst.opts.onConfirm === 'function') {
        inst.opts.onConfirm(data.payload || {});
      }
      // 确认后默认关闭弹窗（除非 opts.keepOpen）
      if (!inst || !inst.opts.keepOpen) closeTop(data.payload);
      return;
    }
    if (data.event === 'close') {
      closeTop(data.payload);
      return;
    }
  });

  // ESC 关闭栈顶
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stack.length) closeTop();
  });

  // 对外 API
  window.csModal = {
    open: open,
    close: function (payload) { closeTop(payload); },
    toast: toast,
    get openCount() { return stack.length; }
  };
})();

/* ============================================================
   弹窗页侧桥接（csModalBridge）
   ------------------------------------------------------------
   弹窗页（modals/*.html）在 <body> 末尾引入本文件后，
   即可直接调用 window.csModalBridge.confirm(payload) / .close()，
   无需手写 postMessage。
   宿主页引入本文件时，csModalBridge 段落因 window.parent===window
   会被 csModal 覆盖，互不干扰。
   ============================================================ */
if (window.parent && window.parent !== window) {
  window.csModalBridge = {
    confirm: function (payload) {
      window.parent.postMessage({ type: 'cs-modal', event: 'confirm', payload: payload || {} }, '*');
    },
    close: function (payload) {
      window.parent.postMessage({ type: 'cs-modal', event: 'close', payload: payload || null }, '*');
    },
    ready: function () {
      window.parent.postMessage({ type: 'cs-modal', event: 'ready' }, '*');
    },
    reportHeight: function (h) {
      window.parent.postMessage({ type: 'cs-modal', event: 'height', value: h || document.body.scrollHeight }, '*');
    }
  };
  // 自动上报就绪 + 高度（DOMContentLoaded 后内容已渲染）
  function _csmBootstrap() {
    try { window.csModalBridge.ready(); } catch (e) {}
    try { window.csModalBridge.reportHeight(document.body.scrollHeight); } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _csmBootstrap);
  } else {
    _csmBootstrap();
  }
}
