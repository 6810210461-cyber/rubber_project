import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// --- เพิ่ม Import สำหรับทำกราฟ ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GardenOwnerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gardenID = searchParams.get('gardenID') || localStorage.getItem('gardenID') || '';

  // State สำหรับบังคับเปลี่ยนรหัสผ่าน
  const [mustChangePass, setMustChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // เมนูหลักที่เลือก (plots = แปลงยาง, employees = คนกรีด, income = รายได้)
  const [activeTab, setActiveTab] = useState('plots');

  // ข้อมูลจากระบบ
  const [plots, setPlots] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [incomeRecords, setIncomeRecords] = useState([]);

  // ฟอร์มเพิ่มแปลงยาง
  const [plotName, setPlotName] = useState('');
  const [gardenLocation, setGardenLocation] = useState('');

  // ฟอร์มเพิ่มคนกรีดยาง
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('');

  // ตัวค้นหาและตัวกรอง
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

    // ตรวจสอบว่าต้องบังคับเปลี่ยนรหัสผ่านหรือไม่
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

  // ฟังก์ชันสำหรับบังคับเปลี่ยนรหัสผ่าน
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
      const res = await fetch('http://localhost:3000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // ดึงข้อมูล API
  const fetchPlots = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/plots/${gardenID}`);
      const data = await res.json();
      if (Array.isArray(data)) setPlots(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/employees/${gardenID}`);
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIncomeRecords = async () => {
    try {
      // แก้ไขการส่งพารามิเตอร์ gardenID เพื่อดึงข้อมูลเฉพาะสวนนั้นๆ
      const res = await fetch(`http://localhost:3000/api/daily-log-details?date=${filterDate}&gardenID=${gardenID}`);
      const data = await res.json();
      if (Array.isArray(data)) setIncomeRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  // บันทึกแปลงยาง
  const handleAddPlot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/add-plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gardenID, plotName, gardenLocation })
      });
      const data = await res.json();
      if (data.success) {
        alert('เพิ่มแปลงยางสำเร็จ');
        setPlotName('');
        setGardenLocation('');
        fetchPlots();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  // ลบแปลงยาง
  const handleDeletePlot = async (id) => {
    if (!confirm('คุณต้องการลบแปลงยางนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/delete-plot/${id}`, { method: 'DELETE' });
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

  // บันทึกคนกรีด
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/add-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gardenID, name: empName, phone: empPhone, password: empPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('เพิ่มคนกรีดยางสำเร็จ');
        setEmpName('');
        setEmpPhone('');
        setEmpPassword('');
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
      const res = await fetch(`http://localhost:3000/api/delete-employee/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('ลบเรียบร้อย');
        fetchEmployees();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gardenID');
    localStorage.removeItem('userRole');
    localStorage.removeItem('mustChangePassword');
    navigate('/');
  };

  // ตัวกรองการค้นหา
  const filteredPlots = plots.filter(p =>
    p.plotname?.toLowerCase().includes(searchPlot.toLowerCase()) ||
    p.gardenlocation?.toLowerCase().includes(searchPlot.toLowerCase())
  );

  const filteredEmployees = employees.filter(e =>
    e.name?.toLowerCase().includes(searchEmp.toLowerCase()) ||
    e.phone?.includes(searchEmp)
  );

  const filteredIncome = incomeRecords.filter(item => {
    const matchPlot = filterPlotName ? item.plotname?.toLowerCase().includes(filterPlotName.toLowerCase()) : true;
    return matchPlot;
  });

  const totalOwnerIncome = filteredIncome.reduce((acc, curr) => acc + (parseFloat(curr.owner_amount) || 0), 0);
  const totalWeight = filteredIncome.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);

  // --- เริ่ม: ส่วนประมวลผลข้อมูลสำหรับกราฟแท่ง ---
  // รวมยอดรายได้แยกตามแต่ละแปลงยาง
  const chartData = filteredIncome.reduce((acc, curr) => {
    const plot = curr.plotname || 'ไม่ระบุชื่อแปลง';
    const income = parseFloat(curr.owner_amount) || 0;
    
    // หาว่าแปลงนี้มีใน array หรือยัง
    const existingPlot = acc.find(item => item.name === plot);
    if (existingPlot) {
      existingPlot.income += income; // ถ้ามีแล้วให้บวกรายได้เพิ่ม
    } else {
      acc.push({ name: plot, income: income }); // ถ้ายังไม่มีให้เพิ่มแปลงใหม่เข้าไป
    }
    return acc;
  }, []);
  // --- จบ: ส่วนประมวลผลข้อมูลสำหรับกราฟแท่ง ---

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* แถบเมนูด้านข้าง (Sidebar) */}
      <div style={{ width: '260px', backgroundColor: '#1b4332', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid #2d6a4f', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#d8f3dc' }}>ระบบจัดการสวน</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#b7e4c7' }}>รหัสเจ้าของสวน: <b>{gardenID}</b></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('plots')}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                border: 'none',
                textAlign: 'left',
                fontSize: '15px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'plots' ? '#2d6a4f' : 'transparent',
                color: '#fff',
                fontWeight: activeTab === 'plots' ? 'bold' : 'normal'
              }}
            >
              1. จัดการแปลงยาง
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                border: 'none',
                textAlign: 'left',
                fontSize: '15px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'employees' ? '#2d6a4f' : 'transparent',
                color: '#fff',
                fontWeight: activeTab === 'employees' ? 'bold' : 'normal'
              }}
            >
              2. จัดการคนกรีดยาง
            </button>

            <button
              onClick={() => setActiveTab('income')}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                border: 'none',
                textAlign: 'left',
                fontSize: '15px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'income' ? '#2d6a4f' : 'transparent',
                color: '#fff',
                fontWeight: activeTab === 'income' ? 'bold' : 'normal'
              }}
            >
              3. สรุปรายได้แปลงยาง
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#d90429',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          ออกจากระบบ
        </button>
      </div>

      {/* พื้นที่แสดงเนื้อหาหลัก (Main Content) */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

        {/* TAB 1: จัดการแปลงยาง */}
        {activeTab === 'plots' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1b4332', marginTop: 0 }}>เพิ่มแปลงยาง</h3>
              <form onSubmit={handleAddPlot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label>ชื่อแปลงยาง:</label>
                  <input
                    type="text"
                    placeholder="เช่น แปลงเขาใหญ่, แปลงที่ 1"
                    value={plotName}
                    onChange={(e) => setPlotName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label>สถานที่ / ตำแหน่งที่ตั้ง:</label>
                  <input
                    type="text"
                    placeholder="เช่น หมู่ 3 ต.สะเดา"
                    value={gardenLocation}
                    onChange={(e) => setGardenLocation(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" style={{ padding: '12px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + บันทึกเพิ่มแปลงยาง
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#1b4332', margin: 0 }}>รายการแปลงยาง ({filteredPlots.length})</h3>
                <input
                  type="text"
                  placeholder="ค้นหาแปลงยาง..."
                  value={searchPlot}
                  onChange={(e) => setSearchPlot(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', fontSize: '14px' }}
                />
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
                          <button onClick={() => handleDeletePlot(p.id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                            ลบ
                          </button>
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

        {/* TAB 2: จัดการคนกรีดยาง */}
        {activeTab === 'employees' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1b4332', marginTop: 0 }}>เพิ่มคนกรีดยาง (ลูกจ้าง)</h3>
              <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label>ชื่อ - นามสกุล:</label>
                  <input
                    type="text"
                    placeholder="เช่น นายสมชาย ขยันกรีด"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label>เบอร์โทรศัพท์ (Username):</label>
                  <input
                    type="text"
                    placeholder="เช่น 0812345678"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label>ตั้งรหัสผ่าน:</label>
                  <input
                    type="password"
                    placeholder="กำหนดรหัสผ่าน"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" style={{ padding: '12px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + บันทึกเพิ่มคนกรีดยาง
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#1b4332', margin: 0 }}>รายชื่อคนกรีดยาง ({filteredEmployees.length})</h3>
                <input
                  type="text"
                  placeholder="ค้นหาคนกรีด/เบอร์..."
                  value={searchEmp}
                  onChange={(e) => setSearchEmp(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', fontSize: '14px' }}
                />
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
                          <button onClick={() => handleDeleteEmployee(e.id)} style={{ backgroundColor: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                            ลบ
                          </button>
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

        {/* TAB 3: รายงานสรุปรายได้และค้นหาตามแปลง */}
        {activeTab === 'income' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#1b4332', marginTop: 0 }}>ค้นหารายได้สวนยาง</h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>เลือกวันที่:</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>ค้นหาชื่อแปลงยาง:</label>
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อแปลงยาง..."
                    value={filterPlotName}
                    onChange={(e) => setFilterPlotName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>
            </div>

            {/* การ์ดสรุปยอด */}
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

            {/* --- เริ่ม: UI กราฟที่เพิ่มเข้ามาใหม่ --- */}
            {chartData.length > 0 && (
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#1b4332', marginTop: 0, marginBottom: '20px' }}>กราฟเปรียบเทียบรายได้แต่ละแปลง (บาท)</h4>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      <XAxis dataKey="name" tick={{ fill: '#495057' }} />
                      <YAxis tick={{ fill: '#495057' }} />
                      <Tooltip 
                        formatter={(value) => [`฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, 'รายได้เจ้าของ']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar name="รายได้เจ้าของสวน" dataKey="income" fill="#2d6a4f" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {/* --- จบ: UI กราฟ --- */}

            {/* ตารางแสดงรายการรายได้ */}
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
                        <td style={{ padding: '10px', color: '#2d6a4f', fontWeight: 'bold' }}>
                          ฿{parseFloat(item.owner_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
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

      </div>

      {/* Modal บังคับเปลี่ยนรหัสผ่านเมื่อล็อกอินครั้งแรก */}
      {mustChangePass && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', width: '360px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: '#d90429', marginTop: 0 }}>บังคับเปลี่ยนรหัสผ่าน</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>คุณเข้าใช้งานด้วยรหัสผ่านชั่วคราว กรุณาเปลี่ยนรหัสผ่านใหม่เพื่อความปลอดภัย</p>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="password"
                placeholder="รหัสผ่านใหม่"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ padding: '12px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                บันทึกรหัสผ่านใหม่
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default GardenOwnerDashboard;