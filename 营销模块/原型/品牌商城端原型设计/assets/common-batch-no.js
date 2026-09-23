/**
 * 发放批次号工具（统一编号规则）
 * 规则：C + YYYYMMDD + NNN(3位每天自增)  示例：C20260701001
 * 用法：<script src="../assets/common-batch-no.js"></script> 后调用 genIssueBatchNo()
 * 序号按天持久化于 localStorage，跨天归零；纯前端演示用，非真实全局自增。
 */
(function (global) {
  'use strict';

  function pad(n, len) {
    return String(n).padStart(len, '0');
  }

  function genIssueBatchNo() {
    var d = new Date();
    var yy = d.getFullYear();
    var mm = pad(d.getMonth() + 1, 2);
    var dd = pad(d.getDate(), 2);
    var key = 'c_seq_' + yy + mm + dd;
    var seq = 0;
    try {
      seq = parseInt(global.localStorage && global.localStorage.getItem(key) || '0', 10) || 0;
    } catch (e) { seq = 0; }
    seq = seq + 1;
    try {
      if (global.localStorage) global.localStorage.setItem(key, String(seq));
    } catch (e) {}
    return 'C' + yy + mm + dd + pad(seq, 3);
  }

  global.genIssueBatchNo = genIssueBatchNo;
})(typeof window !== 'undefined' ? window : this);
