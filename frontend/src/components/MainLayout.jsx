import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

/**
 * ====================================================================================
 * [Main Layer Component] MainLayout
 * ทำหน้าที่เป็นโครงสร้างหลัก (Layout Template) สำหรับฝั่งผู้ดูแลระบบ (Admin)
 * ควบคุมการแสดงผลแถบเมนูด้านข้าง (Sidebar Navigation) และพื้นที่แสดงเนื้อหาย่อย (<Outlet />)
 * ====================================================================================
 */
function MainLayout() {
  // --- [Main Layer: React Router Hooks] ---
  // ดึงข้อมูลตำแหน่ง URL ปัจจุบัน และฟังก์ชันสำหรับการเปลี่ยนหน้า (Navigation)
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname; 

  // --- [Main Layer: Authentication & Session Management] ---
  // ฟังก์ชันสำหรับจัดการการออกจากระบบ (Logout) และเคลียร์ข้อมูล Session ใน LocalStorage
  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/'); // นำผู้ใช้งานกลับไปยังหน้าเข้าสู่ระบบ (Login)
    }
  };

  // --- [Main Layer: Dynamic UI Styling Handler] ---
  // ฟังก์ชันกำหนดรูปแบบ Style ของเมนู โดยจะไฮไลต์สีพื้นหลังเมนูเมื่อ URL ปัจจุบันตรงกับ Path ของเมนูนั้นๆ
  const activeMenuStyle = (menuPath) => ({
    display: 'block',
    padding: '16px 20px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: path === menuPath ? '#5c8a47' : 'transparent', // เปลี่ยนสีไฮไลต์เมื่อเมนูกำลังถูกใช้งาน
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      
      {/* ============================================================================
       * [Main Layer: Sidebar Navigation UI]
       * แถบเมนูด้านซ้ายสำหรับนำทางไปยังหน้าต่างการทำงานต่างๆ ของผู้ดูแลระบบ
       * ============================================================================ */}
      <div style={{ width: '240px', minWidth: '240px', backgroundColor: '#386cc7', display: 'flex', flexDirection: 'column' }}>
        
        {/* หัวข้อแสดงบทบาทผู้ใช้งานส่วนบนของ Sidebar */}
        <div style={{ padding: '22px 15px', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '20px' }}>เมนูผู้ดูแลระบบ</h3>
        </div>
        
        {/* รายการลิงก์เมนูหลักภายในระบบ (Navigation Links) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to="/daily-record" style={activeMenuStyle('/daily-record')}>
            บันทึกน้ำยางรายวัน
          </Link>

          <Link to="/assign-plot" style={activeMenuStyle('/assign-plot')}>
            ผูกแปลงยาง/ส่วนแบ่ง
          </Link>

          <Link to="/customer-list" style={activeMenuStyle('/customer-list')}>
            ข้อมูลลูกค้า
          </Link>

          <Link to="/withdraw-approval" style={activeMenuStyle('/withdraw-approval')}>
            อนุมัติเบิกเงิน
          </Link>

          <Link to="/add-garden-owner" style={activeMenuStyle('/add-garden-owner')}>
            เพิ่มสมาชิกเจ้าของสวน
          </Link>

          <Link to="/sales-history" style={activeMenuStyle('/sales-history')}>
            ประวัติการขายน้ำยาง
          </Link>

          {/* เมนูกราฟสรุป DRC % */}
          <Link to="/chart-dashboard" style={activeMenuStyle('/chart-dashboard')}>
            %DRC Graph
          </Link>
        </div>

        {/* ปุ่มออกจากระบบ (Logout Button) ส่วนล่างสุดของ Sidebar */}
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#c0392b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* ============================================================================
       * [Main Layer: Content Rendering Area]
       * พื้นที่แสดงเนื้อหาหลักฝั่งขวา รองรับการเปลี่ยน Component ย่อยตาม Route ด้วย <Outlet />
       * ============================================================================ */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
      
    </div>
  );
}

export default MainLayout;