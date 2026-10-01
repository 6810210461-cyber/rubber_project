import React, { useEffect, useState } from 'react';

const DrcChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 1. ดึงข้อมูลครั้งแรกเมื่อเปิดหน้า
    fetchDrcData();

    // 2. 🔄 ตั้งเวลาให้อัปเดตข้อมูลใหม่อัตโนมัติทุกๆ 5 วินาที (Auto-Polling)
    const interval = setInterval(() => {
      fetchDrcData(true); // true = แอบอัปเดตเบื้องหลัง ไม่ขึ้นหน้าจอหมุนรอ
    }, 5000);

    // ล้าง Timer เมื่อปิดหน้านี้
    return () => clearInterval(interval);
  }, []);

  const fetchDrcData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setIsRefreshing(true);

    try {
      // ใส่ Timestamp ต่อท้าย URL เพื่อป้องกัน Browser จำค่าเก่า (No-Cache)
      const res = await fetch(`http://localhost:3000/api/drc-summary?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error('ดึงข้อมูลไม่ได้');
      
      const result = await res.json();
      setData(result);
      setError('');
      
      // บันทึกเวลาที่อัปเดตล่าสุด
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('th-TH'));
    } catch (err) {
      console.error(err);
      if (!isBackground) setError('ไม่สามารถเชื่อมต่อ Backend ได้');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#475569', fontSize: '16px' }}>
        🔄 กำลังประมวลผลข้อมูล DRC...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '16px 24px', borderRadius: '12px', display: 'inline-block' }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const drcValues = data.map(d => Number(d.avg_drc) || 0);
  const avgTotal = drcValues.length ? (drcValues.reduce((a, b) => a + b, 0) / drcValues.length).toFixed(1) : 0;
  const maxDrc = drcValues.length ? Math.max(...drcValues).toFixed(1) : 0;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Kanit', sans-serif" }}>
      
      {/* 📌 Header + ปุ่ม Refresh สด */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>
            📊 คุณภาพน้ำยาง (DRC %)
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
           เปอร์เซ็นต์ DRC ในแต่ละวันที่รับซื้อ
          </p>
        </div>

        {/* ปุ่มกดอัปเดตและแสดงสถานะ Real-time */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            onClick={() => fetchDrcData(false)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              fontWeight: '500'
            }}
          >
            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}>
              🔄
            </span>
            {isRefreshing ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูล'}
          </button>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              อัปเดตล่าสุด: {lastUpdated} (อัตโนมัติทุก 5 วิ)
            </span>
          )}
        </div>
      </div>

      {/* 📌 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={cardStyle}>
          <span style={cardLabelStyle}>DRC เฉลี่ยรวม</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>
            {avgTotal}%
          </div>
          <span style={cardSubtextStyle}>จากข้อมูลรับซื้อทั้งหมด</span>
        </div>

        <div style={cardStyle}>
          <span style={cardLabelStyle}>DRC สูงสุด</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>
            {maxDrc}%
          </div>
          <span style={cardSubtextStyle}>ค่าคุณภาพสูงสุด</span>
        </div>

        <div style={cardStyle}>
          <span style={cardLabelStyle}>จำนวนวันที่บันทึก</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
            {data.length} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#64748b' }}>วัน</span>
          </div>
          <span style={cardSubtextStyle}>รายการรับซื้อ</span>
        </div>
      </div>

      {/* 📌 Chart Container */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #f1f5f9' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#334155' }}>แนวโน้ม DRC (%) รายวัน</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)', display: 'inline-block' }}></span>
            เปอร์เซ็นต์ DRC
          </div>
        </div>

        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่มีข้อมูลการรับซื้อน้ำยาง</div>
        ) : (
          <div style={{ position: 'relative', height: '280px', marginTop: '10px' }}>
            
            {/* Grid lines */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {[100, 75, 50, 25, 0].map((val) => (
                <div key={val} style={{ borderBottom: '1px stroke #f1f5f9', borderStyle: val === 0 ? 'solid' : 'dashed', borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', height: '0px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', position: 'absolute', left: '-30px' }}>{val}%</span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', paddingLeft: '20px', position: 'relative', zIndex: 1 }}>
              {data.map((item, index) => {
                const val = Number(item.avg_drc) || 0;
                const heightPercent = Math.min(val, 100);
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      maxWidth: '60px',
                      height: '100%',
                      justifyContent: 'flex-end',
                      cursor: 'pointer',
                      padding: '0 4px'
                    }}
                  >
                    <div style={{
                      opacity: isHovered ? 1 : 0.85,
                      transform: isHovered ? 'translateY(-4px) scale(1.1)' : 'translateY(0)',
                      transition: 'all 0.2s ease',
                      backgroundColor: isHovered ? '#1e293b' : '#3b82f6',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                    }}>
                      {val}%
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(heightPercent, 3)}%`,
                        background: isHovered 
                          ? 'linear-gradient(180deg, #2563eb 0%, #1e40af 100%)' 
                          : 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '8px 8px 2px 2px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isHovered ? '0 10px 15px -3px rgba(37, 99, 235, 0.4)' : '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                        transform: isHovered ? 'scaleX(1.08)' : 'scaleX(1)'
                      }}
                    />

                    <div style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      fontWeight: isHovered ? '600' : 'normal',
                      color: isHovered ? '#0f172a' : '#64748b',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s'
                    }}>
                      {formatDate(item.record_date)}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '14px',
  border: '1px solid #f1f5f9',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
};

const cardLabelStyle = {
  fontSize: '13px',
  color: '#64748b',
  fontWeight: '500'
};

const cardSubtextStyle = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '4px',
  display: 'block'
};

export default DrcChart;