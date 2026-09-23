/**
 * Auth guard - add to any page that requires login.
 * Redirects to login.html if user is not authenticated.
 * Must be loaded after auth.js
 */
(function() {
  if (!Auth.isLoggedIn()) {
    Auth.clearTempSession();
    location.replace('login.html');
  }
})();
