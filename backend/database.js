/**
 * ====================================================================
 * MediQueue — Internal Database Engine (SQLite + JSON Dual Storage)
 * ====================================================================
 * Self-contained internal database with relational schema and persistent storage.
 * Stores data in:
 *   1. backend/data/mediqueue.sqlite (SQLite relational database)
 *   2. backend/data/db.json (human-readable JSON data mirror)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_SQLITE_FILE = path.join(DATA_DIR, 'mediqueue.sqlite');
const DB_JSON_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let sqliteDb = null;
try {
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(DB_SQLITE_FILE);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
} catch (err) {
  console.warn('⚠️ node:sqlite not available, falling back to pure JSON internal database.', err.message);
}

// Initial Seed Data
function getInitialSeedData() {
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayFormatted = `${String(today.getDate()).padStart(2, '0')} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return {
    doctors: [
      { id: 'DR-004', name: 'Dr. Rohan Verma',   email: 'rohan.verma@mediqueue.in',   phone: '9811001100', dept: 'General Medicine', spec: 'Internal Medicine & Critical Care', exp: 8,  license: 'MCI-101556', hours: '08:00 – 14:00', room: '101', rating: 4.8, initials: 'RV', color: 'c4', password: 'doctor123', status: 'active' },
      { id: 'DR-001', name: 'Dr. Anjali Rao',    email: 'anjali.rao@mediqueue.in',    phone: '9811001101', dept: 'Cardiology',       spec: 'Interventional Cardiology',         exp: 14, license: 'MCI-204831', hours: '10:00 – 16:00', room: '204', rating: 4.9, initials: 'AR', color: 'c1', password: 'doctor123', status: 'active' },
      { id: 'DR-002', name: 'Dr. Sameer Khanna', email: 'sameer.khanna@mediqueue.in', phone: '9811001102', dept: 'Orthopaedics',     spec: 'Joint Replacement & Sports Med',    exp: 11, license: 'MCI-119024', hours: '09:00 – 13:00', room: '118', rating: 4.8, initials: 'SK', color: 'c2', password: 'doctor123', status: 'active' },
      { id: 'DR-003', name: 'Dr. Meera Iyer',    email: 'meera.iyer@mediqueue.in',    phone: '9811001103', dept: 'Pediatrics',       spec: 'Neonatology & Growth Pediatrics',   exp: 9,  license: 'MCI-302770', hours: '11:00 – 17:00', room: '302', rating: 5.0, initials: 'MI', color: 'c3', password: 'doctor123', status: 'active' },
      { id: 'DR-005', name: 'Dr. Nisha Pillai',  email: 'nisha.pillai@mediqueue.in',  phone: '9811001104', dept: 'Dermatology',      spec: 'Clinical & Aesthetic Dermatology',  exp: 8,  license: 'MCI-210341', hours: '12:00 – 18:00', room: '210', rating: 4.9, initials: 'NP', color: 'c5', password: 'doctor123', status: 'active' },
      { id: 'DR-006', name: 'Dr. Arjun Kapoor',  email: 'arjun.kapoor@mediqueue.in',  phone: '9811001105', dept: 'Neurology',        spec: 'Epilepsy & Neuro-Therapeutics',     exp: 12, license: 'MCI-305129', hours: '14:00 – 19:00', room: '305', rating: 4.8, initials: 'AK', color: 'c6', password: 'doctor123', status: 'active' }
    ],
    users: [
      {
        id: 1,
        role: 'patient',
        name: 'Aditi Sharma',
        email: 'aditi@example.com',
        phone: '9876543210',
        age: '28',
        gender: 'Female',
        password: 'password123',
        joined: new Date().toISOString()
      },
      {
        id: 2,
        role: 'patient',
        name: 'Aditi Sharma',
        email: 'you@example.com',
        phone: '9876543210',
        age: '28',
        gender: 'Female',
        password: 'password123',
        joined: new Date().toISOString()
      }
    ],
    tokens: [
      {
        code: 'G-231',
        patientName: 'Aditi Sharma',
        patientEmail: 'aditi@example.com',
        patientPhone: '9876543210',
        doctor: 'Dr. Rohan Verma',
        doctorName: 'Dr. Rohan Verma',
        dept: 'General Medicine',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'In Consultation',
        reason: 'High fever, sore throat and dry cough for 3 days',
        priority: 'Normal',
        vitals: { age: '28', gender: 'F', blood: 'O+', bp: '120/80', spo2: '99%' },
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        code: 'G-232',
        patientName: 'Vikram Sengupta',
        patientEmail: 'vikram.s@example.com',
        patientPhone: '9811223344',
        doctor: 'Dr. Rohan Verma',
        doctorName: 'Dr. Rohan Verma',
        dept: 'General Medicine',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'Waiting',
        reason: 'Severe migraine, nausea & photophobia',
        priority: 'Urgent',
        vitals: { age: '34', gender: 'M', blood: 'B+', bp: '135/88', spo2: '98%' },
        createdAt: new Date(Date.now() - 2400000).toISOString()
      },
      {
        code: 'G-233',
        patientName: 'Sunita Mehra',
        patientEmail: 'sunita.m@example.com',
        patientPhone: '9822334455',
        doctor: 'Dr. Rohan Verma',
        doctorName: 'Dr. Rohan Verma',
        dept: 'General Medicine',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'Waiting',
        reason: 'Diabetes routine 3-month follow-up review',
        priority: 'Normal',
        vitals: { age: '52', gender: 'F', blood: 'A+', bp: '128/82', spo2: '97%' },
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        code: 'G-234',
        patientName: 'Devansh Roy',
        patientEmail: 'devansh.r@example.com',
        patientPhone: '9833445566',
        doctor: 'Dr. Rohan Verma',
        doctorName: 'Dr. Rohan Verma',
        dept: 'General Medicine',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'Waiting',
        reason: 'Acute abdominal cramping after food',
        priority: 'Normal',
        vitals: { age: '24', gender: 'M', blood: 'AB+', bp: '118/76', spo2: '99%' },
        createdAt: new Date(Date.now() - 1200000).toISOString()
      },
      {
        code: 'C-104',
        patientName: 'Rajesh Kulkarni',
        patientEmail: 'rajesh.k@example.com',
        patientPhone: '9844556677',
        doctor: 'Dr. Anjali Rao',
        doctorName: 'Dr. Anjali Rao',
        dept: 'Cardiology',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'Waiting',
        reason: 'Mild chest tightness upon climbing stairs',
        priority: 'Urgent',
        vitals: { age: '61', gender: 'M', blood: 'O+', bp: '142/90', spo2: '96%' },
        createdAt: new Date(Date.now() - 3000000).toISOString()
      },
      {
        code: 'O-058',
        patientName: 'Kavita Nair',
        patientEmail: 'kavita.n@example.com',
        patientPhone: '9855667788',
        doctor: 'Dr. Sameer Khanna',
        doctorName: 'Dr. Sameer Khanna',
        dept: 'Orthopaedics',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'Waiting',
        reason: 'Right knee acute twist injury during badminton',
        priority: 'Normal',
        vitals: { age: '31', gender: 'F', blood: 'B+', bp: '115/75', spo2: '99%' },
        createdAt: new Date(Date.now() - 2000000).toISOString()
      },
      {
        code: 'G-229',
        patientName: 'Preeti Deshmukh',
        patientEmail: 'preeti.d@example.com',
        patientPhone: '9866778899',
        doctor: 'Dr. Rohan Verma',
        doctorName: 'Dr. Rohan Verma',
        dept: 'General Medicine',
        date: todayFormatted,
        prefDate: todayFormatted,
        status: 'Done',
        reason: 'Seasonal allergy & sinus congestion',
        prescription: {
          doctor: 'Dr. Rohan Verma',
          dept: 'General Medicine',
          room: '101',
          license: 'MCI-101556',
          diagnosis: 'Allergic Sinusitis',
          medicines: [
            { name: 'Tab. Cetirizine', dose: '10 mg', freq: '0-0-1', dur: '5 days', inst: 'Bedtime' },
            { name: 'Fluticasone Nasal Spray', dose: '50 mcg', freq: '1-0-1', dur: '10 days', inst: '1 puff per nostril' }
          ],
          labs: ['Complete Blood Count (CBC)'],
          advice: 'Steam inhalation twice daily. Avoid dusty environments.',
          followup: 'After 7 days'
        },
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    audit_logs: [
      { id: 1, event: 'DATABASE_INITIALIZED', details: 'Database seeded with default doctors and OPD queues', timestamp: new Date().toISOString() }
    ]
  };
}

// In-Memory state for high-speed access and JSON synchronization
let memStore = null;

function loadFromDisk() {
  if (fs.existsSync(DB_JSON_FILE)) {
    try {
      const raw = fs.readFileSync(DB_JSON_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.doctors)) {
        if (!data.users) data.users = [];
        if (!data.tokens) data.tokens = [];
        if (!data.audit_logs) data.audit_logs = [];
        return data;
      }
    } catch (e) {
      console.error('Error parsing db.json:', e);
    }
  }
  const seed = getInitialSeedData();
  saveToDisk(seed);
  return seed;
}

function saveToDisk(data) {
  try {
    fs.writeFileSync(DB_JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Initialize SQLite Schema
function initSqliteSchema() {
  if (!sqliteDb) return;

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      dept TEXT NOT NULL,
      spec TEXT,
      exp INTEGER,
      license TEXT,
      hours TEXT,
      room TEXT,
      rating REAL,
      initials TEXT,
      color TEXT,
      password TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT DEFAULT 'patient',
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      age TEXT,
      gender TEXT,
      password TEXT NOT NULL,
      joined TEXT
    );

    CREATE TABLE IF NOT EXISTS tokens (
      code TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      patient_email TEXT,
      patient_phone TEXT,
      doctor TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      dept TEXT NOT NULL,
      date TEXT NOT NULL,
      pref_date TEXT,
      raw_date TEXT,
      status TEXT DEFAULT 'Waiting',
      priority TEXT DEFAULT 'Normal',
      reason TEXT,
      vitals_json TEXT,
      prescription_json TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      details TEXT,
      created_at TEXT
    );
  `);

  // Sync memory store into SQLite if tables are empty
  const docCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  if (docCount === 0 && memStore) {
    const insertDoc = sqliteDb.prepare(`
      INSERT OR REPLACE INTO doctors (id, name, email, phone, dept, spec, exp, license, hours, room, rating, initials, color, password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    memStore.doctors.forEach(d => {
      insertDoc.run(d.id, d.name, d.email, d.phone || '', d.dept, d.spec || '', d.exp || 5, d.license || '', d.hours || '', d.room || '', d.rating || 5.0, d.initials || '', d.color || 'c1', d.password || 'doctor123', d.status || 'active');
    });

    const insertUser = sqliteDb.prepare(`
      INSERT OR REPLACE INTO users (role, name, email, phone, age, gender, password, joined)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    memStore.users.forEach(u => {
      insertUser.run(u.role || 'patient', u.name, u.email, u.phone || '', u.age || '', u.gender || '', u.password, u.joined || new Date().toISOString());
    });

    const insertToken = sqliteDb.prepare(`
      INSERT OR REPLACE INTO tokens (code, patient_name, patient_email, patient_phone, doctor, doctor_name, dept, date, pref_date, raw_date, status, priority, reason, vitals_json, prescription_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    memStore.tokens.forEach(t => {
      insertToken.run(
        t.code,
        t.patientName,
        t.patientEmail || '',
        t.patientPhone || '',
        t.doctor,
        t.doctorName || t.doctor,
        t.dept,
        t.date || '',
        t.prefDate || '',
        t.rawDate || '',
        t.status || 'Waiting',
        t.priority || 'Normal',
        t.reason || '',
        JSON.stringify(t.vitals || {}),
        t.prescription ? JSON.stringify(t.prescription) : null,
        t.createdAt || new Date().toISOString()
      );
    });
  }
}

// Initialize memory store on load
memStore = loadFromDisk();
initSqliteSchema();

// Helper: Synchronize memory changes to SQLite and disk JSON
function commit() {
  saveToDisk(memStore);

  if (sqliteDb) {
    try {
      // Keep SQLite tokens in sync
      const insertToken = sqliteDb.prepare(`
        INSERT OR REPLACE INTO tokens (code, patient_name, patient_email, patient_phone, doctor, doctor_name, dept, date, pref_date, raw_date, status, priority, reason, vitals_json, prescription_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      memStore.tokens.forEach(t => {
        insertToken.run(
          t.code,
          t.patientName,
          t.patientEmail || '',
          t.patientPhone || '',
          t.doctor,
          t.doctorName || t.doctor,
          t.dept,
          t.date || '',
          t.prefDate || '',
          t.rawDate || '',
          t.status || 'Waiting',
          t.priority || 'Normal',
          t.reason || '',
          JSON.stringify(t.vitals || {}),
          t.prescription ? JSON.stringify(t.prescription) : null,
          t.createdAt || new Date().toISOString()
        );
      });
    } catch (e) {
      console.warn('SQLite sync warning:', e.message);
    }
  }
}

/* ══════════════════════════════════════════════════════════════════
   DATABASE API INTERFACE
   ══════════════════════════════════════════════════════════════════ */
