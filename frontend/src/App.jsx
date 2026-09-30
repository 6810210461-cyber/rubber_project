import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages - ผู้ดูแลระบบ
import Login from './pages/Login';
import DailyRecord from './pages/DailyRecord';
import AddGardenOwner from './pages/AddGardenOwner';
import CustomerList from './pages/CustomerList';
import AssignPlot from './pages/AssignPlot';
import SalesHistory from './pages/SalesHistory';
import WithdrawApproval from './pages/WithdrawApproval';

// Pages - เจ้าของสวน
import GardenOwnerDashboard from './pages/GardenOwnerDashboard'; 

// Pages - ลูกจ้าง (คนกรีดยาง)
import EmployeeDashboard from './pages/EmployeeDashboard'; 

// 📌 [เพิ่มใหม่] นำเข้าหน้าเปลี่ยนรหัสผ่าน
import ChangePassword from './pages/ChangePassword';

// Layouts
import MainLayout from './components/MainLayout';
import OwnerLayout from './components/OwnerLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้าล็อกอิน */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* 📌 [จุดที่แก้ไข] เรียกใช้งานไฟล์ ChangePassword ที่เราเพิ่งสร้างแทนข้อความเดิม */}
        <Route path="/change-password" element={<ChangePassword />} />

        {/* ---------------- กลุ่มหน้า: ผู้ดูแลระบบ (โรงรับซื้อ) ---------------- */}
        <Route element={<MainLayout />}>
          <Route path="/daily-record" element={<DailyRecord />} />
          <Route path="/assign-plot" element={<AssignPlot />} />
          <Route path="/customer-list" element={<CustomerList />} />
          <Route path="/add-garden-owner" element={<AddGardenOwner />} />
          <Route path="/sales-history" element={<SalesHistory />} />
          <Route path="/withdraw-approval" element={<WithdrawApproval />} />
        </Route>

        {/* ---------------- กลุ่มหน้า: เจ้าของสวน ---------------- */}
        <Route path="/owner-dashboard" element={<GardenOwnerDashboard />} />

        <Route element={<OwnerLayout />}>
          <Route path="/manage-plots" element={<div style={{padding: 20}}><h2>จัดการแปลงยางและลูกจ้าง</h2></div>} />
          <Route path="/income-report" element={<div style={{padding: 20}}><h2>ดูรายได้</h2></div>} />
        </Route>

        {/* ---------------- กลุ่มหน้า: ลูกจ้าง (คนกรีดยาง) ---------------- */}
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />

        {/* กรณีพิมพ์ URL ไม่ถูกต้อง ให้เด้งกลับไปหน้า Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;