import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages - ผู้ดูแลระบบ (โรงรับซื้อ)
import Login from './pages/Login';
import DailyRecord from './pages/DailyRecord';
import AddGardenOwner from './pages/AddGardenOwner';
import CustomerList from './pages/CustomerList';
import AssignPlot from './pages/AssignPlot';
import SalesHistory from './pages/SalesHistory';
import WithdrawApproval from './pages/WithdrawApproval';
import DrcChart from './pages/DrcChart';

// Pages - เจ้าของสวน
import GardenOwnerDashboard from './pages/GardenOwnerDashboard'; 

// Pages - ลูกจ้าง (คนกรีดยาง)
import EmployeeDashboard from './pages/EmployeeDashboard'; 

// Pages - อื่นๆ
import ChangePassword from './pages/ChangePassword';

// Layouts
import MainLayout from './components/MainLayout';
import OwnerLayout from './components/OwnerLayout'; // นำเข้า OwnerLayout สำหรับเจ้าของสวน

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------------- หน้าทั่วไป ---------------- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* ---------------- กลุ่มหน้า: ผู้ดูแลระบบ (โรงรับซื้อ) ---------------- */}
        <Route element={<MainLayout />}>
          <Route path="/daily-record" element={<DailyRecord />} />
          <Route path="/assign-plot" element={<AssignPlot />} />
          <Route path="/customer-list" element={<CustomerList />} />
          <Route path="/add-garden-owner" element={<AddGardenOwner />} />
          <Route path="/sales-history" element={<SalesHistory />} />
          <Route path="/withdraw-approval" element={<WithdrawApproval />} />
          <Route path="/chart-dashboard" element={<DrcChart />} />
        </Route>

        {/* ---------------- กลุ่มหน้า: เจ้าของสวน ---------------- */}
        {/* หุ้ม Route ด้วย OwnerLayout เพื่อให้แถบเมนูด้านซ้ายแสดงผล */}
        <Route element={<OwnerLayout />}>
        <Route path="/garden-owner-dashboard" element={<GardenOwnerDashboard />} />        </Route>

        {/* ---------------- กลุ่มหน้า: ลูกจ้าง (คนกรีดยาง) ---------------- */}
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />

        {/* ---------------- กรณีพิมพ์ URL ไม่ถูกต้อง ---------------- */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;