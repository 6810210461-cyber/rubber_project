import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GardenOwnerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gardenID = searchParams.get('gardenID') || localStorage.getItem('gardenID') || '';

  // รับค่า activeTab มาจาก OwnerLayout
  const { activeTab } = useOutletContext() || { activeTab: 'plots' };

  const [mustChangePass, setMustChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [plots, setPlots] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [incomeRecords, setIncomeRecords] = useState([]);

  const [plotName, setPlotName] = useState('');
  const [gardenLocation, setGardenLocation] = useState('');
  const [editingPlotId, setEditingPlotId] = useState(null); 

  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [editingEmpId, setEditingEmpId] = useState(null); 

  const [searchPlot, setSearchPlot] = useState('');
  const [searchEmp, setSearchEmp] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPlotName, setFilterPlotName] = useState('');

  useEffect(() => {
    if (!gardenID) {
      alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      navigate('/');
      return;
    }
    localStorage.setItem('gardenID', gardenID);

    if (localStorage.getItem('mustChangePassword') === 'true') {
      setMustChangePass(true);
    }
    fetchPlots();
    fetchEmployees();
  }, [gardenID]);

  useEffect(() => {
    if (activeTab === 'income') {
      fetchIncomeRecords();
    }
  }, [activeTab, filterDate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 4) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    try {
      // ดึง Token ที่เก็บไว้ในเครื่องตอนล็อกอินสำเร็จออกมา
      const token = localStorage.getItem('token');
      
      const res = await fetch('http://localhost:3000/api/change-password', {
        method: 'POST',
        // แนบ Token ไปใน Headers ด้วย เพื่อให้ยามฝั่งเซิร์ฟเวอร์ตรวจว่าเรามีสิทธิ์เปลี่ยนรหัสผ่านจริงๆ
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: gardenID, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        localStorage.setItem('mustChangePassword', 'false');
        setMustChangePass(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const fetchPlots = async () => {
    try {
      // ดึง Token มาเตรียมไว้
      const token = localStorage.getItem('token');
      
      // การดึงข้อมูลแบบ GET เราก็แนบ Token ไปด้วยเพื่อความปลอดภัยสูงสุด
      const res = await fetch(`http://localhost:3000/api/plots/${gardenID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setPlots(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://localhost:3000/api/employees/${gardenID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncomeRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://localhost:3000/api/daily-log-details?date=${filterDate}&gardenID=${gardenID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setIncomeRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPlot = (p) => {
    setEditingPlotId(p.id);
    setPlotName(p.plotname || '');
    setGardenLocation(p.gardenlocation || '');
  };

  const handleCancelPlotEdit = () => {
    setEditingPlotId(null);
    setPlotName('');
    setGardenLocation('');
  };

  const handleSavePlot = async (e) => {
    e.preventDefault();
    try {
      // ดึงบัตรผ่านทางมาเตรียมไว้ก่อนบันทึกข้อมูล
      const token = localStorage.getItem('token');
      
      const url = editingPlotId 
        ? `http://localhost:3000/api/edit-plot/${editingPlotId}` 
        : 'http://localhost:3000/api/add-plot';
      const method = editingPlotId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          // แนบ Token ไปให้เซิร์ฟเวอร์ เพื่อยืนยันว่าเราล็อกอินแล้วถึงจะบันทึกแปลงยางได้
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gardenID, plotName, gardenLocation })
      });
      const data = await res.json();
      if (data.success) {
        alert(editingPlotId ? 'แก้ไขแปลงยางสำเร็จ' : 'เพิ่มแปลงยางสำเร็จ');
        handleCancelPlotEdit();
        fetchPlots(); 
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleDeletePlot = async (id) => {
    if (!confirm('คุณต้องการลบแปลงยางนี้ใช่หรือไม่?')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://localhost:3000/api/delete-plot/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('ลบแปลงยางเรียบร้อย');
        fetchPlots();
      } else {
        alert(data.error || 'ไม่สามารถลบแปลงยางได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleEditEmployee = (emp) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name || '');
    setEmpPhone(emp.phone || '');
    setEmpPassword('');
  };

  const handleCancelEmpEdit = () => {
    setEditingEmpId(null);
    setEmpName('');
    setEmpPhone('');
    setEmpPassword('');
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const url = editingEmpId 
        ? `http://localhost:3000/api/edit-employee/${editingEmpId}` 
        : 'http://localhost:3000/api/add-employee';
      const method = editingEmpId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gardenID, name: empName, phone: empPhone, password: empPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert(editingEmpId ? 'แก้ไขข้อมูลคนกรีดยางสำเร็จ' : 'เพิ่มคนกรีดยางสำเร็จ');
        handleCancelEmpEdit();
        fetchEmployees(); 
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('คุณต้องการลบรายชื่อนี้ใช่หรือไม่?')) return;
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`http://localhost:3000/api/delete-employee/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('ลบเรียบร้อย');
        fetchEmployees();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const filteredPlots = plots.filter(p =>
    p.plotname?.toLowerCase().includes(searchPlot.toLowerCase()) ||
    p.gardenlocation?.toLowerCase().includes(searchPlot.toLowerCase())
  );

  const filteredEmployees = employees.filter(e =>
    e.name?.toLowerCase().includes(searchEmp.toLowerCase()) ||
    e.phone?.includes(searchEmp)
  );

  const filteredIncome = incomeRecords.filter(item => {
    return filterPlotName ? item.plotname?.toLowerCase().includes(filterPlotName.toLowerCase()) : true;
  });

  const totalOwnerIncome = filteredIncome.reduce((acc, curr) => acc + (parseFloat(curr.owner_amount) || 0), 0);
  const totalWeight = filteredIncome.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);

  const chartData = filteredIncome.reduce((acc, curr) => {
    const plot = curr.plotname || 'ไม่ระบุชื่อแปลง';
    const income = parseFloat(curr.owner_amount) || 0;
    const existingPlot = acc.find(item => item.name === plot);
    if (existingPlot) {
      existingPlot.income += income;
    } else {
      acc.push({ name: plot, income: income });
    }
    return acc;
  }, []);

  return (
    <>
      {activeTab === 'plots' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#1b4332', marginTop: 0 }}>
              {editingPlotId ? 'แก้ไขแปลงยาง' : 'เพิ่มแปลงยาง'}
            </h3>
            <form onSubmit={handleSavePlot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>ชื่อแปลงยาง:</label>
                <input type="text" placeholder="เช่น แปลงเขาใหญ่, แปลงที่ 1" value={plotName} onChange={(e) => setPlotName(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>สถานที่ / ตำแหน่งที่ตั้ง:</label>
                <input type="text" placeholder="เช่น หมู่ 3 ต.สะเดา" value={gardenLocation} onChange={(e) => setGardenLocation(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: editingPlotId ? '#d97706' : '#2d6a4f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingPlotId ? 'บันทึกการแก้ไข' : '+ บันทึกเพิ่มแปลงยาง'}
                </button>
                {editingPlotId && (
                  <button type="button" onClick={handleCancelPlotEdit} style={{ padding: '12px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#1b4332', margin: 0 }}>รายการแปลงยาง ({filteredPlots.length})</h3>
              <input type="text" placeholder="ค้นหาแปลงยาง..." value={searchPlot} onChange={(e) => setSearchPlot(e.target.value)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', fontSize: '14px' }} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ชื่อแปลง</th>
                  <th style={{ padding: '10px' }}>ที่ตั้ง</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlots.length > 0 ? (
                  filteredPlots.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><b>{p.plotname}</b></td>
                      <td style={{ padding: '10px' }}>{p.gardenlocation}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => handleEditPlot(p)} style={{ backgroundColor: '#f0a500', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>แก้ไข</button>
                        <button onClick={() => handleDeletePlot(p.id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>ลบ</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>ไม่พบข้อมูลแปลงยาง</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#1b4332', marginTop: 0 }}>{editingEmpId ? 'แก้ไขข้อมูลคนกรีดยาง' : 'เพิ่มคนกรีดยาง (ลูกจ้าง)'}</h3>
            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>ชื่อ - นามสกุล:</label>
                <input type="text" placeholder="เช่น นายสมชาย ขยันกรีด" value={empName} onChange={(e) => setEmpName(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>เบอร์โทรศัพท์ (Username):</label>
                <input type="text" placeholder="เช่น 0812345678" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>{editingEmpId ? 'ตั้งรหัสผ่านใหม่ (หากไม่ต้องการเปลี่ยนให้เว้นว่าง):' : 'ตั้งรหัสผ่าน:'}</label>
                <input type="password" placeholder="กำหนดรหัสผ่าน" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required={!editingEmpId} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: editingEmpId ? '#d97706' : '#2d6a4f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingEmpId ? 'บันทึกการแก้ไข' : '+ บันทึกเพิ่มคนกรีดยาง'}
                </button>
                {editingEmpId && (
                  <button type="button" onClick={handleCancelEmpEdit} style={{ padding: '12px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>ยกเลิก</button>
                )}
              </div>
            </form>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#1b4332', margin: 0 }}>รายชื่อคนกรีดยาง ({filteredEmployees.length})</h3>
              <input type="text" placeholder="ค้นหาคนกรีด/เบอร์..." value={searchEmp} onChange={(e) => setSearchEmp(e.target.value)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', fontSize: '14px' }} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ชื่อ</th>
                  <th style={{ padding: '10px' }}>เบอร์โทร</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((e, idx) => (
                    <tr key={e.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><b>{e.name}</b></td>
                      <td style={{ padding: '10px' }}>{e.phone}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => handleEditEmployee(e)} style={{ backgroundColor: '#f0a500', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>แก้ไข</button>
                        <button onClick={() => handleDeleteEmployee(e.id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>ลบ</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>ไม่พบข้อมูลคนกรีดยาง</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#1b4332', marginTop: 0 }}>ค้นหารายได้สวนยาง</h3>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>เลือกวันที่:</label>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>ค้นหาชื่อแปลงยาง:</label>
                <input type="text" placeholder="พิมพ์ชื่อแปลงยาง..." value={filterPlotName} onChange={(e) => setFilterPlotName(e.target.value)} style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#d8f3dc', padding: '20px', borderRadius: '10px', border: '1px solid #b7e4c7' }}>
              <h4 style={{ margin: 0, color: '#1b4332' }}>รายได้รวมเจ้าของสวน (บาท)</h4>
              <h2 style={{ margin: '10px 0 0 0', color: '#2d6a4f' }}>฿{totalOwnerIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div style={{ backgroundColor: '#e9ecef', padding: '20px', borderRadius: '10px', border: '1px solid #dee2e6' }}>
              <h4 style={{ margin: 0, color: '#495057' }}>น้ำหนักยางรวม (กก.)</h4>
              <h2 style={{ margin: '10px 0 0 0', color: '#212529' }}>{totalWeight.toLocaleString('th-TH')} กก.</h2>
            </div>
          </div>

          {chartData.length > 0 && (
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h4 style={{ color: '#1b4332', marginTop: 0, marginBottom: '20px' }}>กราฟเปรียบเทียบรายได้แต่ละแปลง (บาท)</h4>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="name" tick={{ fill: '#495057' }} />
                    <YAxis tick={{ fill: '#495057' }} />
                    <Tooltip formatter={(value) => [`฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, 'รายได้เจ้าของ']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar name="รายได้เจ้าของสวน" dataKey="income" fill="#2d6a4f" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h4 style={{ color: '#1b4332', marginTop: 0 }}>รายละเอียดการขายน้ำยางประจำวัน</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1b4332', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>แปลงยาง</th>
                  <th style={{ padding: '10px' }}>คนกรีดยาง</th>
                  <th style={{ padding: '10px' }}>น้ำหนัก (กก.)</th>
                  <th style={{ padding: '10px' }}>% DRC</th>
                  <th style={{ padding: '10px' }}>ราคายาง</th>
                  <th style={{ padding: '10px' }}>ส่วนแบ่งเจ้าของ (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncome.length > 0 ? (
                  filteredIncome.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><b>{item.plotname}</b></td>
                      <td style={{ padding: '10px' }}>{item.tapper_name}</td>
                      <td style={{ padding: '10px' }}>{item.weight}</td>
                      <td style={{ padding: '10px' }}>{item.drc}%</td>
                      <td style={{ padding: '10px' }}>฿{item.price}</td>
                      <td style={{ padding: '10px', color: '#2d6a4f', fontWeight: 'bold' }}>฿{parseFloat(item.owner_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>ไม่พบรายการขายยางในเงื่อนไขที่เลือก</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mustChangePass && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', width: '360px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: '#d90429', marginTop: 0 }}>บังคับเปลี่ยนรหัสผ่าน</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>คุณเข้าใช้งานด้วยรหัสผ่านชั่วคราว กรุณาเปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัย</p>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="password" placeholder="รหัสผ่านใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              <input type="password" placeholder="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
              <button type="submit" style={{ padding: '12px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>บันทึกรหัสผ่านใหม่</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default GardenOwnerDashboard;