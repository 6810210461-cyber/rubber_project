import React, { useState, useEffect } from 'react';

function AddGardenOwner() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    title: '',
    fullName: '',
    phone: ''
  });

  // 1. สร้างฟังก์ชันสำหรับดึงรหัสประจำตัวถัดไป
  const fetchNextId = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/next-owner-id');
      const data = await response.json();
      if (data.success) {
        // อัปเดตเฉพาะค่า username ใน formData
        setFormData(prev => ({ ...prev, username: data.nextId }));
      }
    } catch (error) {
      console.error('ไม่สามารถดึงรหัสประจำตัวถัดไปได้:', error);
    }
  };

  // 2. ใช้ useEffect เพื่อเรียกฟังก์ชันดึงรหัสตอนโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    fetchNextId();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 📌 สร้างตัวแปร payload เพื่อแปลงชื่อให้ตรงกับที่ Backend (server.js) รอรับ
      const payload = {
        username: formData.username,
        password: formData.password,
        nametitle: formData.title,   // แปลงจาก title เป็น nametitle
        name: formData.fullName,     // แปลงจาก fullName เป็น name
        phone: formData.phone
      };

      // 3. ปรับ URL ให้ตรงกับ API ใน server.js (/api/add-garden-owner)
      const response = await fetch('http://localhost:3000/api/add-garden-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // 📌 ส่ง payload ไปแทน formData
      });
      const data = await response.json();
      
      if (data.success) {
        alert('เพิ่มสมาชิกเจ้าของสวนเรียบร้อยแล้ว!');
        // 4. ล้างค่าฟอร์ม (ยกเว้นรหัส ให้ไปดึงค่าใหม่ล่าสุดมาแทน)
        setFormData({ username: '', password: '', title: '', fullName: '', phone: '' });
        fetchNextId(); // ดึงรหัสใหม่เตรียมไว้สำหรับการกรอกคนต่อไป
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถบันทึกได้'));
      }
    } catch (error) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div style={{ padding: '30px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', width: '100%', maxWidth: '600px' }}>
        <h2 style={{ textAlign: 'center', color: '#1e4620', marginTop: 0, marginBottom: '25px' }}>
          แบบฟอร์มเพิ่มสมาชิกเจ้าของสวน
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderLeft: '4px solid #1e4620', paddingLeft: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e4620' }}>ข้อมูลสำหรับเข้าสู่ระบบ (User Account)</h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>รหัสประจำตัว (Username)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                readOnly // แนะนำให้เปิด readOnly ป้องกันผู้ใช้แก้รหัสที่ระบบรันให้
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  border: '1px solid #ccc', 
                  boxSizing: 'border-box',
                  backgroundColor: '#f5f5f5', // เปลี่ยนสีพื้นหลังนิดหน่อยให้รู้ว่าพิมพ์ไม่ได้
                  cursor: 'not-allowed'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>รหัสผ่านเข้าใช้งาน (Password)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ borderLeft: '4px solid #1e4620', paddingLeft: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e4620' }}>ข้อมูลส่วนตัวเจ้าของสวน</h4>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>คำนำหน้านาม</label>
              <select
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              >
                <option value="">-- เลือกคำนำหน้า --</option>
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>ชื่อ-นามสกุล</label>
              <input
                type="text"
                name="fullName"
                placeholder="ระบุชื่อและนามสกุล"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>เบอร์โทรศัพท์</label>
              <input
                type="text"
                name="phone"
                placeholder="เช่น 0812345678"
                value={formData.phone}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#1e4620',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            บันทึกและสร้างบัญชีเจ้าของสวน
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddGardenOwner;