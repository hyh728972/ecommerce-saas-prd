/* 工单业务类型 三级级联选择器(2026-07-28)
 * 原型为纯 HTML/JS 无框架,此处自研轻量 Cascader,供 建单/编辑抽屉/列表筛选 复用。
 * 数据源 window.TICKET_DICT.CATEGORY_TREE(一级→二级→[三级])。取值仍为「一级>二级>三级」拼接,
 * 底层 category/sub_category/type 三字段不动,由各页按「>」拆回(与原单选下拉口径一致)。
 *
 * 用法: var cas = createCascader(document.getElementById('fBizType'), { placeholder:'请选择' });
 *       cas.getValue() / cas.setValue('咨询业务>产品咨询>产品信息') / cas.onChange(fn) / cas.triggerEl
 * hostEl 会被级联组件整体替换(hostEl 通常是一个空 <div class="cascader"> 或待替换的旧 <select>)。 */
(function () {
  if (!document.getElementById('cascader-style')) {
    var st = document.createElement('style');
    st.id = 'cascader-style';
    st.textContent = ''
      + '.cascader { position:relative; flex:1 1 auto; min-width:0; }'
      + '.cascader-trigger { display:flex; align-items:center; gap:6px; width:100%; box-sizing:border-box;'
        + ' border:1px solid var(--cs-border); border-radius:var(--cs-radius-sm); padding:7px 10px; padding-right:8px;'
        + ' font-size:var(--cs-font-size-sm); background:#fff; cursor:pointer; transition:border-color .2s; }'
      + '.cascader-trigger:hover { border-color:var(--cs-primary); }'
      + '.cascader.open .cascader-trigger { border-color:var(--cs-primary); box-shadow:0 0 0 2px rgba(22,119,255,0.1); }'
      + '.cascader.invalid .cascader-trigger { border-color:var(--cs-danger); }'
      + '.cascader-trigger .casc-text { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--cs-text); }'
      + '.cascader-trigger .casc-text.placeholder { color:var(--cs-text-placeholder); }'
      + '.cascader-trigger .casc-arrow { flex-shrink:0; color:var(--cs-text-tertiary); font-size:10px; line-height:1; }'
      /* 筛选区 .ff:边框由 .ff 提供,触发器去边框 */
      + '.ff .cascader-trigger { border:none; padding:0; background:transparent; }'
      + '.ff .cascader.open .cascader-trigger { box-shadow:none; }'
      + '.cascader-panel { position:absolute; top:calc(100% + 4px); left:0; z-index:9999; display:none;'
        + ' background:#fff; border:1px solid var(--cs-border-light); border-radius:var(--cs-radius-sm);'
        + ' box-shadow:0 6px 16px rgba(0,0,0,0.12); overflow:hidden; }'
      + '.cascader.open .cascader-panel { display:flex; }'
      + '.cascader-col { width:148px; max-height:200px; overflow-y:auto; border-right:1px solid var(--cs-border-lighter); }'
      + '.cascader-col:last-child { border-right:none; }'
      + '.cascader-item { padding:7px 10px; font-size:var(--cs-font-size-sm); color:var(--cs-text); cursor:pointer;'
        + ' white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:space-between; gap:6px; }'
      + '.cascader-item:hover { background:var(--cs-bg-hover); }'
      + '.cascader-item.active { background:var(--cs-primary-bg); color:var(--cs-primary); font-weight:500; }'
      + '.cascader-item .ci-chev { color:var(--cs-text-tertiary); font-size:9px; flex-shrink:0; }';
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.createCascader = function (hostEl, opts) {
    opts = opts || {};
    var placeholder = opts.placeholder || '请选择';
    var tree = opts.tree || (window.TICKET_DICT && window.TICKET_DICT.CATEGORY_TREE) || {};

    var value = '';                 /* 「一级>二级>三级」 */
    var listeners = [];
    var sel = { l1: null, l2: null }; /* 面板内高亮的层级(取值前尚未点三级) */

    var wrap = document.createElement('div');
    wrap.className = 'cascader';
    wrap.innerHTML =
        '<div class="cascader-trigger" tabindex="0">'
        + '<span class="casc-text placeholder"></span>'
        + '<span class="casc-arrow">▾</span>'
      + '</div>'
      + '<div class="cascader-panel"></div>';

    if (hostEl.parentNode) hostEl.parentNode.replaceChild(wrap, hostEl);
    else hostEl.appendChild(wrap);

    var trigger = wrap.querySelector('.cascader-trigger');
    var textEl = wrap.querySelector('.casc-text');
    var panel = wrap.querySelector('.cascader-panel');

    function setText() {
      if (value) { textEl.textContent = value; textEl.classList.remove('placeholder'); }
      else { textEl.textContent = placeholder; textEl.classList.add('placeholder'); }
    }

    function makeCol(items) {
      var d = document.createElement('div');
      d.className = 'cascader-col';
      items.forEach(function (it) {
        var e = document.createElement('div');
        e.className = 'cascader-item' + (it.active ? ' active' : '');
        e.innerHTML = esc(it.label) + (it.chev ? '<span class="ci-chev">▸</span>' : '');
        e.addEventListener('click', function (ev) { ev.stopPropagation(); it.on(); });
        d.appendChild(e);
      });
      if (!items.length) {
        var empty = document.createElement('div');
        empty.className = 'cascader-item';
        empty.style.color = 'var(--cs-text-tertiary)';
        empty.textContent = '—';
        d.appendChild(empty);
      }
      return d;
    }

    function render() {
      var l1keys = Object.keys(tree);
      var l2keys = sel.l1 ? Object.keys(tree[sel.l1]) : [];
      var l3arr = (sel.l1 && sel.l2) ? (tree[sel.l1][sel.l2] || []) : [];

      var c1 = makeCol(l1keys.map(function (k) {
        return { label: k, chev: true, active: k === sel.l1, on: function () {
          sel.l1 = k;
          sel.l2 = l2keys.length ? Object.keys(tree[k])[0] : null;
          render();
        } };
      }));
      var c2 = makeCol(l2keys.map(function (k) {
        return { label: k, chev: true, active: k === sel.l2, on: function () { sel.l2 = k; render(); } };
      }));
      var c3 = makeCol(l3arr.map(function (v) {
        return { label: v, on: function () { choose(sel.l1, sel.l2, v); } };
      }));

      panel.innerHTML = '';
      panel.appendChild(c1);
      panel.appendChild(c2);
      panel.appendChild(c3);
    }

    function choose(l1, l2, l3) {
      value = l1 + '>' + l2 + '>' + l3;
      setText();
      close();
      fire();
    }
    function fire() { listeners.forEach(function (fn) { try { fn(value); } catch (e) {} }); }

    function open() {
      if (!sel.l1) {
        var k0 = Object.keys(tree)[0] || null;
        sel.l1 = k0;
        sel.l2 = k0 ? (Object.keys(tree[k0])[0] || null) : null;
      }
      render();
      wrap.classList.add('open');
    }
    function close() { wrap.classList.remove('open'); }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('open')) close(); else open();
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
      else if (e.key === 'Escape') close();
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });

    setText();

    return {
      getValue: function () { return value; },
      setValue: function (path) {
        value = (path || '').trim();
        var parts = value.split('>');
        if (parts.length === 3) { sel.l1 = parts[0]; sel.l2 = parts[1]; }
        setText();
        fire();
      },
      clear: function () { value = ''; setText(); fire(); },
      onChange: function (fn) { listeners.push(fn); return this; },
      focus: function () { trigger.focus(); },
      get triggerEl() { return trigger; },
      get wrapEl() { return wrap; }
    };
  };
})();
