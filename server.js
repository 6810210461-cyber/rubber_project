const express = require('express'); 
const cors = require('cors'); 
const path = require('path'); 
const { Pool } = require('pg'); 

const app = express(); 
const PORT = 3000; 

// 🔌 2. ตั้งค่า Database
const pool = new Pool({ 
    user: 'postgres', 
    host: 'localhost', 
    database: 'rubber_system', 
    password: '01299438', 
    port: 5432 
});

// ⚙️ 3. Middleware
app.use(cors()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(express.static(__dirname)); 

// 🌐 4. Page Routing
const pages = {
    '/': 'login.html', 
    '/owner': 'owner.html', 
    '/daily-record': 'owner.html',
    '/assign-plot': 'assignPlot.html', 
    '/customer-list': 'customer.html',
    '/addGardenOwner': 'addGardenOwner.html', 
    '/garden-owner-dashboard': 'gardenOwnerDashboard.html',
    '/daily-log': 'dailyLog.html',
    '/employee-dashboard': 'EmployeeDashboard.html'
};
Object.keys(pages).forEach(route => app.get(route, (req, res) => res.sendFile(path.join(__dirname, pages[route]))));

// 🔐 5. API Login (แก้ไขระบบตรวจสิทธิ์อย่างเข้มงวด)
app.post('/owner-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. ตรวจสอบรหัสผ่านเบื้องต้นจากตาราง users (รองรับทั้งชื่อและเบอร์โทรแบบไม่มีขีด)
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE (username = $1 OR REPLACE(username, '-', '') = REPLACE($1, '-', '')) AND password = $2", 
            [username, password]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = rows[0];
        const mustChange = (user.must_change_password === true || user.must_change_password === 'true' || user.must_change_password === 't');

        // 2. เช็คว่าเป็น "เจ้าของโรงรับซื้อ" หรือไม่
        if (username === '123456' || username === 'ลูกหมี') {
            return res.json({ 
                success: true, 
                role: 'owner', 
                gardenID: username, 
                displayName: 'ลูกหมี (เจ้าของโรงรับซื้อ)', 
                mustChangePassword: mustChange, 
                message: 'ยินดีต้อนรับเจ้าของโรงรับซื้อ' 
            });
        }

        // 3. เช็คว่าเป็น "คนกรีดยาง / ลูกจ้าง" หรือไม่
        const empCheck = await pool.query(
            "SELECT * FROM employees WHERE REPLACE(phone, '-', '') = REPLACE($1, '-', '')", 
            [username]
        );
        if (empCheck.rows.length > 0) {
            const empData = empCheck.rows[0];
            return res.json({ 
                success: true, 
                role: 'employee', 
                empID: empData.id, 
                gardenID: empData.gardenid, 
                displayName: empData.name, 
                mustChangePassword: mustChange, 
                message: 'ยินดีต้อนรับคนกรีดยาง' 
            });
        }

        // 4. เช็คว่าเป็น "เจ้าของสวน" หรือไม่
        const ownerCheck = await pool.query("SELECT * FROM gardenowner WHERE gardenid = $1", [username]);
        if (ownerCheck.rows.length > 0) {
            return res.json({ 
                success: true, 
                role: 'garden_owner', 
                gardenID: username, 
                displayName: ownerCheck.rows[0].name || username, 
                mustChangePassword: mustChange, 
                message: 'ยินดีต้อนรับเจ้าของสวน' 
            });
        }

        // 5. ถ้าไม่มีสิทธิ์ตรงกับกลุ่มใดเลย ให้ปฏิเสธทันที
        return res.status(403).json({ 
            success: false, 
            message: 'ระบุตัวตนสำเร็จ แต่ไม่พบสิทธิ์การใช้งานในระบบ กรุณาติดต่อแอดมิน' 
        });

    } catch (err) { 
        return res.status(500).json({ success: false, message: 'ฐานข้อมูลขัดข้อง: ' + err.message }); 
    }
});

