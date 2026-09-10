(function() {
  // Theme switcher for prototype demo
  var THEMES = ['red', 'green'];

  function getCurrentTheme() {
    try { return localStorage.getItem('mall-theme') || 'red'; } catch(e) { return 'red'; }
  }

  function setTheme(theme) {
    try { localStorage.setItem('mall-theme', theme); } catch(e) {}
    applyTheme(theme);
  }

  function getThemeTarget() {
    return document.querySelector('.phone-frame') || document.documentElement;
  }

  function applyTheme(theme) {
    var target = getThemeTarget();
    if (!target) return;
    THEMES.forEach(function(t) { target.classList.remove('theme-' + t); });
    if (theme !== 'red') target.classList.add('theme-' + theme);
    var btns = document.querySelectorAll('.theme-btn');
    btns.forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  }

  function initSwitcher() {
    var target = getThemeTarget();
    if (!target) return;

    var switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    THEMES.forEach(function(t) {
      var btn = document.createElement('div');
      btn.className = 'theme-btn' + (t === getCurrentTheme() ? ' active' : '');
      btn.setAttribute('data-theme', t);
      btn.title = t === 'red' ? '红橙主题' : '绿色主题';
      btn.onclick = function() { setTheme(t); };
      switcher.appendChild(btn);
    });
    document.body.appendChild(switcher);

    applyTheme(getCurrentTheme());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }
})();
