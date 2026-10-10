import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

function OwnerLayout() {
  const navigate = useNavigate();
  const gardenID = localStorage.getItem('gardenID') || '';
  
  // ย้าย State ควบคุมเมนูมาไว้ที่ Layout
  const [activeTab, setActiveTab] = useState('plots');

  const handleLogout = () => {
    localStorage.removeItem('gardenID');
    localStorage.removeItem('userRole');
    localStorage.removeItem('mustChangePassword');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* Sidebar Navigation เมนูด้านข้าง */}
      <div style={{ width: '260px', backgroundColor: '#1c431b', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid #2d6a4f', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#d8f3dc' }}>ระบบจัดการสวน</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#b7e4c7' }}>รหัสเจ้าของสวน: <b>{gardenID}</b></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('plots')}
              style={{
                padding: '12px 15px', borderRadius: '8px', border: 'none', textAlign: 'left', fontSize: '15px', cursor: 'pointer',
                backgroundColor: activeTab === 'plots' ? '#2d6a4f' : 'transparent',
                color: '#fff', fontWeight: activeTab === 'plots' ? 'bold' : 'normal'
              }}
            >
              1. จัดการแปลงยาง
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              style={{
                padding: '12px 15px', borderRadius: '8px', border: 'none', textAlign: 'left', fontSize: '15px', cursor: 'pointer',
                backgroundColor: activeTab === 'employees' ? '#2d6a4f' : 'transparent',
                color: '#fff', fontWeight: activeTab === 'employees' ? 'bold' : 'normal'
              }}
            >
              2. จัดการคนกรีดยาง
            </button>
            <button
              onClick={() => setActiveTab('income')}
              style={{
                padding: '12px 15px', borderRadius: '8px', border: 'none', textAlign: 'left', fontSize: '15px', cursor: 'pointer',
                backgroundColor: activeTab === 'income' ? '#2d6a4f' : 'transparent',
                color: '#fff', fontWeight: activeTab === 'income' ? 'bold' : 'normal'
              }}
            >
              3. สรุปรายได้แปลงยาง
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#d90429',
            color: '#fff', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center'
          }}
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Main Content Area: โยน activeTab ไปให้หน้า Dashboard ผ่าน context */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <Outlet context={{ activeTab }} />
      </div>
      
    </div>
  );
}

export default OwnerLayout;