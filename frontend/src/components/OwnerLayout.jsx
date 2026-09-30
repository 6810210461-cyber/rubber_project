import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

function OwnerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // 🎨 ฟังก์ชันจัดการสไตล์ของเมนู (ปรับให้คุมโทนและมีมิติขึ้น)
  const activeMenuStyle = (menuPath) => {
    const isActive = path === menuPath;
    return {
      display: 'flex',
      alignItems: 'center',
      padding: '16px 24px',
      color: isActive ? '#FFFFFF' : '#A3B8B0', // สีขาวตอนเลือก / สีเทาอมเขียวตอนไม่ได้เลือก
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: isActive ? '600' : '400',
      backgroundColor: isActive ? '#264F3D' : 'transparent', 
      borderLeft: isActive ? '5px solid #7DE05E' : '5px solid transparent', // แถบสีเขียวสว่างชี้ว่าอยู่หน้าไหน
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      marginBottom: '4px'
    };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F4F2' }}>
      
      {/* 🌿 แถบเมนูด้านซ้าย (Sidebar) - โทนสีเขียวเข้ม */}
      <div style={{ 
        width: '260px', 
        minWidth: '260px', 
        backgroundColor: '#1B3B2B', // สีเขียวเข้มคุมโทน
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0,0,0,0.05)'
      }}>
        
        {/* 🟢 ส่วนหัวของ Sidebar (ใส่ไอคอนและชื่อระบบ) */}
        <div style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ 
            width: '60px', height: '60px', backgroundColor: '#264F3D', 
            borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
            margin: '0 auto 15px', fontSize: '28px' 
          }}>
            🌱
          </div>
          <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '18px', letterSpacing: '0.5px' }}>
            ระบบจัดการสวนยาง
          </h3>
          <p style={{ color: '#7DE05E', margin: '5px 0 0', fontSize: '12px' }}>เมนูสำหรับเจ้าของสวน</p>
        </div>
        
        {/* 📋 รายการเมนู (เพิ่มไอคอนอิโมจิให้ดูน่าใช้) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to="/owner-dashboard" style={activeMenuStyle('/owner-dashboard')}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>📊</span> หน้าหลัก (Dashboard)
          </Link>
          <Link to="/manage-plots" style={activeMenuStyle('/manage-plots')}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🌳</span> จัดการแปลงยาง / ลูกจ้าง
          </Link>
          <Link to="/income-report" style={activeMenuStyle('/income-report')}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>💰</span> ดูสรุปรายได้
          </Link>
        </div>

        {/* 🚪 ปุ่มออกจากระบบ (ปรับให้ดูละมุน ไม่แดงจนโดดเกินไป) */}
        <div style={{ marginTop: 'auto', padding: '24px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', 
              padding: '12px', 
              backgroundColor: 'rgba(231, 76, 60, 0.1)', // พื้นหลังแดงโปร่งแสง
              color: '#E74C3C', // ตัวหนังสือสีแดง
              border: '1px solid rgba(231, 76, 60, 0.5)', 
              borderRadius: '8px',
              fontSize: '15px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#E74C3C';
              e.target.style.color = '#FFFFFF';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
              e.target.style.color = '#E74C3C';
            }}
          >
            <span style={{ marginRight: '8px' }}>🚪</span> ออกจากระบบ
          </button>
        </div>
      </div>

      {/* 📄 พื้นที่แสดงเนื้อหาด้านขวา */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
      
    </div>
  );
}

export default OwnerLayout;