/* ============================================================
   notify.js — 环境提示音 + 新消息弹窗 helper（PRD V2.2）
   ------------------------------------------------------------
   与 cs-modal.js 并列的共享运行时（无依赖，纯 WebAudio）。
   宿主页（workbench / todo）在 <head> 引入本文件后用 window.csNotify：
     csNotify.playBeep(opts?)                  // WebAudio 短提示音
     csNotify.unlockAudio()                    // 幂等；用户手势内调用以解锁自动播放
     csNotify.isAudioUnlocked()                // 当前是否已解锁
     csNotify.popup({                          // 右下浮动新消息卡片（堆叠 + 折叠）
       name,                                   //   发送者名称（仅用户名，如「林小娟」）
       preview,                                //   单行预览（与 lines 二选一）
       lines: [{label, value}],                //   结构化多行（如 转接原因/转接备注）
       persist,                                //   true → 不自动消失，仅手动关闭
       duration,                               //   自动消失时长（仅非 persist 时生效）
       onOpen                                  //   点「立即查看」回调
     })                                        //   返回 { close() } 句柄
     csNotify.closeAll()                       // 关闭并移除所有弹窗
   堆叠规则：最多 MAX_VISIBLE 条同时可见；超出时最旧一条折叠（不删除），
   顶部出现「🔔 还有 N 条未读消息」药丸，点击展开全部（可滚动）。
   样式：.nm-popup-stack / .nm-popup-host / .nm-pill 系列在 styles.css。
   ============================================================ */
