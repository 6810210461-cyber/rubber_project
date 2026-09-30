import React, { useState, useEffect } from 'react';

const SalesHistory = () => {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/daily_records')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecords(data);
        } else {
          loadFromLocalStorage();
        }
      })
      .catch(() => loadFromLocalStorage());
  }, []);

  const loadFromLocalStorage = () => {
    const localData = localStorage.getItem('daily_records');
    if (localData) {
      setRecords(JSON.parse(localData));
    }
  };

  const filteredRecords = records.filter(item => {
    const owner = item.owner_name || item.ownerName || '';
    const tapper = item.tapper_name || item.tapperName || '';
    const plot = item.plotname || item.plotName || '';
    const garden = String(item.gardenid || item.gardenID || '');
    
    const itemDate = item.record_date || item.date || '';

    const matchSearch = 
      owner.includes(searchTerm) ||
      tapper.includes(searchTerm) ||
      plot.includes(searchTerm) ||
      garden.includes(searchTerm);

    const matchDate = selectedDate ? itemDate.startsWith(selectedDate) : true;
    return matchSearch && matchDate;
  });

  const totalWeight = filteredRecords.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const totalAmount = filteredRecords.reduce((sum, item) => sum + Number(item.total_amount || item.totalAmount || 0), 0);

  const handleDelete = (id) => {
    if (window.confirm('คุณต้องการลบรายการรับซื้อนี้ใช่หรือไม่?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      localStorage.setItem('daily_records', JSON.stringify(updated));
      fetch(`http://localhost:3000/api/daily_records/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Kanit', 'Prompt', sans-serif" }}>
      <div style={{ backgroundColor: '#386cc7', color: 'white', padding: '16px 24px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>📜 ประวัติการขายน้ำยางสด</h2>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>ตรวจสอบรายการรับซื้อย้อนหลัง</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', margin: '20px 0' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>จำนวนรายการทั้งหมด</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{filteredRecords.length} รายการ</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>น้ำหนักรวม</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{totalWeight.toLocaleString()} กก.</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>ยอดเงินรวมทั้งหมด</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>฿ {totalAmount.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input 
            type="text" 
            placeholder="🔍 ค้นหารหัส, ชื่อเจ้าของ, คนกรีด, แปลง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ width: '200px' }}>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        {selectedDate && (
          <button onClick={() => setSelectedDate('')} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '0 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            ล้างวันที่
          </button>
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>วัน-เวลา</th>
                <th style={{ padding: '12px 16px' }}>รหัส/เจ้าของสวน</th>
                <th style={{ padding: '12px 16px' }}>แปลง/คนกรีด</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>น้ำหนัก (กก.)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>DRC (%)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ราคากลาง</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ยอดรวม (บาท)</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>ส่วนแบ่ง (เจ้าของ : คนกรีด)</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>เครื่องมือ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? filteredRecords.map((item) => {
                const ownerName = item.owner_name || item.ownerName || '-';
                const tapperName = item.tapper_name || item.tapperName || '-';
                const plotName = item.plotname || item.plotName || '-';
                const gardenId = item.gardenid || item.gardenID || '-';
                
                const rDate = item.record_date || item.date || '-';
                const rTime = item.time ? ` ${item.time}` : '';
                
                const tAmount = Number(item.total_amount || item.totalAmount || 0);
                const oAmount = Number(item.owner_amount || item.ownerAmount || 0);
                const tapAmount = Number(item.tapper_amount || item.tapperAmount || 0);

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{rDate}{rTime}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{ownerName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>รหัสสวน: {gardenId}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>{plotName}</div>
                      <div style={{ fontSize: '12px', color: '#16a34a' }}>คนกรีด: {tapperName}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>{item.weight}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.drc}%</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.price}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>
                      {tAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{oAmount.toLocaleString()}</span>
                      {' : '}
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{tapAmount.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleDelete(item.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>ไม่พบข้อมูลประวัติการขาย</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;