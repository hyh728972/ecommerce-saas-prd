function formatDateTime(val) {
  if (val == null || val === '') return '-';
  var s = String(val).trim();
  if (s === '—' || s === '-') return s;
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
  if (s.indexOf('T') >= 0) {
    var d = new Date(s);
    if (!isNaN(d.getTime())) {
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + ' 00:00';
  return s;
}

function nowDateTime() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}