(function () {
  'use strict';

  var audioCtx = null;

  function ctx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audioCtx = new AC(); } catch (e) { return null; }
    }
    return audioCtx;
  }

  function unlockAudio() {
    var c = ctx();
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    return c;
  }

  function isAudioUnlocked() {
    var c = ctx();
    return !!c && c.state === 'running';
  }

  function playBeep(opts) {
    opts = opts || {};
    var c = ctx();
    if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    var freq = opts.freq || 880;
    var dur = opts.duration || 0.15;
    var peak = opts.gain || 0.15;
    var type = opts.type || 'sine';
    var now = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  // —— 新消息浮动卡片（堆叠 + 折叠）——
  var MAX_VISIBLE = 3;          // 最多同时可见条数
  var stackEl = null;
  var hiddenCount = 0;          // 被折叠的条数

  function getStack() {
    if (stackEl && stackEl.parentNode) return stackEl;
    stackEl = document.createElement('div');
    stackEl.className = 'nm-popup-stack';
    document.body.appendChild(stackEl);
    return stackEl;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  // 渲染卡片正文：lines 优先（结构化多行），否则 preview（单行）
  function renderBody(opts) {
    if (opts.lines && opts.lines.length) {
      var rows = opts.lines.map(function (ln) {
        return '<div class="nm-line">' +
          '<span class="nm-line-label">' + escapeHtml(ln.label || '') + '</span>' +
          '<span class="nm-line-value">' + escapeHtml(ln.value || '') + '</span>' +
        '</div>';
      }).join('');
      return '<div class="nm-lines">' + rows + '</div>';
    }
    return '<div class="nm-preview">' + escapeHtml(opts.preview || '您有一条新消息') + '</div>';
  }

  // 折叠溢出：隐藏最旧的一条（DOM 中排在最后的 .nm-popup-host，视觉上在最顶部）
  function collapseOverflow() {
    if (stackEl.classList.contains('expanded')) return; // 已展开模式不再折叠
    var hosts = stackEl.querySelectorAll('.nm-popup-host:not(.nm-pill)');
    while (hosts.length > MAX_VISIBLE) {
      var oldest = hosts[hosts.length - 1];
      oldest.classList.add('nm-collapsed');
      hiddenCount++;
      hosts = stackEl.querySelectorAll('.nm-popup-host:not(.nm-pill):not(.nm-collapsed)');
    }
    updatePill();
  }

  // 更新/创建折叠计数药丸（顶部）
  function updatePill() {
    var stack = getStack();
    var pill = stack.querySelector('.nm-pill');
    if (hiddenCount > 0) {
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'nm-popup-host nm-pill';
        pill.innerHTML = '<div class="nm-pill-inner">' +
          '<span class="nm-pill-icon">🔔</span>' +
          '<span>还有 <b class="nm-count">0</b> 条未读消息，点击展开</span>' +
        '</div>';
        pill.addEventListener('click', expandAll);
        // 药丸放 DOM 末尾 → column-reverse 下显示在最顶部
        stack.appendChild(pill);
        requestAnimationFrame(function () { pill.classList.add('show'); });
      }
      pill.querySelector('.nm-count').textContent = hiddenCount;
    } else if (pill) {
      pill.classList.remove('show');
      setTimeout(function () { if (pill.parentNode) pill.parentNode.removeChild(pill); }, 250);
    }
  }

  // 展开全部：显示所有折叠项 + 移除药丸 + 容器可滚动
  function expandAll() {
    var stack = getStack();
    stack.classList.add('expanded');
    stack.querySelectorAll('.nm-collapsed').forEach(function (h) {
      h.classList.remove('nm-collapsed');
    });
    hiddenCount = 0;
    var pill = stack.querySelector('.nm-pill');
    if (pill) { pill.classList.remove('show'); setTimeout(function () { if (pill.parentNode) pill.parentNode.removeChild(pill); }, 250); }
  }

  function popup(opts) {
    opts = opts || {};
    var stack = getStack();

    var name = opts.name || '用户';
    var host = document.createElement('div');
    host.className = 'nm-popup-host';
    host.innerHTML =
      '<div class="nm-close" title="关闭">✕</div>' +
      '<div class="nm-header">' +
        '<div class="nm-avatar">' + escapeHtml(name.charAt(0)) + '</div>' +
        '<div class="nm-name">' + escapeHtml(name) + '</div>' +
      '</div>' +
      renderBody(opts) +
      '<div class="nm-actions">' +
        '<button class="nm-btn" data-act="open">立即查看</button>' +
      '</div>';

    var timer = null;
    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (timer) { clearTimeout(timer); timer = null; }
      host.classList.remove('show');
      setTimeout(function () {
        if (host.parentNode) host.parentNode.removeChild(host);
        // 关闭一条后，若仍有折叠项且未展开，补一条进来保持最多 3 条可见
        if (!stack.classList.contains('expanded') && hiddenCount > 0) {
          revealOne();
        }
        // 全部清空时重置展开态
        if (!stack.querySelector('.nm-popup-host:not(.nm-pill)')) {
          stack.classList.remove('expanded');
          hiddenCount = 0;
          updatePill();
        }
      }, 250);
    }

    // 从折叠区恢复最近一条（DOM 中最后一个 .nm-collapsed，即视觉最顶部的折叠项）
    function revealOne() {
      var collapsed = stack.querySelectorAll('.nm-collapsed');
      if (!collapsed.length) return;
      collapsed[collapsed.length - 1].classList.remove('nm-collapsed');
      hiddenCount--;
      updatePill();
    }

    function close(silent) { dismiss(); }
    host._nmHandle = { close: close };

    host.addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('nm-close')) { dismiss(); return; }
      var btn = t.closest('.nm-btn');
      if (btn) {
        var act = btn.getAttribute('data-act');
        dismiss();
        if (act === 'open' && typeof opts.onOpen === 'function') opts.onOpen();
      }
    });

    // 新卡片插到 DOM 最前 → column-reverse 下显示在最底部（右下角）
    stack.insertBefore(host, stack.firstChild);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { host.classList.add('show'); });
    });

    // 折叠溢出（非展开模式下）
    collapseOverflow();

    // 持久模式不自动消失
    if (!opts.persist) {
      timer = setTimeout(dismiss, opts.duration || 5000);
    }

    return { close: close };
  }

  function closeAll() {
    var stack = getStack();
    stack.classList.remove('expanded');
    hiddenCount = 0;
    stack.querySelectorAll('.nm-popup-host').forEach(function (h) {
      var handle = h._nmHandle;
      if (handle && typeof handle.close === 'function') handle.close(true);
      else if (h.parentNode) h.parentNode.removeChild(h);
    });
  }

  window.csNotify = {
    playBeep: playBeep,
    unlockAudio: unlockAudio,
    isAudioUnlocked: isAudioUnlocked,
    popup: popup,
    closeAll: closeAll
  };
})();
