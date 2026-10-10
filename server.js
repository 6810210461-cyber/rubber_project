require('dotenv').config(); // เรียกใช้งานระบบอ่านไฟล์รหัสลับ
const express = require('express'); 
const cors = require('cors'); 
const { Pool } = require('pg'); 
const jwt = require('jsonwebtoken'); // ดึงเครื่องมือสร้างและตรวจ Token เข้ามาใช้งาน

const app = express(); 
const PORT = 3000; 

// รหัสลับสำหรับสร้างบัตรผ่านทาง (Token) ถ้าไม่มีไฟล์ .env ให้ใช้ข้อความด้านหลังแทน
const JWT_SECRET = process.env.JWT_SECRET || 'rubber_factory_super_secret_key_2026';

// ส่วนที่ 1: ตั้งค่า Database
// ส่วนนี้ใช้เชื่อมต่อกับฐานข้อมูล PostgreSQL ในเครื่อง เป็นหัวใจหลักที่เก็บข้อมูลทุกอย่าง
const pool = new Pool({ 
    user: 'postgres', 
    host: 'localhost', 
    database: 'rubber_system', 
    password: '1234', 
    port: 5432 
});

// ส่วนที่ 2: ตั้งค่าความปลอดภัยและข้อมูล (Middleware)
// ล็อกเป้าให้อนุญาตเฉพาะหน้าเว็บ React ของเรา (พอร์ต 5173) เท่านั้นที่เข้ามาขอข้อมูลได้ คนอื่นยิงมาจะโดนเตะออก
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
})); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); // สั่งให้เซิร์ฟเวอร์อ่านข้อมูลที่ส่งมาเป็นแบบ JSON ได้

// ส่วนที่ 3: ด่านตรวจตั๋วผ่านทาง (Authentication Middleware)
// ฟังก์ชันนี้ทำหน้าที่เหมือนยามเฝ้าประตู คอยตรวจว่าคนที่เรียกใช้ API มี Token (บัตรผ่าน) มาด้วยไหม
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // ดึงเอาเฉพาะรหัส Token ออกมา

    // ถ้าไม่มี Token แนบมาด้วย ให้เตะกลับไปเลยพร้อมบอกว่าไม่มีสิทธิ์
    if (!token) {
        return res.status(401).json({ success: false, error: 'ปฏิเสธการเข้าถึง: คุณยังไม่ได้เข้าสู่ระบบ' });
    }

    // ถ้ามี Token ก็เอามาตรวจสอบกับรหัสลับของเราว่าของแท้ไหม หรือหมดอายุหรือยัง
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุการใช้งาน โปรดเข้าสู่ระบบใหม่' });
        }
        req.user = user; // ถ้าของแท้ ก็จำข้อมูลคนนั้นไว้ แล้วปล่อยให้ผ่านไปทำงานต่อได้
        next(); 
    });
}

// ส่วนที่ 4: ระบบเข้าสู่ระบบ (Login)
// เมื่อล็อกอินผ่าน จะมีการสร้าง Token แจกกลับไปให้เอาไปใช้ยืนยันตัวตนในครั้งต่อๆ ไป
app.post('/owner-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // เช็กชื่อผู้ใช้กับรหัสผ่านจากตาราง users
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE (username = $1 OR REPLACE(username, '-', '') = REPLACE($1, '-', '')) AND password = $2", 
            [username, password]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = rows[0];
        const mustChange = (user.must_change_password === true || user.must_change_password === 'true' || user.must_change_password === 't');

        // เช็คว่าเป็น เถ้าแก่โรงรับซื้อ หรือไม่ (บัญชี joy)
        if (username === 'joy') {
            const token = jwt.sign({ username: username, role: 'owner' }, JWT_SECRET, { expiresIn: '1d' }); // สร้างตั๋วอายุ 1 วัน
            return res.json({ 
                success: true, 
                role: 'owner', 
                gardenID: username, 
                displayName: 'เจ้าของโรงรับซื้อ', 
                mustChangePassword: mustChange,
                token: token, // ส่งตั๋วกลับไปให้ React
                message: 'ยินดีต้อนรับเจ้าของโรงรับซื้อ' 
            });
        }

        // เช็คว่าเป็น คนกรีดยาง หรือไม่
        const empCheck = await pool.query(
            "SELECT * FROM employees WHERE REPLACE(phone, '-', '') = REPLACE($1, '-', '')", 
            [username]
        );
        if (empCheck.rows.length > 0) {
            const empData = empCheck.rows[0];
            const token = jwt.sign({ username: username, role: 'employee', empID: empData.id }, JWT_SECRET, { expiresIn: '1d' });
            return res.json({ 
                success: true, 
                role: 'employee', 
                empID: empData.id, 
                gardenID: empData.gardenid, 
                displayName: empData.name, 
                mustChangePassword: mustChange,
                token: token, 
                message: 'ยินดีต้อนรับคนกรีดยาง' 
            });
        }

        // เช็คว่าเป็น เจ้าของสวน หรือไม่
        const ownerCheck = await pool.query("SELECT * FROM gardenowner WHERE gardenid = $1", [username]);
        if (ownerCheck.rows.length > 0) {
            const token = jwt.sign({ username: username, role: 'garden_owner' }, JWT_SECRET, { expiresIn: '1d' });
            return res.json({ 
                success: true, 
                role: 'garden_owner',
                gardenID: username,
                displayName: ownerCheck.rows[0].name || username, 
                mustChangePassword: mustChange,
                token: token, 
                message: 'ยินดีต้อนรับเจ้าของสวน' 
            });
        }

        return res.status(403).json({ success: false, message: 'ระบุตัวตนสำเร็จ แต่ไม่พบสิทธิ์การใช้งาน' });

    } catch (err) { 
        return res.status(500).json({ success: false, message: 'ฐานข้อมูลขัดข้อง: ' + err.message }); 
    }
});

// API เปลี่ยนรหัสผ่าน (เพิ่มด่านตรวจ Token เพื่อให้เฉพาะคนที่ล็อกอินแล้วเท่านั้นที่เปลี่ยนได้)
app.post(['/api/change-password', '/change-password'], authenticateToken, async (req, res) => {
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


// ส่วนที่ 5: กลุ่ม API สำหรับจัดการข้อมูลของเจ้าของสวน
// สังเกตว่า API ที่มีการ เพิ่ม แก้ไข ลบ จะถูกแปะคำว่า authenticateToken ไว้ตรงกลาง เพื่อป้องกันคนนอกมายิง API เล่น

// เจ้าของสวนเพิ่มแปลงยาง
app.post('/api/add-plot', authenticateToken, async (req, res) => {
    try {
        await pool.query("INSERT INTO plots (gardenid, plotname, gardenlocation) VALUES ($1, $2, $3)", [req.body.gardenID, req.body.plotName, req.body.gardenLocation]);
        res.json({ success: true, message: 'เพิ่มแปลงยางเรียบร้อย!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ดึงรายการแปลงยาง (อันนี้เปิดให้ดึงดูได้ ไม่ต้องบังคับตรวจ Token ก็ได้เพื่อความลื่นไหลในการโหลดหน้าเว็บ)
app.get('/api/plots/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM plots WHERE gardenid = $1 ORDER BY id ASC", [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// เจ้าของสวนแก้ไขแปลงยาง
app.put('/api/edit-plot/:id', authenticateToken, async (req, res) => {
    try {
        const { plotName, gardenLocation } = req.body;
        await pool.query(
            "UPDATE plots SET plotname = $1, gardenlocation = $2 WHERE id = $3",
            [plotName, gardenLocation, req.params.id]
        );
        res.json({ success: true, message: 'แก้ไขแปลงยางเรียบร้อย!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// เจ้าของสวนลบแปลงยาง
app.delete('/api/delete-plot/:id', authenticateToken, async (req, res) => {
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

// เจ้าของสวนเพิ่มคนกรีดยาง
app.post('/api/add-employee', authenticateToken, async (req, res) => {
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

// ดึงรายการคนกรีดยาง
app.get('/api/employees/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM employees WHERE gardenid = $1 ORDER BY id ASC", [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// เจ้าของสวนแก้ไขข้อมูลคนกรีดยาง
app.put('/api/edit-employee/:id', authenticateToken, async (req, res) => {
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

// เจ้าของสวนลบข้อมูลคนกรีดยาง
app.delete('/api/delete-employee/:id', authenticateToken, async (req, res) => {
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

// ดึงสรุปรายได้ไปทำกราฟแท่ง
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
        res.status(500).json({ error: 'Server Error' });
    }
});

// ผูกแปลงยางและแบ่งเปอร์เซ็นต์
app.post('/api/assign-plot', authenticateToken, async (req, res) => {
    try {
        await pool.query("INSERT INTO plot_assignments (gardenid, plot_id, employee_id, owner_share, tapper_share) VALUES ($1, $2, $3, $4, $5)",
            [req.body.gardenID, req.body.plotID, req.body.employeeID, req.body.ownerShare, req.body.tapperShare]);
        res.json({ success: true, message: 'ผูกแปลงสำเร็จ!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ดึงข้อมูลการผูกแปลง
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

// ลบการผูกแปลง
app.delete('/api/delete-assignment/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM plot_assignments WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'ลบเรียบร้อย!' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});


// ส่วนที่ 6: กลุ่ม API จัดการบันทึกยอดขายน้ำยาง
// ดึงประวัติการขาย
app.get(['/api/daily_records', '/api/sales-history', '/api/daily-log-details'], async (req, res) => {
    try {
        let sql = `
            SELECT 
                dr.id, dr.assignment_id, pa.gardenid, go.name AS owner_name, p.plotname, e.name AS tapper_name,
                dr.weight, dr.drc, dr.price, dr.total_amount, dr.owner_amount, dr.tapper_amount,
                pa.owner_share, pa.tapper_share,
                TO_CHAR(dr.record_date, 'YYYY-MM-DD') AS record_date, TO_CHAR(dr.created_at, 'HH24:MI:SS') AS time
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
    } catch (err) { res.json([]); }
});

// บันทึกซื้อขายน้ำยาง (ต้องมี Token)
app.post(['/api/daily_records', '/api/purchase'], authenticateToken, async (req, res) => {
    try {
        const assignment_id = req.body.assignment_id || req.body.assignmentId;
        const date = req.body.date || req.body.record_date || new Date().toISOString().split('T')[0];
        const weight = parseFloat(req.body.weight) || 0;
        const drc = parseFloat(req.body.drc) || 0;
        const price = parseFloat(req.body.price) || 0;

        if (!assignment_id) return res.status(400).json({ success: false, message: 'กรุณาเลือกแปลงสวนยาง' });

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
    } catch (err) { res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message }); }
});

// ลบประวัติบันทึกการขาย (ต้องมี Token)
app.delete('/api/daily_records/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM daily_records WHERE id = $1 RETURNING *", [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
        res.json({ success: true, message: 'ลบข้อมูลสำเร็จ!' });
    } catch (err) { res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message }); }
});

// การ์ดสรุปยอดหน้าแรก
app.get('/api/daily-summary', async (req, res) => {
    try {
        let sql = `
            SELECT COALESCE(SUM(dr.total_amount), 0) AS total_expense, COALESCE(SUM(dr.weight), 0) AS total_weight, COALESCE(AVG(dr.drc), 0) AS avg_drc 
            FROM daily_records dr LEFT JOIN plot_assignments pa ON dr.assignment_id = pa.id WHERE dr.record_date = $1
        `;
        const params = [req.query.date];
        const gardenIdFilter = req.query.gardenID || req.query.gardenId || req.query.gardenid;
        if (gardenIdFilter) {
            params.push(gardenIdFilter);
            sql += ` AND pa.gardenid = $2`; 
        }
        const { rows } = await pool.query(sql, params);
        res.json({ total_expense: parseFloat(rows[0].total_expense), total_weight: parseFloat(rows[0].total_weight), avg_drc: parseFloat(rows[0].avg_drc) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ส่วนที่ 7: กลุ่ม API จัดการระบบฝั่งแอดมินหรือเจ้าของโรงรับซื้อ
// ดึงเลขไอดีถัดไปสำหรับสร้างเจ้าของสวนใหม่
app.get('/api/next-owner-id', async (req, res) => {
    try {
        const [uRes, oRes] = await Promise.all([ pool.query("SELECT username FROM users"), pool.query("SELECT gardenid FROM gardenowner") ]);
        const validIds = [...uRes.rows.map(r=>r.username), ...oRes.rows.map(r=>r.gardenid)].map(id => String(id).trim()).filter(id => /^\d+$/.test(id) && id.length <= 4).map(id => parseInt(id, 10));
        res.json({ success: true, nextId: String(validIds.length > 0 ? Math.max(...validIds) : 0 + 1).padStart(2, '0') });
    } catch (err) { res.status(500).json({ success: false, nextId: '01' }); }
});

// แอดมินเพิ่มบัญชีเจ้าของสวนคนใหม่เข้าระบบ
app.post('/api/add-garden-owner', authenticateToken, async (req, res) => {
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

// ดึงรายชื่อเจ้าของสวนทั้งหมดมาแสดงให้แอดมินดู
app.get('/api/customers', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT g.gardenid, g.nametitle, g.name, g.phone, u.password FROM gardenowner g LEFT JOIN users u ON g.gardenid = u.username ORDER BY g.gardenid ASC");
        res.json(rows);
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// แอดมินแก้ไขข้อมูลเจ้าของสวน
app.put('/api/update-customer/:gardenid', authenticateToken, async (req, res) => {
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

// แอดมินลบบัญชีเจ้าของสวน
app.delete('/api/delete-customer/:gardenid', authenticateToken, async (req, res) => {
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


// ส่วนที่ 8: กลุ่ม API ระบบเบิกเงินของลูกจ้าง
// ลูกจ้างกดส่งคำขอเบิกเงิน
app.post('/api/withdrawals', authenticateToken, async (req, res) => {
    const { empID, amount } = req.body;
    try {
        await pool.query("INSERT INTO withdrawals (employee_id, amount, status) VALUES ($1, $2, 'pending')", [empID, amount]);
        res.json({ success: true, message: 'บันทึกคำขอเบิกเงินสำเร็จ' });
    } catch (err) { res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message }); }
});

// เจ้าของสวนดึงรายการเบิกเงินที่รอดำเนินการมาดู
app.get('/api/withdrawals/pending', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT w.id, w.amount, TO_CHAR(w.request_date, 'YYYY-MM-DD HH24:MI') as req_date, e.name as employee_name, g.name as owner_name
            FROM withdrawals w JOIN employees e ON w.employee_id = e.id JOIN gardenowner g ON e.gardenid = g.gardenid WHERE w.status = 'pending' ORDER BY w.request_date ASC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// เจ้าของสวนกดอนุมัติหรือปฏิเสธคำขอเบิกเงิน
app.put('/api/withdrawals/:id/status', authenticateToken, async (req, res) => {
    try {
        await pool.query("UPDATE withdrawals SET status = $1 WHERE id = $2", [req.body.status, req.params.id]);
        res.json({ success: true, message: 'อัปเดตสถานะการเบิกเงินสำเร็จ' });
    } catch (err) { res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message }); }
});

// ลูกจ้างดูประวัติการเบิกเงินของตัวเอง
app.get('/api/employee-withdrawals/:empID', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, amount, status, TO_CHAR(request_date, 'YYYY-MM-DD HH24:MI') as req_date FROM withdrawals WHERE employee_id = $1 ORDER BY request_date DESC", [req.params.empID]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==============================================================================
// กลุ่ม API สำหรับดึงข้อมูลทำกราฟสรุป DRC % รายวัน
// ==============================================================================
app.get('/api/drc-summary', authenticateToken, async (req, res) => {
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

// ส่วนสุดท้าย: คำสั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => console.log(`เซิร์ฟเวอร์ทำงานเรียบร้อยที่: http://localhost:${PORT}`));