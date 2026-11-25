/* ตั้งค่าลิงก์ของระบบ — แก้ไฟล์นี้ที่เดียวถ้าลิงก์เปลี่ยน */
window.APP_CONFIG = {
  // ใช้หลังบ้านตัวไหน: 'apps' = Apps Script เดิม (ใช้งานจริงตอนนี้) | 'sb' = Supabase (ใหม่)
  // ทดสอบ Supabase เฉพาะในเบราว์เซอร์ตัวเอง: เปิดหน้าเว็บด้วย ?be=sb ต่อท้าย (เปิดด้วย ?be=apps เพื่อกลับ)
  BACKEND: 'apps',

  // --- หลังบ้านเดิม (Apps Script ระบบเบิกโบรชัวร์) ลงท้ายด้วย /exec
  API_URL: 'https://script.google.com/macros/s/AKfycbwUM6k-YnMq7YviShAibGErYXH6Yyse3EKyo7MY5KuHf3TIDfxqkJKhvsMxQm6bTwil/exec',

  // --- หลังบ้านใหม่ (Supabase)
  SUPABASE_URL: 'https://bknxfgefwslzhipfaovy.supabase.co',
  // Publishable key (ขึ้นต้น sb_publishable_) เป็นกุญแจสาธารณะ ใส่ในหน้าเว็บได้ ห้ามใส่ Secret key ที่นี่
  SUPABASE_KEY: 'sb_publishable_7fYbed6Rk1pM_qoAsdvEqA_Afy-3VUD',

  // หน้า Login (ยังอยู่ที่ Google)
  LOGIN_URL: 'https://script.google.com/macros/s/AKfycbye6OvAeKTVesGoCsrVKb6F7En8An3SVBjmcofDvs1oqCmt9ssF0bJNCt6ELsL9W_Y4Lg/exec'
};
