import React, { useState, useEffect } from 'react';

const DailyRecord = () => {
  const [todayPrice, setTodayPrice] = useState(70);
  const [newPrice, setNewPrice] = useState(70);
  const [assignments, setAssignments] = useState([]);
  const [records, setRecords] = useState([]);

  // ⭐ 1. State สำหรับเก็บวันที่ (ค่าเริ่มต้นคือวันนี้)
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [weight, setWeight] = useState('');
  const [drc, setDrc] = useState('');

  // ⭐ 2. แก้ไขฟังก์ชันดึงประวัติ ให้ดึงเฉพาะ "วันที่เลือก" เท่านั้น
  const fetchRecords = () => {
    // ส่ง ?date=... ไปหา API เพื่อกรองข้อมูลจาก Backend
    fetch(`http://localhost:3000/api/daily_records?date=${recordDate}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRecords(data);
      })
      .catch(() => {
        const saved = localStorage.getItem('daily_records');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // กรองข้อมูลใน LocalStorage ให้ตรงกับวันที่เลือกเผื่อกรณีออฟไลน์
            const filtered = (Array.isArray(parsed) ? parsed : []).filter(item => 
              (item.record_date && item.record_date.startsWith(recordDate))
            );
            setRecords(filtered);
          } catch {
            setRecords([]);
          }
        }
      });
  };

  // ดึงข้อมูลแปลงยางแค่ครั้งเดียวตอนเปิดหน้าเว็บ
  useEffect(() => {
    fetch('http://localhost:3000/api/assignments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssignments(data);
      })
      .catch(() => {
        const localAssignments = localStorage.getItem('assignments'); 
        if (localAssignments) setAssignments(JSON.parse(localAssignments));
      });
  }, []);

  // ⭐ 3. ให้ดึงยอดสรุปใหม่ "ทุกครั้งที่ผู้ใช้กดเปลี่ยนวันที่ (recordDate)"
  useEffect(() => {
    fetchRecords();
  }, [recordDate]);

  // ตัวเลขจะบวกกันเฉพาะรายการของ "วันที่เลือก" เท่านั้น เพราะเรากรองจาก fetchRecords แล้ว
  const totalExpense = records.reduce((sum, item) => sum + Number(item.total_amount || item.totalAmount || 0), 0);
  const totalWeight = records.reduce((sum, item) => sum + Number(item.weight || 0), 0);

  const handlePlotSelect = (e) => {
    const id = e.target.value;
    setSelectedAssignmentId(id);
    const found = assignments.find(item => String(item.id) === String(id) || String(item.gardenid) === String(id));
    setSelectedPlot(found || null);
  };

  const calcTotalAmount = () => {
    const w = parseFloat(weight) || 0;
    const d = parseFloat(drc) || 0;
    const p = parseFloat(todayPrice) || 0;
    return Math.round(w * (d / 100) * p);
  };

  const totalAmount = calcTotalAmount();
  const ownerSharePct = selectedPlot ? (selectedPlot.owner_share || selectedPlot.ownerShare || 60) : 60;
  const tapperSharePct = selectedPlot ? (selectedPlot.tapper_share || selectedPlot.tapperShare || 40) : 40;

  const ownerAmount = Math.round(totalAmount * (ownerSharePct / 100));
  const tapperAmount = Math.round(totalAmount * (tapperSharePct / 100));

  const handleUpdatePrice = () => {
    setTodayPrice(newPrice);
    alert('อัปเดตราคายางประจำวันเรียบร้อยแล้ว');
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!selectedPlot) {
      alert('กรุณาเลือกแปลงสวนยางก่อนครับ');
      return;
    }

    const targetAssignmentId = selectedPlot.id || selectedPlot.gardenid || selectedAssignmentId;
    
    const payload = {
      assignment_id: parseInt(targetAssignmentId),
      record_date: recordDate, 
      weight: parseFloat(weight),
      drc: parseFloat(drc),
      price: parseFloat(todayPrice),
      total_amount: totalAmount,
      owner_amount: ownerAmount,
      tapper_amount: tapperAmount
    };

    try {
      const response = await fetch('http://localhost:3000/api/daily_records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`บันทึกข้อมูลรับซื้อลงฐานข้อมูล PostgreSQL เรียบร้อยแล้ว!`);
        fetchRecords(); // ดึงข้อมูลใหม่มาแสดงทันที
        setWeight('');
        setDrc('');
      } else {
        const errData = await response.json();
        alert(`เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${errData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ Node.js เปิดอยู่หรือไม่');
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Kanit', 'Prompt', sans-serif" }}>
      
      <div style={{ backgroundColor: '#4e7e38', color: 'white', borderRadius: '10px 10px 0 0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>โรงรับซื้อน้ำยาง : จอยการยาง</h2>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>ระบบบริหารจัดการรับซื้อน้ำยาง</span>
        </div>
        <div style={{ backgroundColor: '#83b369', padding: '8px 18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '15px' }}>
          ราคายางพารากลางวันนี้ {todayPrice} บาท/กก.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', margin: '24px 0' }}>
        <div style={{ backgroundColor: '#8cb873', color: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>รายจ่ายรวมในการรับซื้อ</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>฿ {totalExpense.toLocaleString()}</div>
        </div>

        <div style={{ backgroundColor: '#8cb873', color: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>น้ำหนักน้ำยางสะสมรับซื้อ</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalWeight.toLocaleString()} กก.</div>
        </div>

        <div style={{ backgroundColor: '#f0f7ee', border: '1px solid #d2e5cd', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#2d5722', marginBottom: '10px' }}>กำหนดราคายางประจำวัน</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <input 
              type="number" 
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              style={{ width: '80px', padding: '6px 10px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <span style={{ fontSize: '14px', color: '#444' }}>บาท/กก.</span>
          </div>
          <button onClick={handleUpdatePrice} style={{ width: '100%', backgroundColor: '#d93838', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            อัปเดตราคา
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h3 style={{ textAlign: 'center', margin: '0 0 24px 0', color: '#1e293b', fontSize: '18px', fontWeight: 'bold' }}>
          บันทึกรับซื้อน้ำยางสด
        </h3>

        <form onSubmit={handleSubmitRecord}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>วันที่รับซื้อ</label>
              <input 
                type="date" 
                required 
                value={recordDate} 
                onChange={(e) => setRecordDate(e.target.value)} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>เลือกแปลงสวนยาง</label>
              <select required value={selectedAssignmentId} onChange={handlePlotSelect} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                <option value="">-- เลือกแปลง --</option>
                {assignments.map(item => {
                  const oName = item.owner_name || item.ownerName || item.owner || 'ไม่ระบุชื่อ';
                  const tName = item.tapper_name || item.tapperName || item.tapper || 'ไม่ระบุคนกรีด';
                  const pName = item.plotname || item.plotName || item.plot || 'ไม่ระบุแปลง';
                  const id = item.id || item.gardenid;
                  return (
                    <option key={id} value={id}>
                      รหัส {item.gardenid || id} - {oName} ({pName}) | คนกรีด: {tName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>ราคาน้ำยางพารากลาง</label>
              <input type="text" disabled value={todayPrice} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>น้ำหนักน้ำยางสด (กก.)</label>
              <input type="number" step="any" required placeholder="ระบุน้ำหนัก เช่น 150" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#334155' }}>เปอร์เซ็นต์ DRC (%)</label>
              <input type="number" step="any" required placeholder="เช่น 35" value={drc} onChange={(e) => setDrc(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
            </div>
            
          </div>

          <div style={{ backgroundColor: '#f2faf0', border: '1px solid #d2e8cd', borderRadius: '8px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>มูลค่ารวม (บาท)</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{totalAmount.toLocaleString()} บาท</div>
            </div>
            <div style={{ borderLeft: '1px solid #d2e8cd', borderRight: '1px solid #d2e8cd' }}>
              <div style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>เจ้าของสวน {ownerSharePct}%</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{ownerAmount.toLocaleString()} บาท</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}>ลูกจ้างกรีด {tapperSharePct}%</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{tapperAmount.toLocaleString()} บาท</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button type="submit" style={{ backgroundColor: '#2b6629', color: 'white', border: 'none', padding: '12px 36px', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>
              บันทึกข้อมูลรับซื้อ
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default DailyRecord;