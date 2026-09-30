import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeeDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [history, setHistory] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawalHistory, setWithdrawalHistory] = useState([]); // เก็บประวัติการเบิก
    const [timeFilter, setTimeFilter] = useState('all'); 
    
    const empID = localStorage.getItem('empID');
    const gardenID = localStorage.getItem('gardenID') || 'ไม่ระบุ';

    useEffect(() => {
        if (!empID) {
            navigate('/login');
            return;
        }
        fetchAssignments();
        fetchHistory();
        fetchWithdrawalHistory(); // โหลดประวัติเบิกเงินตอนเปิดหน้า
    }, [empID, navigate]);

    const fetchAssignments = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/employee-assignments/${empID}`);
            setAssignments(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/employee-history/${empID}`);
            setHistory(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchWithdrawalHistory = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/employee-withdrawals/${empID}`);
            setWithdrawalHistory(await res.json());
        } catch (error) { console.error(error); }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
            alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empID, amount: parseFloat(withdrawAmount) })
            });
            const data = await res.json();
            if (data.success) {
                alert('ส่งคำขอเบิกเงินเรียบร้อยแล้ว');
                setWithdrawAmount('');
                fetchWithdrawalHistory(); // โหลดตารางประวัติใหม่ทันทีที่ส่งคำขอสำเร็จ
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการส่งคำขอ');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const filteredHistory = history.filter(item => {
        if (timeFilter === 'all') return true;
        const recordDate = new Date(item.record_date);
        const today = new Date();
        if (timeFilter === 'daily') return recordDate.toDateString() === today.toDateString();
        if (timeFilter === 'weekly') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(today.getDate() - 7);
            return recordDate >= oneWeekAgo && recordDate <= today;
        }
        return true;
    });

    const getStatusText = (status) => {
        if (status === 'approved') return <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ อนุมัติแล้ว</span>;
        if (status === 'rejected') return <span style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ ไม่อนุมัติ</span>;
        return <span style={{ color: '#f39c12', fontWeight: 'bold' }}>⏳ รอตรวจสอบ</span>;
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'sans-serif' }}>
            
            {/* Sidebar */}
            <div style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #34495e', textAlign: 'center' }}>
                    ระบบคนกรีดยาง
                </div>
                <div style={{ flex: 1, padding: '10px 0' }}>
                    <button onClick={() => setActiveTab('home')} style={{ ...sidebarButtonStyle, backgroundColor: activeTab === 'home' ? '#34495e' : 'transparent' }}>
                        🏠 หน้าหลัก (รายได้)
                    </button>
                    <button onClick={() => setActiveTab('withdraw')} style={{ ...sidebarButtonStyle, backgroundColor: activeTab === 'withdraw' ? '#34495e' : 'transparent' }}>
                        💰 ขอเบิกเงินล่วงหน้า
                    </button>
                </div>
                <div style={{ padding: '20px', borderTop: '1px solid #34495e' }}>
                    <button onClick={handleLogout} style={{ ...sidebarButtonStyle, backgroundColor: '#e74c3c', color: 'white', textAlign: 'center' }}>
                        ออกจากระบบ
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                
                {activeTab === 'home' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>หน้าหลัก</h2>
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                            <p><strong>รหัสประจำตัว:</strong> {empID}</p>
                            <p><strong>รหัสเจ้าของสวนที่สังกัด:</strong> {gardenID}</p>
                            <p><strong>แปลงยางที่รับผิดชอบ:</strong></p>
                            <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
                                {assignments.length > 0 ? assignments.map(a => (
                                    <li key={a.assignment_id}>{a.plotname} {a.gardenlocation ? `(${a.gardenlocation})` : ''}</li>
                                )) : <li style={{ color: 'gray' }}>ยังไม่มีการผูกแปลงยาง</li>}
                            </ul>
                        </div>

                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>📊 ประวัติรายได้ของคุณ</h3>
                                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                    <option value="all">ทั้งหมด (50 รายการล่าสุด)</option>
                                    <option value="daily">รายวัน (วันนี้)</option>
                                    <option value="weekly">รายสัปดาห์ (7 วันล่าสุด)</option>
                                </select>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
                                        <th style={thStyle}>วันที่</th>
                                        <th style={thStyle}>แปลงยาง</th>
                                        <th style={thStyle}>น้ำหนัก (กก.)</th>
                                        <th style={thStyle}>ส่วนแบ่งของคุณ (บาท)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.length > 0 ? filteredHistory.map(row => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={tdStyle}>{row.record_date}</td>
                                            <td style={tdStyle}>{row.plotname}</td>
                                            <td style={tdStyle}>{Number(row.weight).toFixed(2)}</td>
                                            <td style={{ ...tdStyle, color: 'green', fontWeight: 'bold' }}>{Number(row.my_income).toFixed(2)} ฿</td>
                                        </tr>
                                    )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>ไม่มีข้อมูลรายได้</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'withdraw' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>ส่งคำขอเบิกเงินล่วงหน้า</h2>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '600px', marginBottom: '30px' }}>
                            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <label style={{ fontWeight: 'bold' }}>ระบุจำนวนเงินที่ต้องการเบิก (บาท)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="เช่น 500"
                                    required
                                    style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                                />
                                <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                                    ส่งคำขอเบิกเงิน
                                </button>
                            </form>
                        </div>

                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '800px' }}>
                            <h3 style={{ marginBottom: '15px' }}>📝 ประวัติการขอเบิกเงินของคุณ</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
                                        <th style={thStyle}>วันที่ขอเบิก</th>
                                        <th style={thStyle}>จำนวนเงิน (บาท)</th>
                                        <th style={thStyle}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalHistory.length > 0 ? withdrawalHistory.map(row => (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={tdStyle}>{row.req_date}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{Number(row.amount).toLocaleString()} ฿</td>
                                            <td style={tdStyle}>{getStatusText(row.status)}</td>
                                        </tr>
                                    )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>ยังไม่มีประวัติการเบิกเงิน</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const sidebarButtonStyle = { width: '100%', padding: '15px 20px', textAlign: 'left', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', transition: 'background 0.3s' };
const thStyle = { padding: '12px', fontWeight: 'bold' };
const tdStyle = { padding: '12px' };

export default EmployeeDashboard;