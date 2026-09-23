/**
 * Mock account system for prototype testing
 * Uses localStorage to persist state across pages
 *
 * Test accounts:
 *   13800001111 - 已注册，已绑定微信 (any code works)
 *   13800002222 - 已注册，未绑定微信
 *   13800003333 - 未注册 (auto-register on login)
 */
(function(window) {
  var STORAGE_KEY = 'syd_accounts';
  var CURRENT_KEY = 'syd_current';

  var DEFAULT_AVATAR = '../images/icons/default-avatar.svg';

  var defaultAccounts = [
    { phone: '13800001111', name: '张三', avatar: '../images/unsplash/1535713875002-d1d0cf377fde.jpg', gender: 'male', birthday: '1995-06-15', email: '', wechatBound: true, wechatNickname: '张三' },
    { phone: '13800002222', name: '李四', avatar: '../images/unsplash/1535713875002-d1d0cf377fde.jpg', gender: 'male', birthday: '1990-03-20', email: '', wechatBound: false, wechatNickname: '' },
    // 13800003333 is NOT in list = unregistered
  ];

  // Random nickname generator
  var nickAdjectives = ['快乐的', '聪明的', '勇敢的', '可爱的', '温柔的', '阳光的', '淡定的', '酷酷的', '幸运的', '闪亮的'];
  var nickNouns = ['小熊', '猫咪', '兔子', '狐狸', '松鼠', '海豚', '星星', '月亮', '棉花糖', '草莓', '芒果', '布丁', '饼干', '樱桃'];

  function generateNickname() {
    var adj = nickAdjectives[Math.floor(Math.random() * nickAdjectives.length)];
    var noun = nickNouns[Math.floor(Math.random() * nickNouns.length)];
    return adj + noun;
  }

  function createDefaultAccount(phone) {
    return {
      phone: phone,
      name: generateNickname(),
      avatar: DEFAULT_AVATAR,
      gender: 'secret',
      birthday: '1970-01-01',
      email: '',
      wechatBound: false,
      wechatNickname: ''
    };
  }

  function getAccounts() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAccounts));
      return JSON.parse(JSON.stringify(defaultAccounts));
    }
    return JSON.parse(raw);
  }

  function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 11) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }

  // Find account by phone
  function findByPhone(phone) {
    var accounts = getAccounts();
    return accounts.find(function(a) { return a.phone === phone; }) || null;
  }

  // Check if phone is registered
  function isRegistered(phone) {
    return findByPhone(phone) !== null;
  }

  // Login with phone (auto-register if new)
  function loginWithPhone(phone) {
    var accounts = getAccounts();
    var account = accounts.find(function(a) { return a.phone === phone; });

    var isNew = false;
    if (!account) {
      account = createDefaultAccount(phone);
      accounts.push(account);
      saveAccounts(accounts);
      isNew = true;
    }

    localStorage.setItem(CURRENT_KEY, JSON.stringify(account));
    return { account: account, isNew: isNew };
  }

  // Login with WeChat (then need bind phone)
  function loginWithWeChat() {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({
      temp: true,
      name: '微信用户',
      wxAvatar: '../images/unsplash/1535713875002-d1d0cf377fde.jpg',
      wxNickname: '微信用户'
    }));
    return { name: '微信用户' };
  }

  // Bind phone to WeChat session
  // Returns { account, isNew } on success, or { error: 'already_bound' } if conflict
  function bindPhoneToWeChat(phone) {
    var accounts = getAccounts();
    var existing = accounts.find(function(a) { return a.phone === phone; });

    if (existing) {
      if (existing.wechatBound) {
        return { error: 'already_bound' };
      }
      existing.wechatBound = true;
      existing.wechatNickname = '微信用户';
      saveAccounts(accounts);
      localStorage.setItem(CURRENT_KEY, JSON.stringify(existing));
      return { account: existing, isNew: false };
    }

    var account = {
      phone: phone,
      name: '微信用户',
      avatar: '../images/unsplash/1535713875002-d1d0cf377fde.jpg',
      gender: 'secret',
      birthday: '1970-01-01',
      email: '',
      wechatBound: true,
      wechatNickname: '微信用户'
    };
    accounts.push(account);
    saveAccounts(accounts);
    localStorage.setItem(CURRENT_KEY, JSON.stringify(account));
    return { account: account, isNew: true, isWechat: true };
  }

  // Apply WeChat info to current account (user chose to use wx avatar+name)
  function applyWeChatInfo() {
    var current = getCurrentUser();
    if (!current) return;
    updateCurrentUser({
      avatar: '../images/unsplash/1535713875002-d1d0cf377fde.jpg',
      name: '微信用户'
    });
  }

  // Apply random info (user chose NOT to use wx avatar+name)
  function applyRandomInfo() {
    var current = getCurrentUser();
    if (!current) return;
    updateCurrentUser({
      avatar: DEFAULT_AVATAR,
      name: generateNickname()
    });
  }

  // Get current logged-in user
  function getCurrentUser() {
    var raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // Update current user
  function updateCurrentUser(updates) {
    var current = getCurrentUser();
    if (!current) return;
    for (var k in updates) { current[k] = updates[k]; }
    localStorage.setItem(CURRENT_KEY, JSON.stringify(current));

    // Also update in accounts list
    if (current.phone) {
      var accounts = getAccounts();
      var acc = accounts.find(function(a) { return a.phone === current.phone; });
      if (acc) {
        for (var k2 in updates) { acc[k2] = updates[k2]; }
        saveAccounts(accounts);
      }
    }
  }

  // Bind WeChat to current account
  function bindWeChat() {
    updateCurrentUser({ wechatBound: true, wechatNickname: '微信用户' });
  }

  // Unbind WeChat from current account
  function unbindWeChat() {
    updateCurrentUser({ wechatBound: false, wechatNickname: '' });
  }

  // Check if WeChat is already bound to another account
  function isWeChatBoundToOther(phone) {
    var accounts = getAccounts();
    return accounts.some(function(a) { return a.wechatBound && a.phone !== phone; });
  }

  // Clear temp session (from incomplete WeChat login)
  function clearTempSession() {
    var current = getCurrentUser();
    if (current && current.temp) {
      localStorage.removeItem(CURRENT_KEY);
    }
  }

  // Check if user is logged in (not temp session)
  function isLoggedIn() {
    var current = getCurrentUser();
    return current && !current.temp && current.phone;
  }

  // Logout
  function logout() {
    localStorage.removeItem(CURRENT_KEY);
  }

  // Reset accounts to defaults (for testing)
  function resetAccounts() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_KEY);
  }

  window.Auth = {
    DEFAULT_AVATAR: DEFAULT_AVATAR,
    getAccounts: getAccounts,
    findByPhone: findByPhone,
    isRegistered: isRegistered,
    loginWithPhone: loginWithPhone,
    loginWithWeChat: loginWithWeChat,
    bindPhoneToWeChat: bindPhoneToWeChat,
    applyWeChatInfo: applyWeChatInfo,
    applyRandomInfo: applyRandomInfo,
    getCurrentUser: getCurrentUser,
    updateCurrentUser: updateCurrentUser,
    bindWeChat: bindWeChat,
    unbindWeChat: unbindWeChat,
    isWeChatBoundToOther: isWeChatBoundToOther,
    clearTempSession: clearTempSession,
    isLoggedIn: isLoggedIn,
    logout: logout,
    resetAccounts: resetAccounts,
    maskPhone: maskPhone
  };
})(window);
