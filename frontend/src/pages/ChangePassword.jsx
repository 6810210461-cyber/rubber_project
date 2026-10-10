import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const username = localStorage.getItem('username');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
            return;
        }

        if (!username) {
            setError('ไม่พบข้อมูลบัญชีผู้ใช้ กรุณากลับไปหน้าเข้าสู่ระบบใหม่อีกครั้ง');
            return;
        }

        try {
            // 📌 ถึงแม้จะเป็นหน้าบังคับเปลี่ยนรหัสผ่าน แต่ก็ควรดึง Token ส่งไปยืนยันกับเซิร์ฟเวอร์ด้วย
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/change-password', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // แนบ Token ไปให้เซิร์ฟเวอร์
                },
                body: JSON.stringify({ username, newPassword })
            });
            const data = await res.json();

            if (data.success) {
                alert('กำหนดรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาล็อกอินเข้าใช้งานด้วยรหัสใหม่');
                localStorage.clear();
                navigate('/login');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <div style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '350px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>กำหนดรหัสผ่านใหม่</h2>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                    เนื่องจากการเข้าสู่ระบบครั้งแรก กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของคุณ
                </p>

                {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="password"
                        placeholder="รหัสผ่านใหม่"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="password"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '12px', backgroundColor: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        บันทึกรหัสผ่านใหม่
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;