import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:3000/owner-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                // 📌 บันทึกข้อมูลและ Token ที่ได้จากเซิร์ฟเวอร์ลง LocalStorage
                if (data.token) localStorage.setItem('token', data.token); // <--- เพิ่มบรรทัดนี้เพื่อเก็บ Token
                
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', username.trim());
                if (data.empID) localStorage.setItem('empID', data.empID);
                if (data.gardenID) localStorage.setItem('gardenID', data.gardenID);

                // เช็คว่าต้องเปลี่ยนรหัสผ่านครั้งแรกไหม
                if (data.mustChangePassword) {
                    navigate('/change-password');
                    return;
                }

                // นำทางตามสิทธิ์
                if (data.role === 'owner') navigate('/daily-record');
                else if (data.role === 'garden_owner') navigate('/garden-owner-dashboard');
                else if (data.role === 'employee') navigate('/employee-dashboard');
                else setError('สิทธิ์ของคุณไม่ถูกต้อง');
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
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>เข้าสู่ระบบ</h2>
                {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="ชื่อผู้ใช้ หรือ เบอร์โทรศัพท์"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="password"
                        placeholder="รหัสผ่าน"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        เข้าสู่ระบบ
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;