/* api.js — ตัวเรียกหลังบ้านแทน google.script.run
   รองรับ 2 หลังบ้าน: Apps Script (fetch ไป /exec) และ Supabase (เรียก api_call ผ่าน REST)
   ชื่อฟังก์ชันที่หน้าเว็บเรียก (api_xxx) จะถูกแปลงเป็นชื่อ action ตามตารางด้านล่าง */
(function () {
  var ACTION_MAP = {
  "api_login": "login",
  "api_getBrochureList": "getBrochureList",
  "api_getPublicInfo": "getPublicInfo",
  "api_getHomeExtras": "getHomeExtras",
  "api_submitOrder": "submitOrder",
  "api_getOrderHistory": "getOrderHistory",
  "api_cancelOrderByUser": "cancelOrderByUser",
  "api_admin_getDashboard": "adminGetDashboard",
  "api_admin_getDashboardInsights": "adminGetDashboardInsights",
  "api_admin_getBranchDetail": "adminGetBranchDetail",
  "api_admin_getBranchRegions": "adminGetBranchRegions",
  "api_admin_saveBranchRegions": "adminSaveBranchRegions",
  "api_admin_getSettings": "adminGetSettings",
  "api_admin_getOrders": "adminGetOrders",
  "api_admin_approveOrder": "adminApproveOrder",
  "api_admin_bulkApproveOrders": "adminBulkApproveOrders",
  "api_admin_markShipped": "adminMarkShipped",
  "api_admin_cancelOrder": "adminCancelOrder",
  "api_admin_getBrochures": "adminGetBrochures",
  "api_admin_upsertBrochure": "adminUpsertBrochure",
  "api_admin_uploadCoverImage": "adminUploadCoverImage",
  "api_admin_restock": "adminRestock",
  "api_admin_toggleBrochureStatus": "adminToggleBrochureStatus",
  "api_admin_renameBrochure": "adminRenameBrochure",
  "api_admin_mergeBrochure": "adminMergeBrochure",
  "api_admin_deleteBrochure": "adminDeleteBrochure",
  "api_admin_setPickupInfo": "adminSetPickupInfo",
  "api_admin_setDeliveryInfo": "adminSetDeliveryInfo",
  "api_admin_setShippingDelayNotice": "adminSetShippingDelayNotice",
  "api_admin_setAnnouncement": "adminSetAnnouncement",
  "api_admin_setContactInfo": "adminSetContactInfo",
  "api_admin_importUsers": "adminImportUsers",
  "api_admin_getReportData": "adminGetReportData",
  "api_admin_exportOrdersCsv": "adminExportOrdersCsv",
  "api_admin_listAdmins": "adminListAdmins",
  "api_admin_createAdmin": "adminCreateAdmin",
  "api_admin_resetAdminPassword": "adminResetAdminPassword",
  "api_admin_setAdminActive": "adminSetAdminActive",
  "api_admin_searchUserQuota": "adminSearchUserQuota",
  "api_admin_getOrdersForExport": "adminGetOrdersForExport",
  "api_admin_saveContact": "adminSaveContact",
  "api_admin_deleteContact": "adminDeleteContact",
  "api_admin_moveContact": "adminMoveContact",
  "api_admin_setContactActive": "adminSetContactActive",
  "api_admin_setContactBusy": "adminSetContactBusy",
  "api_admin_addHoliday": "adminAddHoliday",
  "api_admin_deleteHoliday": "adminDeleteHoliday",
  "api_admin_setSenderInfo": "adminSetSenderInfo",
  "api_admin_createDeptTxn": "adminCreateDeptTxn",
  "api_admin_getDeptData": "adminGetDeptData",
  "api_admin_voidDeptTxn": "adminVoidDeptTxn",
  "api_admin_closeDeptBalance": "adminCloseDeptBalance",
  "api_admin_setDeptReturnDays": "adminSetDeptReturnDays",
  "api_admin_createBackup": "adminCreateBackup",
  "api_admin_listBackups": "adminListBackups",
  "api_admin_setAutoBackup": "adminSetAutoBackup",
  "api_admin_deleteBackup": "adminDeleteBackup",
  "api_admin_restoreBackup": "adminRestoreBackup",
  "api_admin_resetData": "adminResetData"
};
  var TIMEOUT_MS = 90000;

  function backend() {
    var cfg = window.APP_CONFIG || {};
    try {
      var q = new URLSearchParams(location.search).get('be');
      if (q === 'sb' || q === 'apps') localStorage.setItem('es_be', q);
      var v = localStorage.getItem('es_be');
      if (v === 'sb' || v === 'apps') return v;
    } catch (e) {}
    return cfg.BACKEND === 'sb' ? 'sb' : 'apps';
  }

  // ป้ายเตือนเมื่ออยู่โหมดทดสอบ Supabase (กดป้ายเพื่อกลับไปใช้ระบบเดิม)
  function showBadge() {
    if (backend() !== 'sb' || (window.APP_CONFIG || {}).BACKEND === 'sb') return;
    var d = document.createElement('div');
    d.textContent = '🧪 โหมดทดสอบ Supabase (กดเพื่อกลับระบบเดิม)';
    d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;background:#b45309;color:#fff;font:600 12px Sarabun,sans-serif;padding:6px 10px;border-radius:999px;cursor:pointer;opacity:.92';
    d.onclick = function () { try { localStorage.setItem('es_be', 'apps'); } catch (e) {} location.href = location.pathname; };
    document.body.appendChild(d);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBadge); else showBadge();

  function withTimeout(run) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    return run(ctrl ? ctrl.signal : undefined).then(function (v) { if (timer) clearTimeout(timer); return v; },
      function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  function mapNetErr(e) {
    if (e && e.name === 'AbortError') return new Error('ระบบตอบกลับช้าเกินไป กรุณาลองใหม่อีกครั้ง');
    if (e instanceof TypeError) return new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    return e;
  }

  function callApps(action, params) {
    var cfg = window.APP_CONFIG || {};
    if (!/^https:\/\//.test(cfg.API_URL || '')) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js'));
    var body = JSON.stringify(Object.assign({}, params || {}, { action: action }));
    // text/plain = "simple request" ไม่ต้องทำ CORS preflight (Apps Script ไม่รองรับ preflight)
    return withTimeout(function (signal) {
      return fetch(cfg.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, redirect: 'follow', signal: signal })
        .then(function (res) { return res.text(); });
    }).then(function (txt) {
      var json;
      try { json = JSON.parse(txt); } catch (e) { throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่'); }
      if (!json.ok) throw new Error(json.error || 'เกิดข้อผิดพลาดจากระบบ');
      return json.data;
    });
  }

  function callSb(action, params) {
    var cfg = window.APP_CONFIG || {};
    if (!/^https:\/\//.test(cfg.SUPABASE_URL || '') || !/^sb_publishable_/.test(cfg.SUPABASE_KEY || '')) {
      return Promise.reject(new Error('ยังไม่ได้ตั้งค่า SUPABASE_URL / SUPABASE_KEY ในไฟล์ config.js'));
    }
    return withTimeout(function (signal) {
      return fetch(cfg.SUPABASE_URL + '/rest/v1/rpc/api_call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': cfg.SUPABASE_KEY },
        body: JSON.stringify({ p_action: action, p_params: params || {} }),
        signal: signal
      }).then(function (res) { return res.text(); });
    }).then(function (txt) {
      var json;
      try { json = JSON.parse(txt); } catch (e) { throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่'); }
      if (json && json.ok === true) { if (json.session) saveTok(params, json.session); return json.data; }
      if (json && json.ok === false) { var er = new Error(json.error || 'เกิดข้อผิดพลาดจากระบบ'); if (json.code === 'session') er.sessionExpired = true; throw er; }
      throw new Error('ระบบหลังบ้านตอบผิดรูปแบบ: ' + String((json && (json.message || json.hint)) || txt).slice(0, 120));
    });
  }

  // ---- เซสชัน Admin (โหมด Supabase): ล็อกอินครั้งแรกด้วยรหัสผ่าน แล้วใช้ token แทน ----
  var PLACEHOLDER = '\u2022session';
  function ss() { try { return window.sessionStorage; } catch (e) { return null; } }
  function loadTok(user) {
    var st = ss(); if (!st || !user) return '';
    var t = st.getItem('es_admin_tok'), u = st.getItem('es_admin_tok_user');
    return (t && u === user) ? t : '';
  }
  function saveTok(params, tok) {
    var st = ss(); if (!st || !params || !params.adminUsername) return;
    st.setItem('es_admin_tok', tok); st.setItem('es_admin_tok_user', params.adminUsername);
    // ไม่เก็บรหัสผ่านจริงไว้ใน sessionStorage อีก (ใช้ตัวแทนเพื่อให้หน้าเว็บรู้ว่ายังล็อกอินอยู่)
    setTimeout(scrubPw, 100); setTimeout(scrubPw, 1500);
  }
  function scrubPw() { var st = ss(); if (st && st.getItem('es_admin_tok') && st.getItem('adminPassword') && st.getItem('adminPassword') !== PLACEHOLDER) st.setItem('adminPassword', PLACEHOLDER); }
  function clearTok() { var st = ss(); if (st) { st.removeItem('es_admin_tok'); st.removeItem('es_admin_tok_user'); } }

  function callSbAuth(action, params) {
    var p = Object.assign({}, params || {});
    var hasAdmin = Object.prototype.hasOwnProperty.call(p, 'adminUsername');
    if (!hasAdmin) return callSb(action, p);
    var st = ss();
    // ออกจากระบบแล้ว (username ถูกลบ) = ทิ้ง token เก่า
    if (st && !st.getItem('adminUsername')) clearTok();
    var realPw = (p.adminPassword && p.adminPassword !== PLACEHOLDER) ? p.adminPassword : '';
    var tok = loadTok(p.adminUsername);
    if (tok) scrubPw();
    var first = Object.assign({}, p); delete first.adminPassword;
    if (tok) first.adminToken = tok; else if (realPw) first.adminPassword = realPw;
    return callSb(action, first).catch(function (e) {
      if (e && e.sessionExpired) {
        clearTok();
        if (realPw) {
          var again = Object.assign({}, p); delete again.adminToken; again.adminPassword = realPw;
          return callSb(action, again);
        }
        var x = new Error('เซสชันหมดอายุ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่'); throw x;
      }
      throw e;
    });
  }

  function apiCall(fnName, params) {
    var action = ACTION_MAP[fnName];
    if (!action) return Promise.reject(new Error('ไม่รู้จักคำสั่ง: ' + fnName));
    var p;
    if (backend() === 'sb') {
      if (action === 'adminUploadCoverImage') {
        return Promise.reject(new Error('โหมด Supabase ยังไม่รองรับอัปโหลดรูปปกในหน้านี้ กรุณาวางลิงก์รูปแทน (ช่อง URL รูปปก)'));
      }
      p = callSbAuth(action, params);
    } else p = callApps(action, params);
    return p.catch(function (e) { throw mapNetErr(e); });
  }
  window.apiCall = apiCall;
})();