// API เปลี่ยนรหัสผ่าน (รองรับทั้งแบบมี /api และไม่มี /api รวมถึงตัดขีดเบอร์โทรศัพท์)
app.post(['/api/change-password', '/change-password'], async (req, res) => {
    const { username, newPassword } = req.body; 
    try {
        const result = await pool.query(
            "UPDATE users SET password = $1, must_change_password = FALSE WHERE username = $2 OR REPLACE(username, '-', '') = REPLACE($2, '-', '')",
            [newPassword, username]
        );
        if (result.rowCount > 0) {
            res.json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!' });
        } else {
            res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
    }
});

// 👨‍🌾 6. API ฝั่งเจ้าของสวน (จัดการแปลง, ลูกจ้าง)
app.post('/api/add-plot', async (req, res) => {
    try {
        await pool.query("INSERT INTO plots (gardenid, plotname, gardenlocation) VALUES ($1, $2, $3)", [req.body.gardenID, req.body.plotName, req.body.gardenLocation]);
        res.json({ success: true, message: 'เพิ่มแปลงยางเรียบร้อย!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/plots/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM plots WHERE gardenid = $1 ORDER BY id ASC", [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-plot/:id', async (req, res) => {
    try {
        await pool.query("BEGIN");
        await pool.query("DELETE FROM plot_assignments WHERE plot_id = $1", [req.params.id]);
        await pool.query("DELETE FROM plots WHERE id = $1", [req.params.id]);
        await pool.query("COMMIT");
        res.json({ success: true, message: 'ลบแปลงยางเรียบร้อย!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/add-employee', async (req, res) => {
    try {
        await pool.query("BEGIN");
        await pool.query("INSERT INTO users (username, password, must_change_password) VALUES ($1, $2, TRUE)", [req.body.phone, req.body.password]);
        await pool.query("INSERT INTO employees (gardenid, name, phone) VALUES ($1, $2, $3)", [req.body.gardenID, req.body.name, req.body.phone]);
        await pool.query("COMMIT");
        res.json({ success: true, message: 'เพิ่มคนกรีดยางเรียบร้อย!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.code === '23505' ? 'เบอร์โทรซ้ำ' : err.message });
    }
});

app.get('/api/employees/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM employees WHERE gardenid = $1 ORDER BY id ASC", [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-employee/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT phone FROM employees WHERE id = $1", [req.params.id]);
        if (rows.length) {
            await pool.query("BEGIN");
            await pool.query("DELETE FROM employees WHERE id = $1", [req.params.id]);
            await pool.query("DELETE FROM users WHERE username = $1", [rows[0].phone]);
            await pool.query("COMMIT");
            res.json({ success: true, message: 'ลบเรียบร้อย!' });
        } else res.status(404).json({ success: false, error: 'ไม่พบข้อมูล' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.message });
    }
});

// 📊 6.1 API สำหรับดึงข้อมูลทำกราฟแท่ง (เปรียบเทียบรายได้แต่ละแปลงของเจ้าของสวน)
app.get('/api/owner/plot-summary/:gardenID', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id AS plot_id,
                p.plotname AS plot_name,
                COALESCE(SUM(dr.weight), 0) AS total_weight,
                COALESCE(SUM(dr.owner_amount), 0) AS total_owner_income
            FROM plots p
            LEFT JOIN plot_assignments pa ON p.id = pa.plot_id
            LEFT JOIN daily_records dr ON pa.id = dr.assignment_id
            WHERE p.gardenid = $1
            GROUP BY p.id, p.plotname
            ORDER BY total_owner_income DESC;
        `;
        const { rows } = await pool.query(query, [req.params.gardenID]);
        res.json(rows);
    } catch (err) {
        console.error("Plot Summary Error:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 🔗 7. API ผูกแปลงยาง
app.post('/api/assign-plot', async (req, res) => {
    try {
        await pool.query("INSERT INTO plot_assignments (gardenid, plot_id, employee_id, owner_share, tapper_share) VALUES ($1, $2, $3, $4, $5)",
            [req.body.gardenID, req.body.plotID, req.body.employeeID, req.body.ownerShare, req.body.tapperShare]);
        res.json({ success: true, message: 'ผูกแปลงสำเร็จ!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/assignments', async (req, res) => {
    try {
        let sql = `SELECT pa.id, pa.gardenid, go.name AS owner_name, p.plotname, e.name AS tapper_name, pa.owner_share, pa.tapper_share
        FROM plot_assignments pa 
        LEFT JOIN gardenowner go ON pa.gardenid = go.gardenid 
        LEFT JOIN plots p ON pa.plot_id = p.id 
        LEFT JOIN employees e ON pa.employee_id = e.id
        WHERE 1=1`;

        const params = [];
        const gardenIdFilter = req.query.gardenID || req.query.gardenId || req.query.gardenid;
        
        if (gardenIdFilter) {
            params.push(gardenIdFilter);
            sql += ` AND pa.gardenid = $1`;
        }
        
        sql += ` ORDER BY pa.id DESC`;

        const { rows } = await pool.query(sql, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete-assignment/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM plot_assignments WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'ลบเรียบร้อย!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ⭐ 8. API ดึงประวัติการขายทั้งหมด
app.get(['/api/daily_records', '/api/sales-history', '/api/daily-log-details'], async (req, res) => {
    try {
        let sql = `
            SELECT 
                dr.id,
                dr.assignment_id,
                pa.gardenid, 
                go.name AS owner_name, 
                p.plotname, 
                e.name AS tapper_name,
                dr.weight, 
                dr.drc, 
                dr.price, 
                dr.total_amount, 
                dr.owner_amount, 
                dr.tapper_amount,
                pa.owner_share,
                pa.tapper_share,
                TO_CHAR(dr.record_date, 'YYYY-MM-DD') AS record_date,
                TO_CHAR(dr.created_at, 'HH24:MI:SS') AS time
            FROM daily_records dr
            LEFT JOIN plot_assignments pa ON dr.assignment_id = pa.id
            LEFT JOIN gardenowner go ON pa.gardenid = go.gardenid
            LEFT JOIN employees e ON pa.employee_id = e.id
            LEFT JOIN plots p ON pa.plot_id = p.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (req.query.date) {
            params.push(req.query.date);
            sql += ` AND dr.record_date = $${params.length}`;
        }

        const gardenIdFilter = req.query.gardenID || req.query.gardenId || req.query.gardenid;
        if (gardenIdFilter) {
            params.push(gardenIdFilter);
            sql += ` AND pa.gardenid = $${params.length}`;
        }
        
        sql += ` ORDER BY dr.record_date DESC, dr.id DESC LIMIT 200`;
        
        const { rows } = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Fetch Sales History Error:", err);
        res.json([]); 
    }
});

// ⭐ 8.1 API บันทึกข้อมูลรับซื้อน้ำยาง
app.post(['/api/daily_records', '/api/purchase'], async (req, res) => {
    try {
        const assignment_id = req.body.assignment_id || req.body.assignmentId;
        const date = req.body.date || req.body.record_date || new Date().toISOString().split('T')[0];
        
        const weight = parseFloat(req.body.weight) || 0;
        const drc = parseFloat(req.body.drc) || 0;
        const price = parseFloat(req.body.price) || 0;

        if (!assignment_id) {
            return res.status(400).json({ success: false, message: 'กรุณาเลือกแปลงสวนยาง' });
        }

        const { rows } = await pool.query("SELECT owner_share, tapper_share FROM plot_assignments WHERE id = $1", [assignment_id]);
        const oShare = rows.length ? parseFloat(rows[0].owner_share) || 50 : 50;
        const tShare = rows.length ? parseFloat(rows[0].tapper_share) || 50 : 50;
        
        const tAmt = (weight * (drc / 100)) * price;
        const ownerAmt = tAmt * (oShare / 100);
        const tapperAmt = tAmt * (tShare / 100);

        const { rows: newRec } = await pool.query(`
            INSERT INTO daily_records (assignment_id, record_date, weight, drc, price, total_amount, owner_amount, tapper_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        `, [assignment_id, date, weight, drc, price, tAmt, ownerAmt, tapperAmt]);
        
        res.json({ success: true, message: 'บันทึกสำเร็จ!', recordId: newRec[0].id });
    } catch (err) { 
        console.error("Insert Data Error:", err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message }); 
    }
});

// 🗑️ 8.2 API ลบประวัติการขายน้ำยาง 
app.delete('/api/daily_records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM daily_records WHERE id = $1 RETURNING *", [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
        }
        
        res.json({ success: true, message: 'ลบข้อมูลสำเร็จ!' });
    } catch (err) {
        console.error("Delete Record Error:", err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล: ' + err.message });
    }
});

// 💰 สรุปยอด 
app.get('/api/daily-summary', async (req, res) => {
    try {
        let sql = `
            SELECT 
                COALESCE(SUM(dr.total_amount), 0) AS total_expense, 
                COALESCE(SUM(dr.weight), 0) AS total_weight, 
                COALESCE(AVG(dr.drc), 0) AS avg_drc 
            FROM daily_records dr
            LEFT JOIN plot_assignments pa ON dr.assignment_id = pa.id
            WHERE dr.record_date = $1
        `;
        const params = [req.query.date];

        const gardenIdFilter = req.query.gardenID || req.query.gardenId || req.query.gardenid;
        if (gardenIdFilter) {
            params.push(gardenIdFilter);
            sql += ` AND pa.gardenid = $2`;
        }

        const { rows } = await pool.query(sql, params);
        res.json({ 
            total_expense: parseFloat(rows[0].total_expense), 
            total_weight: parseFloat(rows[0].total_weight), 
            avg_drc: parseFloat(rows[0].avg_drc) 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 👥 9. API จัดการลูกค้า
app.get('/api/next-owner-id', async (req, res) => {
    try {
        const [uRes, oRes] = await Promise.all([
            pool.query("SELECT username FROM users"), 
            pool.query("SELECT gardenid FROM gardenowner")
        ]);
        const allIds = [...uRes.rows.map(r=>r.username), ...oRes.rows.map(r=>r.gardenid)];
        const validIds = allIds.map(id => String(id).trim()).filter(id => /^\d+$/.test(id) && id.length <= 4).map(id => parseInt(id, 10));
        const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
        res.json({ success: true, nextId: String(maxId + 1).padStart(2, '0') });
    } catch (err) { 
        res.status(500).json({ success: false, nextId: '01' }); 
    }
});

app.post('/api/add-garden-owner', async (req, res) => {
    const { username, password, nametitle, name, phone } = req.body;
    try {
        await pool.query("BEGIN");
        await pool.query("INSERT INTO users (username, password, must_change_password) VALUES ($1, $2, TRUE)", [username, password]);
        await pool.query("INSERT INTO gardenowner (gardenid, nametitle, name, phone) VALUES ($1, $2, $3, $4)", [username, nametitle||'', name||'', phone||'']);
        await pool.query("COMMIT");
        res.json({ success: true, message: 'เพิ่มสมาชิกสำเร็จ!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(err.code === '23505' ? 400 : 500).json({ success: false, message: err.code === '23505' ? `รหัส ${username} มีในระบบแล้ว` : err.message });
    }
});

app.get('/api/customers', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT g.gardenid, g.nametitle, g.name, g.phone, u.password FROM gardenowner g LEFT JOIN users u ON g.gardenid = u.username ORDER BY g.gardenid ASC");
        res.json(rows);
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/update-customer/:gardenid', async (req, res) => {
    try {
        await pool.query("BEGIN");
        await pool.query("UPDATE gardenowner SET nametitle = $1, name = $2, phone = $3 WHERE gardenid = $4", [req.body.nametitle||'', req.body.name||'', req.body.phone||'', req.params.gardenid]);
        if (req.body.password) await pool.query("UPDATE users SET password = $1 WHERE username = $2", [req.body.password, req.params.gardenid]);
        await pool.query("COMMIT");
        res.json({ success: true, message: 'อัปเดตข้อมูลลูกค้าสำเร็จ!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/delete-customer/:gardenid', async (req, res) => {
    try {
        await pool.query("BEGIN");
        await pool.query("DELETE FROM gardenowner WHERE gardenid = $1", [req.params.gardenid]);
        await pool.query("DELETE FROM users WHERE username = $1", [req.params.gardenid]);
        await pool.query("COMMIT");
        res.json({ success: true, message: 'ลบข้อมูลลูกค้าเรียบร้อย!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.message });
    }
});

// 👨‍🔧 10. API ฝั่งลูกจ้าง 
app.get('/api/employee-assignments/:empID', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT pa.id AS assignment_id, p.plotname, p.gardenlocation, pa.gardenid
            FROM plot_assignments pa
            JOIN plots p ON pa.plot_id = p.id
            WHERE pa.employee_id = $1
        `, [req.params.empID]);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/api/employee-history/:empID', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                dr.id, dr.weight, dr.drc, dr.price, dr.tapper_amount AS my_income,
                TO_CHAR(dr.record_date, 'YYYY-MM-DD') AS record_date,
                p.plotname
            FROM daily_records dr
            JOIN plot_assignments pa ON dr.assignment_id = pa.id
            JOIN plots p ON pa.plot_id = p.id
            WHERE pa.employee_id = $1
            ORDER BY dr.record_date DESC, dr.id DESC 
            LIMIT 50
        `, [req.params.empID]);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 💸 12. API ระบบเบิกเงิน
// ลูกจ้างส่งคำขอเบิกเงิน
app.post('/api/withdrawals', async (req, res) => {
    const { empID, amount } = req.body;
    try {
        await pool.query(
            "INSERT INTO withdrawals (employee_id, amount, status) VALUES ($1, $2, 'pending')",
            [empID, amount]
        );
        res.json({ success: true, message: 'บันทึกคำขอเบิกเงินสำเร็จ' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
    }
});

// เถ้าแก่ดึงรายการขอเบิกเงินทั้งหมดที่รออนุมัติ
app.get('/api/withdrawals/pending', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT w.id, w.amount, TO_CHAR(w.request_date, 'YYYY-MM-DD HH24:MI') as req_date, 
                   e.name as employee_name, g.name as owner_name
            FROM withdrawals w
            JOIN employees e ON w.employee_id = e.id
            JOIN gardenowner g ON e.gardenid = g.gardenid
            WHERE w.status = 'pending'
            ORDER BY w.request_date ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// เถ้าแก่อัปเดตสถานะ (อนุมัติ / ปฏิเสธ) การเบิกเงิน
app.put('/api/withdrawals/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query(
            "UPDATE withdrawals SET status = $1 WHERE id = $2",
            [status, req.params.id]
        );
        res.json({ success: true, message: 'อัปเดตสถานะการเบิกเงินสำเร็จ' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
    }
});

// ดึงประวัติการขอเบิกเงินของลูกจ้างแต่ละคน
app.get('/api/employee-withdrawals/:empID', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT id, amount, status, TO_CHAR(request_date, 'YYYY-MM-DD HH24:MI') as req_date FROM withdrawals WHERE employee_id = $1 ORDER BY request_date DESC",
            [req.params.empID]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 📊 API สำหรับดึงข้อมูลทำกราฟสรุป DRC % รายวัน
app.get('/api/drc-summary', async (req, res) => {
    try {
        const queryText = `
            SELECT 
                TO_CHAR(dr.record_date, 'YYYY-MM-DD') AS record_date, 
                ROUND(AVG(dr.drc), 2)::float AS avg_drc,
                ROUND(SUM(dr.weight), 2)::float AS total_weight
            FROM daily_records dr
            GROUP BY dr.record_date
            ORDER BY dr.record_date ASC
            LIMIT 30
        `;
        
        const { rows } = await pool.query(queryText);
        res.json(rows);
    } catch (err) {
        console.error("Fetch DRC Summary Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// 🚀 11. Start Server
app.listen(PORT, () => console.log(`🚀 เซิร์ฟเวอร์ทำงานเรียบร้อยที่: http://localhost:${PORT}`));