/* ===== 江苏银行苏银豆商城 - 公共脚本 ===== */
(function() {
  // Tab bar navigation
  var tabItems = document.querySelectorAll('.tab-bar .tab-item');
  var tabLinks = ['10.首页-原型页面.html', '11.分类-原型页面.html', '30.购物车-原型页面.html', '75.我的收藏-原型页面.html', '70.个人中心-原型页面.html'];
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
        window.location.href = '10.首页-原型页面.html';
      }
    });
  }
})();