const db = {
  // Database type info
  getEngineInfo() {
    return {
      type: sqliteDb ? 'SQLite3 (node:sqlite) + JSON Storage' : 'JSON FlatFile Storage',
      sqliteFile: DB_SQLITE_FILE,
      jsonFile: DB_JSON_FILE,
      tables: ['doctors', 'users', 'tokens', 'audit_logs']
    };
  },

  /* --- DOCTORS --- */
  getDoctors(filter = {}) {
    let docs = memStore.doctors.slice();
    if (filter.dept) {
      docs = docs.filter(d => d.dept.toLowerCase() === filter.dept.toLowerCase());
    }
    return docs.map(d => {
      const { password, ...safe } = d;
      return safe;
    });
  },

  getDoctorById(id) {
    return memStore.doctors.find(d => d.id.toLowerCase() === (id || '').toLowerCase());
  },

  getDoctorByEmail(email) {
    return memStore.doctors.find(d => d.email.toLowerCase() === (email || '').toLowerCase());
  },

  addDoctor(docData) {
    const newId = 'DR-' + String(memStore.doctors.length + 1).padStart(3, '0');
    const cleanName = docData.name.trim().startsWith('Dr.') ? docData.name.trim() : `Dr. ${docData.name.trim()}`;
    const initials = cleanName.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR';

    const doctor = {
      id: newId,
      name: cleanName,
      email: docData.email.trim().toLowerCase(),
      phone: docData.phone ? docData.phone.trim() : '',
      dept: docData.dept || 'General Medicine',
      spec: docData.dept ? `${docData.dept} Specialist` : 'General Medicine',
      license: docData.license ? docData.license.trim() : 'MCI-000000',
      password: docData.password || 'doctor123',
      initials: initials,
      room: '10' + (memStore.doctors.length + 1),
      exp: docData.exp || 5,
      rating: 5.0,
      hours: '09:00 – 17:00',
      color: 'c' + ((memStore.doctors.length % 6) + 1),
      status: 'active'
    };

    memStore.doctors.push(doctor);
    commit();
    this.logAudit('DOCTOR_REGISTERED', `Registered new doctor ${doctor.name} (${doctor.id})`);
    return doctor;
  },

  updateDoctor(id, updates) {
    const doc = this.getDoctorById(id);
    if (!doc) return null;
    Object.assign(doc, updates);
    commit();
    return doc;
  },

  /* --- USERS / PATIENTS --- */
  getUsers() {
    return memStore.users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
  },

  getUserByEmail(email) {
    return memStore.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
  },

  addUser(userData) {
    const user = {
      id: memStore.users.length + 1,
      role: userData.role || 'patient',
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone ? userData.phone.trim() : '',
      age: userData.age || '28',
      gender: userData.gender || 'Female',
      password: userData.password,
      joined: new Date().toISOString()
    };

    memStore.users.push(user);
    commit();
    this.logAudit('PATIENT_REGISTERED', `Registered new patient account for ${user.name} (${user.email})`);
    return user;
  },

  updateUser(email, updates) {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    Object.assign(user, updates);
    commit();
    return user;
  },

  /* --- TOKENS & QUEUES --- */
  getTokens(query = {}) {
    let tokens = memStore.tokens.slice();
    const { doctor, dept, status, patientEmail } = query;

    if (doctor) {
      const docLower = doctor.toLowerCase();
      tokens = tokens.filter(t => 
        (t.doctor && t.doctor.toLowerCase() === docLower) ||
        (t.doctorName && t.doctorName.toLowerCase() === docLower)
      );
    }
    if (dept) {
      tokens = tokens.filter(t => t.dept && t.dept.toLowerCase() === dept.toLowerCase());
    }
    if (status) {
      tokens = tokens.filter(t => t.status && t.status.toLowerCase() === status.toLowerCase());
    }
    if (patientEmail) {
      tokens = tokens.filter(t => t.patientEmail && t.patientEmail.toLowerCase() === patientEmail.toLowerCase());
    }

    return tokens;
  },

  getTokenByCode(code) {
    return memStore.tokens.find(t => t.code.toLowerCase() === (code || '').toLowerCase());
  },

  generateTokenCode(dept) {
    const prefix = (dept && dept.length ? dept.charAt(0) : 'G').toUpperCase();
    let num = 230 + memStore.tokens.length + 1;
    let code = `${prefix}-${num}`;
    while (memStore.tokens.some(t => t.code === code)) {
      num++;
      code = `${prefix}-${num}`;
    }
    return code;
  },

  addToken(data) {
    const dept = data.dept || 'General Medicine';
    const code = data.code || this.generateTokenCode(dept);

    const token = {
      code: code,
      patientName: data.patientName.trim(),
      patientPhone: data.patientPhone ? data.patientPhone.trim() : '9876543210',
      patientEmail: data.patientEmail ? data.patientEmail.trim().toLowerCase() : 'patient@mediqueue.in',
      doctor: (data.doctor || data.doctorName || 'Dr. Rohan Verma').trim(),
      doctorName: (data.doctorName || data.doctor || 'Dr. Rohan Verma').trim(),
      dept: dept,
      date: data.date || data.prefDate || new Date().toLocaleDateString(),
      prefDate: data.prefDate || data.date || new Date().toLocaleDateString(),
      rawDate: data.rawDate || new Date().toISOString().split('T')[0],
      reason: data.reason ? data.reason.trim() : 'General Consultation',
      status: data.status || 'Waiting',
      priority: data.priority || 'Normal',
      vitals: data.vitals || { age: '28', gender: 'Adult', blood: 'O+', bp: '120/80', spo2: '99%' },
      prescription: data.prescription || null,
      createdAt: data.createdAt || new Date().toISOString()
    };

    memStore.tokens.push(token);
    commit();
    this.logAudit('TOKEN_CREATED', `Token ${token.code} booked for ${token.patientName} with ${token.doctorName}`);
    return token;
  },

  updateToken(code, updates) {
    const token = this.getTokenByCode(code);
    if (!token) return null;

    // If marking in consultation, complete any previous active patient for the same doctor
    if (updates.status === 'In Consultation') {
      const docName = (token.doctor || token.doctorName || '').toLowerCase();
      memStore.tokens.forEach(t => {
        const isDocMatch = docName && (
          (t.doctor && t.doctor.toLowerCase() === docName) ||
          (t.doctorName && t.doctorName.toLowerCase() === docName)
        );
        if (isDocMatch && t.status === 'In Consultation' && t.code !== token.code) {
          t.status = 'Done';
        }
      });
    }

    Object.assign(token, updates);
    commit();
    this.logAudit('TOKEN_UPDATED', `Token ${code} updated. Status: ${token.status}`);
    return token;
  },

  deleteToken(code) {
    const idx = memStore.tokens.findIndex(t => t.code.toLowerCase() === (code || '').toLowerCase());
    if (idx === -1) return false;
    const removed = memStore.tokens.splice(idx, 1)[0];
    commit();
    this.logAudit('TOKEN_DELETED', `Token ${code} cancelled/deleted`);
    return removed;
  },

  callNextPatient(doctorName, dept) {
    const cleanDoc = (doctorName || '').trim().toLowerCase();
    const cleanDept = (dept || '').trim().toLowerCase();

    // Complete current consultation for this doctor
    memStore.tokens.forEach(t => {
      const isDocMatch = cleanDoc
        ? ((t.doctor && t.doctor.toLowerCase() === cleanDoc) || (t.doctorName && t.doctorName.toLowerCase() === cleanDoc))
        : (cleanDept && t.dept && t.dept.toLowerCase() === cleanDept);
      if (isDocMatch && t.status === 'In Consultation') {
        t.status = 'Done';
      }
    });

    // Find waiting tokens (prioritize Urgent)
    const docTokens = memStore.tokens.filter(t => {
      if (cleanDoc) {
        return (t.doctor && t.doctor.toLowerCase() === cleanDoc) ||
               (t.doctorName && t.doctorName.toLowerCase() === cleanDoc);
      }
      if (cleanDept) {
        return t.dept && t.dept.toLowerCase() === cleanDept;
      }
      return false;
    });

    const nextWaiting = docTokens.find(t => t.status === 'Waiting' && t.priority === 'Urgent') ||
                        docTokens.find(t => t.status === 'Waiting');

    if (!nextWaiting) {
      commit();
      return null;
    }

    nextWaiting.status = 'In Consultation';
    commit();
    this.logAudit('TOKEN_CALLED', `Doctor ${doctorName} called token ${nextWaiting.code} (${nextWaiting.patientName})`);
    return nextWaiting;
  },

  /* --- STATS --- */
  getStats() {
    const tokens = memStore.tokens;
    const departments = [
      { name: 'General Medicine', room: '101', doc: 'Dr. Rohan Verma' },
      { name: 'Cardiology', room: '204', doc: 'Dr. Anjali Rao' },
      { name: 'Orthopaedics', room: '118', doc: 'Dr. Sameer Khanna' },
      { name: 'Pediatrics', room: '302', doc: 'Dr. Meera Iyer' },
      { name: 'Dermatology', room: '210', doc: 'Dr. Nisha Pillai' },
      { name: 'Neurology', room: '305', doc: 'Dr. Arjun Kapoor' }
    ];

    const deptStats = departments.map(d => {
      const waiting = tokens.filter(t => t.dept === d.name && t.status === 'Waiting').length;
      const inConsult = tokens.find(t => t.dept === d.name && t.status === 'In Consultation');
      return {
        name: d.name,
        room: d.room,
        doctor: d.doc,
        waitingCount: waiting,
        activeToken: inConsult ? inConsult.code : null
      };
    });

    return {
      totalWaiting: tokens.filter(t => t.status === 'Waiting').length,
      totalCompleted: tokens.filter(t => t.status === 'Done').length,
      totalInConsult: tokens.filter(t => t.status === 'In Consultation').length,
      totalAppointments: tokens.length,
      departments: deptStats
    };
  },

  /* --- AUDIT LOGS --- */
  logAudit(event, details) {
    const entry = {
      id: memStore.audit_logs.length + 1,
      event,
      details,
      timestamp: new Date().toISOString()
    };
    memStore.audit_logs.push(entry);
    if (sqliteDb) {
      try {
        sqliteDb.prepare('INSERT INTO audit_logs (event, details, created_at) VALUES (?, ?, ?)').run(event, details, entry.timestamp);
      } catch (e) {}
    }
  },

  getAuditLogs(limit = 20) {
    return memStore.audit_logs.slice(-limit).reverse();
  },

  /* --- RESET & EXPORT --- */
  resetData() {
    memStore = getInitialSeedData();
    commit();
    if (sqliteDb) {
      try {
        sqliteDb.exec('DELETE FROM tokens; DELETE FROM users; DELETE FROM doctors; DELETE FROM audit_logs;');
        initSqliteSchema();
      } catch (e) {}
    }
    return memStore;
  },

  exportData() {
    return memStore;
  }
};

module.exports = db;
