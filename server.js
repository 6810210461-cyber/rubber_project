const express = require('express'); 
const cors = require('cors'); 
const path = require('path'); 
const { Pool } = require('pg'); 

const app = express(); 
const PORT = 3000; 

// 2. ตั้งค่า Database
// ส่วนนี้ใช้เชื่อมต่อกับฐานข้อมูล PostgreSQL ในเครื่อง (เป็นหัวใจหลักที่เก็บข้อมูลทุกอย่างของเจ้าของสวน แปลงยาง และลูกจ้าง)
const pool = new Pool({ 
    user: 'postgres', 
    host: 'localhost', 
    database: 'rubber_system', 
    password: '1234', 
    port: 5432 
});

// 3. Middleware
// ส่วนนี้ตั้งค่าให้ Server สามารถรับส่งข้อมูลข้ามโดเมนได้ (cors) และอ่านข้อมูลรูปแบบ JSON ได้
app.use(cors()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.use(express.static(__dirname)); 

// 4. Page Routing
// ส่วนนี้จัดการเส้นทางหน้าเว็บ (สำหรับโปรเจกต์ที่เป็น HTML ธรรมดา)
const pages = {
    '/': 'login.html', 
    '/owner': 'owner.html', 
    '/daily-record': 'owner.html',
    '/assign-plot': 'assignPlot.html', 
    '/customer-list': 'customer.html',
    '/addGardenOwner': 'addGardenOwner.html', 
    
    // 🟢 [เกี่ยวกับเจ้าของสวน]: เส้นทางเปิดหน้าเว็บ แดชบอร์ดสำหรับ "เจ้าของสวน" โดยเฉพาะ (gardenOwnerDashboard.html)
    '/garden-owner-dashboard': 'gardenOwnerDashboard.html',
    
    '/daily-log': 'dailyLog.html',
    '/employee-dashboard': 'EmployeeDashboard.html'
};
Object.keys(pages).forEach(route => app.get(route, (req, res) => res.sendFile(path.join(__dirname, pages[route]))));

// 5. API Login (ระบบตรวจสิทธิ์การเข้าใช้งาน)
app.post('/owner-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // ตรวจสอบรหัสผ่านเบื้องต้นจากตาราง users
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE (username = $1 OR REPLACE(username, '-', '') = REPLACE($1, '-', '')) AND password = $2", 
            [username, password]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = rows[0];
        const mustChange = (user.must_change_password === true || user.must_change_password === 'true' || user.must_change_password === 't');

        // เช็คว่าเป็น "เจ้าของโรงรับซื้อ" (ใช้ joy เพียงบัญชีเดียว)
        if (username === 'joy') {
            return res.json({ 
                success: true, 
                role: 'owner', 
                gardenID: username, 
                displayName: 'เจ้าของโรงรับซื้อ', 
                mustChangePassword: mustChange, 
                message: 'ยินดีต้อนรับเจ้าของโรงรับซื้อ' 
            });
        }

        // เช็คว่าเป็น "คนกรีดยาง / ลูกจ้าง" หรือไม่
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

        // เช็คว่าผู้ที่กำลังเข้าสู่ระบบคือ "เจ้าของสวน" หรือไม่
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

        return res.status(403).json({ 
            success: false, 
            message: 'ระบุตัวตนสำเร็จ แต่ไม่พบสิทธิ์การใช้งานในระบบ กรุณาติดต่อแอดมิน' 
        });

    } catch (err) { 
        return res.status(500).json({ success: false, message: 'ฐานข้อมูลขัดข้อง: ' + err.message }); 
    }
});

// API เปลี่ยนรหัสผ่าน 
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

// 6. 🟢 [เกี่ยวกับเจ้าของสวน]: กลุ่ม API จัดการแปลงยางและลูกจ้างในสังกัดของ "เจ้าของสวน"
// =========================================================================================

