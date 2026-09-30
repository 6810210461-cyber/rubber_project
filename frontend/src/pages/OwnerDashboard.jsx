import React, { useState, useEffect } from 'react';

export default function OwnerDashboard() {
  // ดึง URL จาก Environment Variable
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // State สำหรับเช็กว่าต้องเปลี่ยนรหัสผ่านหรือไม่
  const [mustChangePass, setMustChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // สมมติว่าเช็กจาก LocalStorage หรือข้อมูล User ว่าเป็นล็อกอินครั้งแรกไหม
    // ถ้าใช่ ให้ setMustChangePass(true)
    const isFirstLogin = localStorage.getItem('isFirstLogin'); 
    if (isFirstLogin === 'true') {
      setMustChangePass(true);
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      // โค้ดส่ง API เปลี่ยนรหัสผ่าน
      // await axios.post(`${API_URL}/api/change-password`, { password: newPassword });
      
      alert('เปลี่ยนรหัสผ่านสำเร็จ!');
      setMustChangePass(false);
      localStorage.removeItem('isFirstLogin');
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Owner Dashboard</h1>
      <p>ยินดีต้อนรับเข้าสู่ระบบจัดการสวน</p>
      {/* เนื้อหา Dashboard อื่นๆ ของคุณใส่ตรงนี้ */}

      {/* Modal บังคับเปลี่ยนรหัสผ่าน */}
      {mustChangePass && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>กรุณาเปลี่ยนรหัสผ่าน</h2>
            <p>นี่เป็นการเข้าสู่ระบบครั้งแรกของคุณ โปรดตั้งรหัสผ่านใหม่</p>
            <form onSubmit={handleChangePassword}>
              <input 
                type="password" 
                placeholder="รหัสผ่านใหม่" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                required
              />
              <button type="submit" style={styles.button}>ยืนยันการเปลี่ยนรหัสผ่าน</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// แยก Styles ไว้ด้านล่างให้โค้ดดู Clean
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '15px 0',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};