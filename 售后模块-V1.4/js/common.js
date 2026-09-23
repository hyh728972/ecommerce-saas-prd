/* ===== 江苏银行苏银豆商城 - 公共脚本 ===== */
(function() {
  // Tab bar navigation
  var tabItems = document.querySelectorAll('.tab-bar .tab-item');
  var tabLinks = ['home_page.html', 'category.html', 'cart.html', 'home_page.html', 'profile.html'];
  tabItems.forEach(function(item, index) {
    item.addEventListener('click', function() {
      if (tabLinks[index]) {
        window.location.href = tabLinks[index];
      }
    });
  });

  // Back button for sub-pages
  var backBtn = document.querySelector('.back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (document.referrer && document.referrer.indexOf(location.host) !== -1) {
        history.back();
      } else {
        window.location.href = 'home_page.html';
      }
    });
  }
})();