// 🟢 [เจ้าของสวน เพิ่มแปลงยาง]: เจ้าของสวนเพิ่มแปลงยางใหม่ของตัวเองเข้าฐานข้อมูล
app.post('/api/add-plot', async (req, res) => {
    try {
        await pool.query("INSERT INTO plots (gardenid, plotname, gardenlocation) VALUES ($1, $2, $3)", [req.body.gardenID, req.body.plotName, req.body.gardenLocation]);
        res.json({ success: true, message: 'เพิ่มแปลงยางเรียบร้อย!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 🟢 [เจ้าของสวน ดูรายการแปลงยาง]: ดึงแปลงยางทั้งหมดที่ "เจ้าของสวนคนนี้" เป็นเจ้าของ ตาม gardenid
app.get('/api/plots/:id', async (req, res) => {
    try {                                       //คำสั่งดึงข้อมูลสวนยางที่ถูกเพิ่มขึ้นมาโชว์ 
        const { rows } = await pool.query("SELECT * FROM plots WHERE gardenid = $1 ORDER BY id ASC", [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🟢 [เจ้าของสวน แก้ไขแปลงยาง]: เปลี่ยนชื่อหรือสถานที่ตั้งของแปลงยางของเจ้าของสวน
app.put('/api/edit-plot/:id', async (req, res) => {
    try {
        const { plotName, gardenLocation } = req.body;
        await pool.query(
            "UPDATE plots SET plotname = $1, gardenlocation = $2 WHERE id = $3",
            [plotName, gardenLocation, req.params.id]
        );
        res.json({ success: true, message: 'แก้ไขแปลงยางเรียบร้อย!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🟢 [เจ้าของสวน ลบแปลงยาง]: ลบแปลงยางออกจากระบบ (รวมถึงลบข้อมูลการผูกแปลงของลูกจ้างในแปลงนั้นด้วย)
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

// 🟢 [เจ้าของสวน เพิ่มคนกรีดยาง]: เจ้าของสวนสร้างบัญชีผู้ใช้และเพิ่มลูกจ้างใหม่เข้ามาทำงานในสวนของตน
app.post('/api/add-employee', async (req, res) => {
    try {
        await pool.query("BEGIN");
        // สร้าง รหัสผ่าน/บัญชี สำหรับลูกจ้างเข้าใช้งานแอพ
        await pool.query("INSERT INTO users (username, password, must_change_password) VALUES ($1, $2, TRUE)", [req.body.phone, req.body.password]);
        // ผูกลูกจ้างคนนี้ไว้กับ gardenid ของเจ้าของสวน
        await pool.query("INSERT INTO employees (gardenid, name, phone) VALUES ($1, $2, $3)", [req.body.gardenID, req.body.name, req.body.phone]);
        await pool.query("COMMIT");
        res.json({ success: true, message: 'เพิ่มคนกรีดยางเรียบร้อย!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.code === '23505' ? 'เบอร์โทรซ้ำ' : err.message });
    }
});

// 🟢 [เจ้าของสวน ดูรายการลูกจ้าง]: ดึงรายชื่อคนกรีดยางทั้งหมดที่เป็นลูกจ้างของเจ้าของสวนคนนี้
app.get('/api/employees/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM employees WHERE gardenid = $1 ORDER BY id ASC", [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🟢 [เจ้าของสวน แก้ไขลูกจ้าง]: เปลี่ยนชื่อ เบอร์โทร หรือรหัสผ่าน ของคนกรีดยางในสวน
app.put('/api/edit-employee/:id', async (req, res) => {
    const { name, phone, password } = req.body;
    try {
        await pool.query("BEGIN");
        
        const oldEmp = await pool.query("SELECT phone FROM employees WHERE id = $1", [req.params.id]);
        if (oldEmp.rows.length === 0) {
            await pool.query("ROLLBACK");
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลคนกรีดยาง' });
        }
        const oldPhone = oldEmp.rows[0].phone;

        await pool.query(
            "UPDATE employees SET name = $1, phone = $2 WHERE id = $3",
            [name, phone, req.params.id]
        );

        if (password && password.trim() !== '') {
            await pool.query(
                "UPDATE users SET username = $1, password = $2 WHERE username = $3 OR REPLACE(username, '-', '') = REPLACE($3, '-', '')",
                [phone, password, oldPhone]
            );
        } else {
            await pool.query(
                "UPDATE users SET username = $1 WHERE username = $2 OR REPLACE(username, '-', '') = REPLACE($2, '-', '')",
                [phone, oldPhone]
            );
        }

        await pool.query("COMMIT");
        res.json({ success: true, message: 'แก้ไขข้อมูลคนกรีดยางเรียบร้อย!' });
    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ success: false, error: err.code === '23505' ? 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' : err.message });
    }
});

// 🟢 [เจ้าของสวน ลบลูกจ้าง]: ลบรายชื่อคนกรีดยางออกจากสวนของตัวเอง
app.delete('/api/delete-employee/:id', async (req, res) => {//รับคำสั่งลบ
    try {           
        const { rows } = await pool.query("SELECT phone FROM employees WHERE id = $1", [req.params.id]);
        if (rows.length) {
            await pool.query("BEGIN");//สั่งเปิด Transaction เพื่อบอกฐานข้อมูลว่า "คำสั่งลบหลังจากนี้ต้องทำสำเร็จ
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

// 🟢 [เจ้าของสวน ดูสรุปรายได้กราฟแท่ง]: คำนวณสรุปผลรวมน้ำหนักน้ำยางและ "รายได้รวมของเจ้าของสวน" ในแต่ละแปลง
// ข้อมูลนี้ถูกส่งไปทำกราฟแท่งในหน้า Dashboard ของเจ้าของสวน เพื่อเปรียบเทียบว่าแปลงไหนทำเงินได้เยอะที่สุด
app.get('/api/owner/plot-summary/:gardenID', async (req, res) => {
    try {//app.get: สร้างช่องทางรับข้อมูลแบบ GET (ดึงข้อมูล)
        const query = `
            SELECT 
                p.id AS plot_id,
                p.plotname AS plot_name,
                COALESCE(SUM(dr.weight), 0) AS total_weight,
                COALESCE(SUM(dr.owner_amount), 0) AS total_owner_income -- รวมรายได้เฉพาะส่วนของ "เจ้าของสวน"
            FROM plots p
            LEFT JOIN plot_assignments pa ON p.id = pa.plot_id
            LEFT JOIN daily_records dr ON pa.id = dr.assignment_id
            WHERE p.gardenid = $1 -- กรองเอาเฉพาะเจ้าของสวนคนนี้
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

// 7. 🟢 [เกี่ยวกับเจ้าของสวน]: API ผูกแปลงยางและกำหนดส่วนแบ่งรายได้ระหว่าง "เจ้าของสวน" กับ "คนกรีดยาง"
// =========================================================================================

// 🟢 [เจ้าของสวน กำหนดส่วนแบ่งเงิน]: กำหนดว่าลูกจ้างคนไหนกรีดแปลงไหน และแบ่งเงินกันกี่ % (owner_share = % ของเจ้าของสวน)
app.post('/api/assign-plot', async (req, res) => {
    try {
        await pool.query("INSERT INTO plot_assignments (gardenid, plot_id, employee_id, owner_share, tapper_share) VALUES ($1, $2, $3, $4, $5)",
            [req.body.gardenID, req.body.plotID, req.body.employeeID, req.body.ownerShare, req.body.tapperShare]);
        res.json({ success: true, message: 'ผูกแปลงสำเร็จ!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 🟢 [เจ้าของสวน ดูการผูกแปลง]: ดึงข้อมูลว่าแปลงไหน ใครกรีด และเจ้าของสวนได้ส่วนแบ่งกี่ %
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
            sql += ` AND pa.gardenid = $1`; // ดึงเฉพาะของเจ้าของสวนคนนั้น
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

// 8. 🟢 [เกี่ยวกับเจ้าของสวน]: API บันทึกและดึงประวัติการขายน้ำยาง (คิดคำนวณเงินให้เจ้าของสวน)
// =========================================================================================

// 🟢 [เจ้าของสวน ดูประวัติการขายน้ำยาง]: ดึงประวัติการขาย ยอดเงินรวม เงินที่เจ้าของสวนได้รับ (owner_amount) และเปอร์เซ็นต์ส่วนแบ่ง (owner_share)
app.get(['/api/daily_records', '/api/sales-history', '/api/daily-log-details'], async (req, res) => {
    try {
        let sql = `
            SELECT 
                dr.id,
                dr.assignment_id,
                pa.gardenid, 
                go.name AS owner_name, -- ชื่อเจ้าของสวน
                p.plotname, 
                e.name AS tapper_name,
                dr.weight, 
                dr.drc, 
                dr.price, 
                dr.total_amount, 
                dr.owner_amount, -- จำนวนเงินส่วนของเจ้าของสวน
                dr.tapper_amount,
                pa.owner_share,  -- % ส่วนแบ่งเจ้าของสวน
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
            sql += ` AND pa.gardenid = $${params.length}`; // ดึงเฉพาะประวัติของเจ้าของสวนคนนี้
        }
        
        sql += ` ORDER BY dr.record_date DESC, dr.id DESC LIMIT 200`;
        
        const { rows } = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Fetch Sales History Error:", err);
        res.json([]); 
    }
});

// บันทึกข้อมูลรับซื้อน้ำยาง
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

        // ดึง % ส่วนแบ่งของเจ้าของสวน (owner_share) มาใช้คำนวณ
        const { rows } = await pool.query("SELECT owner_share, tapper_share FROM plot_assignments WHERE id = $1", [assignment_id]);
        const oShare = rows.length ? parseFloat(rows[0].owner_share) || 50 : 50;
        const tShare = rows.length ? parseFloat(rows[0].tapper_share) || 50 : 50;
        
        // สูตรคำนวณเงินรวม = น้ำหนัก x (%ยางแห้ง/100) x ราคาน้ำยาง
        const tAmt = (weight * (drc / 100)) * price;
        // 🟢 เงินที่เจ้าของสวนจะได้รับ = เงินรวม x (%ของเจ้าของสวน / 100)
        const ownerAmt = tAmt * (oShare / 100);
        const tapperAmt = tAmt * (tShare / 100);

        // บันทึกยอดเงินของเจ้าของสวนลงในตาราง daily_records
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

// 🟢 [เจ้าของสวน ดูการ์ดสรุปยอดประจำวัน]: ดึงผลรวมเงิน น้ำหนักรวม และ %DRC เฉลี่ย ไปแสดงบนการ์ดในแดชบอร์ดเจ้าของสวน
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
            sql += ` AND pa.gardenid = $2`; // กรองเฉพาะสวนของเจ้าของคนนี้
        }

        const { rows } = await pool.query(sql, params);
        res.json({ 
            total_expense: parseFloat(rows[0].total_expense), 
            total_weight: parseFloat(rows[0].total_weight), 
            avg_drc: parseFloat(rows[0].avg_drc) 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. 🟢 [เกี่ยวกับเจ้าของสวน]: API ระบบจัดการข้อมูล "เจ้าของสวน" (สร้างขึ้นโดยฝั่งแอดมิน/เถ้าแก่ใหญ่)
// =========================================================================================

// 🟢 [สร้าง รหัสเจ้าของสวน]: หาเลข ID ถัดไปให้เจ้าของสวนคนใหม่ (เช่น 01, 02, 03)
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

// เจ้าของสวนใหม่: เพิ่มข้อมูลโปรไฟล์และรหัสผ่านเข้าสู่ตาราง gardenowner และ users
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

// 🟢 [ดึงรายชื่อ เจ้าของสวนทั้งหมด]: ดึงข้อมูลเจ้าของสวนทุกคนไปแสดงในตารางรายชื่อลูกค้า
app.get('/api/customers', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT g.gardenid, g.nametitle, g.name, g.phone, u.password FROM gardenowner g LEFT JOIN users u ON g.gardenid = u.username ORDER BY g.gardenid ASC");
        res.json(rows);
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// 🟢 [แก้ไขข้อมูล เจ้าของสวน]: แก้ไขชื่อ เบอร์โทร หรือรหัสผ่านของเจ้าของสวน
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

// 🟢 [ลบ เจ้าของสวน]: ลบบัญชีเจ้าของสวนออกจากระบบ
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

// 10. API ฝั่งลูกจ้าง (ดึงข้อมูลให้หน้าจอฝั่งลูกจ้าง)
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

// 12. API ระบบเบิกเงิน
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

// 13. API สำหรับดึงข้อมูลทำกราฟสรุป DRC % รายวัน
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

// 14. Start Server
app.listen(PORT, () => console.log(`เซิร์ฟเวอร์ทำงานเรียบร้อยที่: http://localhost:${PORT}`));