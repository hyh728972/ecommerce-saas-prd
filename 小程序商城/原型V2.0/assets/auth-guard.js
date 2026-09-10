/**
 * Auth guard - add to any page that requires login.
 * Prototype mode: auto-login as demo user instead of redirecting.
 * Must be loaded after auth.js
 */
(function() {
  Auth.ensureLoggedIn();
})();
