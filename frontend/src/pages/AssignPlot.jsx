import React, { useState, useEffect } from 'react';

const AssignPlot = () => {
  const [owners, setOwners] = useState([]);
  const [plots, setPlots] = useState([]);
  const [tappers, setTappers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [formData, setFormData] = useState({
    gardenID: '',
    plotID: '',
    employeeID: '',
    shareRatio: '60,40'
  });

  useEffect(() => {
    // 📌 ดึง Token สำหรับใช้ในการดึงข้อมูลเริ่มต้น
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:3000/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOwners(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching owners:", err));
      
    fetchAssignments();
  }, []);

  const fetchAssignments = () => {
    // 📌 แนบ Token ตอนดึงข้อมูลการผูกแปลง
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/assignments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching assignments:", err));
  };

  const handleOwnerChange = (e) => {
    const gardenID = e.target.value;
    setFormData({ ...formData, gardenID, plotID: '', employeeID: '' });

    if (gardenID) {
      // 📌 แนบ Token ตอนดึงแปลงยางและลูกจ้างตามรหัสเจ้าของสวน
      const token = localStorage.getItem('token');
      
      fetch(`http://localhost:3000/api/plots/${gardenID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setPlots(Array.isArray(data) ? data : []));
        
      fetch(`http://localhost:3000/api/employees/${gardenID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setTappers(Array.isArray(data) ? data : []));
    } else {
      setPlots([]);
      setTappers([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const [ownerShare, tapperShare] = formData.shareRatio.split(',');

    const payload = {
      gardenID: formData.gardenID,
      plotID: formData.plotID,
      employeeID: formData.employeeID,
      ownerShare: Number(ownerShare),
      tapperShare: Number(tapperShare)
    };

    // 📌 แนบ Token ตอนบันทึกข้อมูลการผูกแปลง
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/assign-plot', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('บันทึกการผูกแปลงเรียบร้อยแล้ว!');
        fetchAssignments();
        setFormData({ ...formData, plotID: '', employeeID: '' });
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.error || data.message));
      }
    })
    .catch(() => alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'));
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณต้องการลบข้อมูลการผูกแปลงนี้ใช่หรือไม่?')) {
      // 📌 แนบ Token ตอนสั่งลบ
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3000/api/delete-assignment/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('ลบรายการเรียบร้อยแล้ว!');
            fetchAssignments();
          }
        })
        .catch(() => alert('เกิดข้อผิดพลาดในการลบ'));
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif', color: '#334155' }}>
      
      {/* การ์ดฟอร์มผูกแปลง */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        marginBottom: '28px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ backgroundColor: '#5c8a47', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🌿</span>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>จัดการผูกแปลงยาง / กำหนดส่วนแบ่ง</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            
            {/* 1. เจ้าของสวน */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
                1. เลือกเจ้าของสวน
              </label>
              <select 
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
                value={formData.gardenID}
                onChange={handleOwnerChange}
              >
                <option value="">-- เลือกเจ้าของสวน --</option>
                {owners.map(owner => (
                  <option key={owner.gardenid} value={owner.gardenid}>
                    {owner.gardenid} - {owner.nametitle}{owner.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. แปลงยาง */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
                2. เลือกแปลงยาง
              </label>
              <select 
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: !formData.gardenID ? '#f1f5f9' : '#ffffff',
                  cursor: !formData.gardenID ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box'
                }}
                value={formData.plotID}
                onChange={e => setFormData({ ...formData, plotID: e.target.value })}
                disabled={!formData.gardenID}
              >
                <option value="">-- เลือกแปลงยาง --</option>
                {plots.map(plot => (
                  <option key={plot.id} value={plot.id}>{plot.plotname}</option>
                ))}
              </select>
            </div>

            {/* 3. คนกรีด */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
                3. เลือกคนกรีด (ลูกจ้าง)
              </label>
              <select 
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: !formData.gardenID ? '#f1f5f9' : '#ffffff',
                  cursor: !formData.gardenID ? 'not-allowed' : 'pointer',
                  boxSizing: 'border-box'
                }}
                value={formData.employeeID}
                onChange={e => setFormData({ ...formData, employeeID: e.target.value })}
                disabled={!formData.gardenID}
              >
                <option value="">-- เลือกคนกรีดยาง --</option>
                {tappers.map(tapper => (
                  <option key={tapper.id} value={tapper.id}>{tapper.name}</option>
                ))}
              </select>
            </div>

            {/* 4. ส่วนแบ่ง */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
                4. สัดส่วนแบ่งรายได้ (%)
              </label>
              <select 
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
                value={formData.shareRatio}
                onChange={e => setFormData({ ...formData, shareRatio: e.target.value })}
              >
                <option value="60,40">เจ้าของสวน 60% / คนกรีด 40%</option>
                <option value="50,50">เจ้าของสวน 50% / คนกรีด 50%</option>
                <option value="70,30">เจ้าของสวน 70% / คนกรีด 30%</option>
                <option value="100,0">เจ้าของสวน 100% (ไม่หักแบ่ง)</option>
              </select>
            </div>

          </div>

          <div style={{ textAlign: 'right' }}>
            <button 
              type="submit" 
              style={{
                backgroundColor: '#386cc7',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(56, 108, 199, 0.2)'
              }}
            >
              💾 บันทึกการผูกแปลง
            </button>
          </div>
        </form>
      </div>

      {/* การ์ดแสดงตารางข้อมูล */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📋</span>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 'bold' }}>ข้อมูลการผูกแปลงปัจจุบัน</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#475569', fontSize: '13px' }}>
                <th style={{ padding: '12px 16px' }}>รหัสสวน</th>
                <th style={{ padding: '12px 16px' }}>เจ้าของสวน</th>
                <th style={{ padding: '12px 16px' }}>ชื่อแปลงยาง</th>
                <th style={{ padding: '12px 16px' }}>คนกรีด</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>ส่วนแบ่ง (เจ้าของ : คนกรีด)</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length > 0 ? assignments.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#0f172a' }}>{item.gardenid}</td>
                  <td style={{ padding: '14px 16px' }}>{item.owner_name}</td>
                  <td style={{ padding: '14px 16px' }}>{item.plotname}</td>
                  <td style={{ padding: '14px 16px' }}>{item.tapper_name}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#2563eb', fontWeight: 'bold' }}>
                    {item.owner_share}% : {item.tapper_share}%
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    ยังไม่มีข้อมูลการผูกแปลง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AssignPlot;