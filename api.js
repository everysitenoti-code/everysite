/* api.js — ตัวเรียกหลังบ้านแทน google.script.run (ใช้ fetch ไปที่ Apps Script /exec)
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

  function apiCall(fnName, params) {
    var action = ACTION_MAP[fnName];
    if (!action) return Promise.reject(new Error('ไม่รู้จักคำสั่ง: ' + fnName));
    var cfg = window.APP_CONFIG || {};
    if (!/^https:\/\//.test(cfg.API_URL || '')) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js'));
    var body = JSON.stringify(Object.assign({}, params || {}, { action: action }));
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    // text/plain = "simple request" ไม่ต้องทำ CORS preflight (Apps Script ไม่รองรับ preflight)
    return fetch(cfg.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      redirect: 'follow',
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.text();
    }).then(function (txt) {
      var json;
      try { json = JSON.parse(txt); } catch (e) { throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่'); }
      if (!json.ok) throw new Error(json.error || 'เกิดข้อผิดพลาดจากระบบ');
      return json.data;
    }).catch(function (e) {
      if (e && e.name === 'AbortError') throw new Error('ระบบตอบกลับช้าเกินไป กรุณาลองใหม่อีกครั้ง');
      if (e instanceof TypeError) throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      throw e;
    }).then(function (v) { if (timer) clearTimeout(timer); return v; },
            function (e) { if (timer) clearTimeout(timer); throw e; });
  }
  window.apiCall = apiCall;
})();
