import React, { useState, useEffect } from 'react';

function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // State สำหรับป๊อบอัพแก้ไข
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        gardenid: '',
        nametitle: '',
        name: '',
        phone: '',
        password: ''
    });

    // ดึงข้อมูลลูกค้าอัตโนมัติทันทีที่เปิดหน้า
    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/customers');
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error('Error:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // เปิดหน้าต่างแก้ไข
    const handleOpenEdit = (customer) => {
        setEditForm({
            gardenid: customer.gardenid,
            nametitle: customer.nametitle || '',
            name: customer.name || '',
            phone: customer.phone || '',
            password: customer.password || ''
        });
        setIsEditOpen(true);
    };

    // บันทึกการแก้ไขลงฐานข้อมูล
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3000/api/update-customer/${editForm.gardenid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                alert('บันทึกการแก้ไขเรียบร้อย!');
                setIsEditOpen(false);
                fetchCustomers();
            } else {
                alert('แก้ไขไม่สำเร็จ: ' + data.error);
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    // ลบข้อมูลลูกค้า
    const handleDelete = async (gardenid, name) => {
        if (window.confirm(`คุณต้องการลบข้อมูลของคุณ ${name || ''} (รหัส ${gardenid}) ใช่หรือไม่?`)) {
            try {
                const res = await fetch(`http://localhost:3000/api/delete-customer/${gardenid}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (data.success) {
                    alert('ลบข้อมูลเรียบร้อย!');
                    fetchCustomers();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + data.error);
                }
            } catch (err) {
                alert('ไม่สามารถลบข้อมูลได้');
            }
        }
    };

    // ระบบค้นหาแบบเรียลไทม์ (ค้นหาจาก รหัส, คำนำหน้า, ชื่อ, เบอร์โทร)
    const filteredCustomers = customers.filter(c =>
        (c.gardenid && c.gardenid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div style={{ padding: '24px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                maxWidth: '1000px',
                margin: '0 auto'
            }}>
                <h2 style={{ color: '#1b4332', textAlign: 'center', marginBottom: '20px', fontSize: '22px' }}>
                     รายชื่อลูกค้า (สมาชิกเจ้าของสวน)
                </h2>

                {/* ช่องค้นหา */}
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="🔍 ค้นหาด้วย รหัสประจำตัว, ชื่อ-นามสกุล หรือเบอร์โทร..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            maxWidth: '420px',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #ccc',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <span style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>
                        ลูกค้าทั้งหมด: <span style={{ color: '#2d6a4f', fontSize: '16px' }}>{filteredCustomers.length}</span> ราย
                    </span>
                </div>

                {/* ตารางข้อมูล */}
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>กำลังโหลดข้อมูล...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1b4332', color: '#ffffff', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>รหัสประจำตัว</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>คำนำหน้า</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ชื่อ - นามสกุล</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>เบอร์โทรศัพท์</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((item, index) => (
                                        <tr key={item.gardenid} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#2d6a4f' }}>
                                                {item.gardenid}
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{item.nametitle || '-'}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: '500' }}>{item.name || '-'}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{item.phone || '-'}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    style={{
                                                        backgroundColor: '#e9c46a',
                                                        color: '#1d3557',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        marginRight: '6px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                     แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.gardenid, item.name)}
                                                    style={{
                                                        backgroundColor: '#e63946',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    🗑️ ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                                            ไม่พบข้อมูลลูกค้าในระบบ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal ป๊อบอัพแก้ไขข้อมูล */}
            {isEditOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#fff', padding: '24px', borderRadius: '8px',
                        width: '100%', maxWidth: '450px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#1b4332', marginBottom: '16px' }}>
                             แก้ไขข้อมูลลูกค้า (รหัส: {editForm.gardenid})
                        </h3>
                        <form onSubmit={handleSaveEdit}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>คำนำหน้า</label>
                                <select
                                    value={editForm.nametitle}
                                    onChange={(e) => setEditForm({ ...editForm, nametitle: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">-- เลือกคำนำหน้า --</option>
                                    <option value="นาย">นาย</option>
                                    <option value="นาง">นาง</option>
                                    <option value="นางสาว">นางสาว</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>ชื่อ - นามสกุล</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>เบอร์โทรศัพท์</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>รหัสผ่านใช้งานระบบ</label>
                                <input
                                    type="text"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#eee', cursor: 'pointer' }}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#1b4332', color: '#fff', cursor: 'pointer' }}
                                >
                                    บันทึกแก้ไข
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerList;