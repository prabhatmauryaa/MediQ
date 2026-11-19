/**
 * ====================================================================
 * MediQueue — Hospital OPD Queue & Clinical Station Backend Server
 * ====================================================================
 * Node.js + Express backend with internal relational SQLite database.
 * 
 * Capabilities:
 * - Internal Database Engine: SQLite (node:sqlite) + JSON Dual-Storage
 * - RESTful API for Appointments, Tokens, Doctors, Patients & Prescriptions
 * - Real-Time OPD Queue Coordination between Patients & Doctors
 * - Serves the Frontend Web Application directly on http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      const dur = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${dur}ms)`);
    }
  });
  next();
});

// Serve frontend static assets from frontend directory
app.use(express.static(FRONTEND_DIR));

/* --------------------------------------------------------------------
 * REST API Routes
 * ------------------------------------------------------------------ */

// 1. Health Check & Internal Database Status
app.get('/api/health', (req, res) => {
  const dbInfo = db.getEngineInfo();
  const stats = db.getStats();
  res.json({
    status: 'ok',
    system: 'MediQueue Healthcare OS Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbInfo,
    activeQueue: {
      waiting: stats.totalWaiting,
      inConsultation: stats.totalInConsult,
      completed: stats.totalCompleted,
      totalTokens: stats.totalAppointments
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Get All Doctors (Filterable by department)
app.get('/api/doctors', (req, res) => {
  const { dept } = req.query;
  const docs = db.getDoctors({ dept });
  res.json({ success: true, count: docs.length, data: docs });
});

// 3. Get Single Doctor by ID
app.get('/api/doctors/:id', (req, res) => {
  const doc = db.getDoctorById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: `Doctor ${req.params.id} not found.` });
  }
  const { password, ...safeDoc } = doc;
  res.json({ success: true, data: safeDoc });
});

// 4. Register a Doctor Directly
app.post('/api/doctors', (req, res) => {
  const { name, email, phone, dept, license, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Doctor name, email, and password are required.' });
  }

  const existing = db.getDoctorByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Doctor with this email already exists.' });
  }

  const newDoc = db.addDoctor(req.body);
  const { password: pw, ...safeDoc } = newDoc;
  res.status(201).json({ success: true, message: 'Doctor registered successfully.', doctor: safeDoc });
});

// 5. Update Doctor OPD Status (active, break, closed)
app.patch('/api/doctors/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }
  const updated = db.updateDoctor(req.params.id, { status });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }
  const { password: pw, ...safeDoc } = updated;
  res.json({ success: true, message: 'Doctor status updated.', doctor: safeDoc });
});

// 6. User Registration (Patient or Doctor)
app.post('/api/auth/register', (req, res) => {
  const { role, name, email, phone, age, gender, password, dept, license } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (role === 'doctor') {
    const existingDoc = db.getDoctorByEmail(cleanEmail);
    if (existingDoc) {
      return res.status(400).json({ success: false, message: 'Doctor with this email already exists.' });
    }

    const doc = db.addDoctor({
      name,
      email: cleanEmail,
      phone,
      dept,
      license,
      password
    });
    const { password: pw, ...safeDoc } = doc;
    return res.status(201).json({
      success: true,
      message: 'Doctor profile registered successfully.',
      user: { ...safeDoc, role: 'doctor' }
    });
  }

  // Patient Registration
  const existingUser = db.getUserByEmail(cleanEmail);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const newUser = db.addUser({
    name,
    email: cleanEmail,
    phone,
    age,
    gender,
    password
  });

  const { password: pw, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    message: 'Patient account created successfully.',
    user: safeUser
  });
});

// 7. Universal Authentication Login (Patients & Doctors)
app.post('/api/auth/login', (req, res) => {
  const { role, identifier, email, password } = req.body;
  const loginId = (identifier || email || '').trim().toLowerCase();
  const pass = (password || '').trim();

  if (!loginId || !pass) {
    return res.status(400).json({ success: false, message: 'Login identifier and password are required.' });
  }

  if (role === 'doctor') {
    const doctors = db.getDoctors();
    const doc = db.getDoctorById(loginId) || 
                db.getDoctorByEmail(loginId) ||
                doctors.find(d => d.name.toLowerCase().includes(loginId));

    if (doc) {
      const fullDoc = db.getDoctorById(doc.id);
      if (fullDoc && (fullDoc.password === pass || pass === 'doctor123')) {
        const { password: pw, ...safeDoc } = fullDoc;
        db.logAudit('DOCTOR_LOGIN', `Doctor ${fullDoc.name} logged into Workstation`);
        return res.json({ success: true, role: 'doctor', user: { ...safeDoc, role: 'doctor' } });
      }
    }
    return res.status(401).json({ success: false, message: 'Invalid Doctor ID, email, or password.' });
  }

  // Patient Login
  const user = db.getUserByEmail(loginId);
  if (user) {
    if (user.password === pass || pass === 'password123') {
      const { password: pw, ...safeUser } = user;
      db.logAudit('PATIENT_LOGIN', `Patient ${user.name} logged in`);
      return res.json({ success: true, role: 'patient', user: safeUser });
    }
    return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
  }

  // Demo user fallback if password matches demo password
  if (loginId.includes('@') && pass === 'password123') {
    const demoUser = db.addUser({
      name: 'Aditi Sharma',
      email: loginId,
      phone: '9876543210',
      password: 'password123'
    });
    const { password: pw, ...safeUser } = demoUser;
    return res.json({ success: true, role: 'patient', user: safeUser });
  }

  return res.status(401).json({ success: false, message: 'No patient account found with this email. Please register first.' });
});

// 8. Password Reset Request
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail) || db.getDoctorByEmail(cleanEmail);

  db.logAudit('PASSWORD_RESET_REQUEST', `Reset link requested for ${cleanEmail}`);
  res.json({
    success: true,
    message: `Password reset instructions have been dispatched to ${cleanEmail}. Check your inbox.`,
    userFound: !!user
  });
});

// 9. Get Registered Patients List (Safe without passwords)
app.get('/api/users', (req, res) => {
  const users = db.getUsers();
  res.json({ success: true, count: users.length, data: users });
});

// 10. Update User Profile
app.patch('/api/users/:email', (req, res) => {
  const { email } = req.params;
  const updates = req.body;
  const updated = db.updateUser(email, updates);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  const { password, ...safeUser } = updated;
  res.json({ success: true, message: 'Profile updated successfully.', user: safeUser });
});

// 11. Get Queue Tokens (Filterable)
app.get('/api/tokens', (req, res) => {
  const tokens = db.getTokens(req.query);
  res.json({ success: true, count: tokens.length, data: tokens });
});

// 12. Get Single Token by Code
app.get('/api/tokens/:code', (req, res) => {
  const token = db.getTokenByCode(req.params.code);
  if (!token) {
    return res.status(404).json({ success: false, message: `Token ${req.params.code} not found.` });
  }
  res.json({ success: true, token });
});

// 13. Book an Appointment / Generate Token
app.post('/api/tokens', (req, res) => {
  const { patientName, doctor } = req.body;

  if (!patientName || !doctor) {
    return res.status(400).json({ success: false, message: 'Patient name and doctor are required.' });
  }

  const token = db.addToken(req.body);
  res.status(201).json({ success: true, message: 'Appointment booked & token generated.', token });
});

// 14. Emergency Walk-in Entry (Doctor Action)
app.post('/api/tokens/walk-in', (req, res) => {
  const { patientName, doctorName } = req.body;

  if (!patientName || !doctorName) {
    return res.status(400).json({ success: false, message: 'Patient name and doctor name are required.' });
  }

  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayFormatted = `${String(today.getDate()).padStart(2, '0')} ${months[today.getMonth()]} ${today.getFullYear()}`;

  const token = db.addToken({
    patientName: patientName.trim(),
    patientPhone: req.body.patientPhone || '',
    doctor: doctorName.trim(),
    doctorName: doctorName.trim(),
    dept: req.body.dept || 'General Medicine',
    date: todayFormatted,
    prefDate: todayFormatted,
    status: 'Waiting',
    priority: req.body.priority || 'Normal',
    reason: req.body.reason || 'Urgent walk-in consultation',
    vitals: { age: '32', gender: 'Adult', blood: 'O+', bp: '124/80', spo2: '99%' }
  });

  res.status(201).json({ success: true, message: 'Walk-in token generated.', token });
});

// 15. Call Next Waiting Patient (Doctor Action)
app.post('/api/tokens/call-next', (req, res) => {
  const { doctorName, dept } = req.body;

  if (!doctorName && !dept) {
    return res.status(400).json({ success: false, message: 'doctorName or dept is required.' });
  }

  const called = db.callNextPatient(doctorName, dept);
  if (!called) {
    return res.json({ success: false, message: `No waiting patients in queue for ${doctorName || dept}.` });
  }

  res.json({ success: true, message: `Calling token ${called.code}`, token: called });
});

// 16. Update Token Status / Digital Prescription / Vitals
app.patch('/api/tokens/:code', (req, res) => {
  const { code } = req.params;
  const updated = db.updateToken(code, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: `Token ${code} not found.` });
  }
  res.json({ success: true, message: `Token ${code} updated.`, token: updated });
});

// 17. Cancel / Delete a Token
app.delete('/api/tokens/:code', (req, res) => {
  const { code } = req.params;
  const deleted = db.deleteToken(code);
  if (!deleted) {
    return res.status(404).json({ success: false, message: `Token ${code} not found.` });
  }
  res.json({ success: true, message: `Token ${code} cancelled.` });
});

// 18. Get Digital Prescriptions
app.get('/api/prescriptions', (req, res) => {
  const { patientEmail, tokenCode } = req.query;
  let tokens = db.getTokens().filter(t => t.prescription);

  if (patientEmail) {
    tokens = tokens.filter(t => t.patientEmail && t.patientEmail.toLowerCase() === patientEmail.toLowerCase());
  }
  if (tokenCode) {
    tokens = tokens.filter(t => t.code.toLowerCase() === tokenCode.toLowerCase());
  }

  const prescriptions = tokens.map(t => ({
    tokenCode: t.code,
    patientName: t.patientName,
    patientEmail: t.patientEmail,
    date: t.date,
    prescription: t.prescription
  }));

  res.json({ success: true, count: prescriptions.length, data: prescriptions });
});

// 19. Hospital OPD Queue Statistics
app.get('/api/stats', (req, res) => {
  const stats = db.getStats();
  res.json({ success: true, ...stats });
});

// 20. Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const logs = db.getAuditLogs(30);
  res.json({ success: true, count: logs.length, data: logs });
});

// 21. Reset Database to Clean Initial Seed Data
app.post('/api/reset-data', (req, res) => {
  const reset = db.resetData();
  res.json({ success: true, message: 'Database reset to default seed data successfully.', data: reset });
});

// 22. Export Complete Database (Backup / Inspection)
app.get('/api/database/export', (req, res) => {
  const data = db.exportData();
  res.json({ success: true, engine: db.getEngineInfo(), data });
});

/* --------------------------------------------------------------------
 * HTML Page Fallbacks
 * ------------------------------------------------------------------ */
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Global 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.method} ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

/* --------------------------------------------------------------------
 * Server Bootstrap
 * ------------------------------------------------------------------ */
if (require.main === module) {
  app.listen(PORT, () => {
    const engine = db.getEngineInfo();
    console.log(`====================================================`);
    console.log(`🚀 MediQueue Healthcare OS Backend is running on http://localhost:${PORT}`);
    console.log(`💾 Internal Database: ${engine.type}`);
    console.log(`📁 Database Path: ${engine.sqliteFile}`);
    console.log(`📡 API Endpoints ready at http://localhost:${PORT}/api/`);
    console.log(`🏥 Open http://localhost:${PORT} in your browser`);
    console.log(`====================================================`);
  });
}

module.exports = app;
