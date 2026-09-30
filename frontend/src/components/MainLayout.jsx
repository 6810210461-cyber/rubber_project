import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const activeMenuStyle = (menuPath) => ({
    display: 'block',
    padding: '16px 20px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: path === menuPath ? '#5c8a47' : 'transparent',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      
      {/* แถบเมนูด้านซ้าย (Sidebar) */}
      <div style={{ width: '240px', minWidth: '240px', backgroundColor: '#386cc7', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 15px', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '20px' }}>เมนูผู้ดูแลระบบ</h3>
        </div>
        
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
        </div>

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
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>

      {/* พื้นที่แสดงเนื้อหาฝั่งขวา */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
      
    </div>
  );
}

export default MainLayout;