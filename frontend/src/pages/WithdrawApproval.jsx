import React, { useState, useEffect } from 'react';

function WithdrawApproval() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingWithdrawals();
    }, []);

    const fetchPendingWithdrawals = async () => {
        try {
            const token = localStorage.getItem('token'); // 📌 ดึง Token
            const res = await fetch('http://localhost:3000/api/withdrawals/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setWithdrawals(data);
            setLoading(false);
        } catch (error) {
            console.error("ดึงข้อมูลคำขอเบิกเงินล้มเหลว:", error);
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const actionText = status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะ ${actionText} คำขอนี้?`)) return;

        try {
            const token = localStorage.getItem('token'); // 📌 ดึง Token
            const res = await fetch(`http://localhost:3000/api/withdrawals/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            
            if (data.success) {
                alert(`${actionText} รายการสำเร็จ!`);
                fetchPendingWithdrawals();
            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        } catch (error) {
            alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                
                <div style={{ backgroundColor: '#4a70e8', color: 'white', padding: '15px 20px', fontSize: '18px', fontWeight: 'bold' }}>
                    💸 อนุมัติการเบิกเงินล่วงหน้า
                </div>

                <div style={{ padding: '20px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>กำลังโหลดข้อมูล...</p>
                    ) : withdrawals.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>✅ ไม่มีคำขอเบิกเงินที่รออนุมัติ</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                                    <th style={thStyle}>วัน-เวลาที่ขอ</th>
                                    <th style={thStyle}>ผู้ขอเบิก</th>
                                    <th style={thStyle}>สถานะ</th>
                                    <th style={thStyle}>จำนวนเงิน (บาท)</th>
                                    <th style={thStyle}>การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{item.req_date}</td>
                                        <td style={tdStyle}>
                                            <strong>{item.employee_name}</strong>
                                            <div style={{ fontSize: '12px', color: '#777' }}>(ลูกจ้างของ: {item.owner_name})</div>
                                        </td>
                                        <td style={tdStyle}>ลูกจ้างกรีด</td>
                                        <td style={{ ...tdStyle, color: '#0056b3', fontWeight: 'bold' }}>
                                            ฿ {Number(item.amount).toLocaleString()}
                                        </td>
                                        <td style={tdStyle}>
                                            <button 
                                                onClick={() => handleUpdateStatus(item.id, 'approved')}
                                                style={{ ...btnStyle, backgroundColor: '#28a745', marginRight: '10px' }}
                                            >
                                                อนุมัติ
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                                style={{ ...btnStyle, backgroundColor: '#dc3545' }}
                                            >
                                                ปฏิเสธ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

const thStyle = { padding: '12px 15px', fontWeight: 'bold' };
const tdStyle = { padding: '12px 15px', verticalAlign: 'middle' };
const btnStyle = { 
    padding: '8px 15px', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    fontWeight: 'bold'
};

export default WithdrawApproval;