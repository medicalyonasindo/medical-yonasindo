import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList, Home, LogOut, Shield, UserPlus, Users, FileCheck2, Search, Edit3, Menu, X } from 'lucide-react';

const STORAGE_KEYS = {
  users: 'mcu_users_v1',
  applications: 'mcu_applications_v1',
  session: 'mcu_session_v1',
};

const ADMIN_CREDENTIALS = {
  username: 'adminmcuyonasindo',
  password: 'admin',
};

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzIy5Eag574iymN_xNvJ8eKm4oDRsMD1ijrTwE92-QjMucbibQO4lzsGTUgKBG-rwAP/exec';

const CLINICS = [
  'Klinik Galaxy Medical Center',
  'Klinik Rosela Indah Medical Center',
];

const PACKAGES = [
  { value: 'MCU Pra', label: 'MCU Pra', desc: 'Untuk siswa baru masuk ke LPK Yonasindo' },
  { value: 'MCU Full', label: 'MCU Full', desc: 'Untuk siswa lolos mensetsu / matching job' },
  { value: 'MCU Akhir', label: 'MCU Akhir', desc: 'Untuk CoE / Penerbangan' },
];

const RESULT_OPTIONS = ['FIT TO WORK', 'FIT WITH NOTE', 'UNFIT'];

const blankForm = {
  fullName: '',
  phone: '',
  birthDate: '',
  kumiai: '',
  clinic: CLINICS[0],
  packageType: PACKAGES[0].value,
};

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function seedUsers() {
  const existing = safeParse(STORAGE_KEYS.users, null);
  if (existing) return existing;
  const initial = [
    {
      id: 'admin-1',
      role: 'admin',
      username: ADMIN_CREDENTIALS.username,
      password: ADMIN_CREDENTIALS.password,
      fullName: 'Admin MCU Yonasindo',
      phone: '-',
      email: '-',
      createdAt: nowIso(),
    },
  ];
  saveJSON(STORAGE_KEYS.users, initial);
  return initial;
}

function seedApplications() {
  const existing = safeParse(STORAGE_KEYS.applications, null);
  if (existing) return existing;
  saveJSON(STORAGE_KEYS.applications, []);
  return [];
}

async function syncToApi(action, payload) {
  try {
    await fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    // Silent fallback: app still works offline with localStorage.
  }
}

function App() {
  const [users, setUsers] = useState(() => seedUsers());
  const [applications, setApplications] = useState(() => seedApplications());
  const [session, setSession] = useState(() => safeParse(STORAGE_KEYS.session, null));
  const [view, setView] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    username: '',
    password: '',
  });
  const [mcForm, setMcForm] = useState(blankForm);
  const [resultDraft, setResultDraft] = useState({});

  useEffect(() => {
    saveJSON(STORAGE_KEYS.users, users);
  }, [users]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.applications, applications);
  }, [applications]);

  useEffect(() => {
    if (session) saveJSON(STORAGE_KEYS.session, session);
    else localStorage.removeItem(STORAGE_KEYS.session);
  }, [session]);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    if (user.role === 'admin' && !['admin', 'admin-results', 'admin-users'].includes(view)) {
      setView('admin');
    }
    if (user.role === 'student' && !['student-home', 'student-apps', 'student-results'].includes(view)) {
      setView('student-home');
    }
  }, [session, view]);

  const currentUser = session?.user || null;
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter((a) => a.userId === currentUser.id);
  }, [applications, currentUser]);

  const visibleResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = applications.filter((app) => {
      if (!q) return true;
      return [app.fullName, app.username, app.kumiai, app.clinic, app.packageType, app.result].some((v) =>
        String(v || '').toLowerCase().includes(q)
      );
    });
    return filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [applications, searchQuery]);

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const resultCount = applications.filter((a) => a.result).length;

  function flash(text) {
    setMessage(text);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setMessage(''), 2600);
  }

  function persistApplication(nextApps) {
    setApplications(nextApps);
    syncToApi('saveApplications', { applications: nextApps });
  }

  function persistUsers(nextUsers) {
    setUsers(nextUsers);
    syncToApi('saveUsers', { users: nextUsers });
  }

  function handleLogin(e) {
    e.preventDefault();
    const { username, password } = loginForm;
    if (!username || !password) return flash('Lengkapi username dan password.');

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const adminUser = users.find((u) => u.role === 'admin') || {
        id: 'admin-1',
        role: 'admin',
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
        fullName: 'Admin MCU Yonasindo',
        phone: '-',
        email: '-',
      };
      setSession({ user: adminUser });
      setView('admin');
      flash('Login admin berhasil.');
      return;
    }

    const found = users.find(
      (u) => u.role === 'student' && u.username === username && u.password === password
    );
    if (!found) return flash('Akun tidak ditemukan atau password salah.');

    setSession({ user: found });
    setView('student-home');
    flash(`Selamat datang, ${found.fullName}.`);
  }

  function handleRegister(e) {
    e.preventDefault();
    const { fullName, phone, email, username, password } = registerForm;
    if (!fullName || !phone || !email || !username || !password) {
      return flash('Semua data pendaftaran wajib diisi.');
    }
    if (users.some((u) => u.username === username)) {
      return flash('Username sudah dipakai. Gunakan username lain.');
    }

    const newUser = {
      id: `student-${Date.now()}`,
      role: 'student',
      fullName,
      phone,
      email,
      username,
      password,
      createdAt: nowIso(),
    };
    const nextUsers = [...users, newUser];
    persistUsers(nextUsers);
    setSession({ user: newUser });
    setView('student-home');
    flash('Pendaftaran berhasil. Silakan ajukan MCU.');
    syncToApi('register', { user: newUser });
  }

  function logout() {
    setSession(null);
    setView('home');
    setLoginForm({ username: '', password: '' });
    setRegisterForm({ fullName: '', phone: '', email: '', username: '', password: '' });
    setMcForm(blankForm);
    flash('Anda telah keluar.');
  }

  function submitMcApplication(e) {
    e.preventDefault();
    if (!currentUser) return flash('Silakan login terlebih dahulu.');
    if (!mcForm.fullName || !mcForm.phone || !mcForm.birthDate || !mcForm.kumiai || !mcForm.clinic || !mcForm.packageType) {
      return flash('Semua kolom pengajuan MCU harus diisi.');
    }

    const next = {
      id: `app-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      fullName: mcForm.fullName,
      phone: mcForm.phone,
      birthDate: mcForm.birthDate,
      kumiai: mcForm.kumiai,
      clinic: mcForm.clinic,
      packageType: mcForm.packageType,
      status: 'pending',
      result: '',
      adminNote: '',
      approvedBy: '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const nextApps = [next, ...applications];
    persistApplication(nextApps);
    setMcForm(blankForm);
    setView('student-apps');
    flash('Pengajuan MCU berhasil dikirim dan menunggu persetujuan admin.');
    syncToApi('newApplication', { application: next });
  }

  function approveApplication(appId) {
    const nextApps = applications.map((app) =>
      app.id === appId
        ? { ...app, status: 'approved', updatedAt: nowIso(), approvedBy: currentUser?.username || 'admin' }
        : app
    );
    persistApplication(nextApps);
    flash('Pengajuan disetujui.');
    syncToApi('approveApplication', { appId });
  }

  function updateResult(appId, value) {
    const nextApps = applications.map((app) =>
      app.id === appId
        ? { ...app, result: value, updatedAt: nowIso(), approvedBy: app.approvedBy || currentUser?.username || 'admin' }
        : app
    );
    persistApplication(nextApps);
    flash('Hasil MCU berhasil diperbarui.');
    syncToApi('updateResult', { appId, result: value });
  }

  function updateAdminNote(appId, note) {
    const nextApps = applications.map((app) =>
      app.id === appId ? { ...app, adminNote: note, updatedAt: nowIso() } : app
    );
    persistApplication(nextApps);
  }

  function renderTopBar() {
    return (
      <div className="sticky top-0 z-30 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-emerald-200 p-2 text-emerald-700 md:hidden"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-800">LPK Yonasindo Intra Pratama</div>
              <div className="text-xs text-slate-500">Medical Check Up Portal</div>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
                <div className="rounded-full bg-emerald-600 p-2 text-white">
                  <Users size={16} />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-emerald-900">{currentUser.fullName}</div>
                  <div className="text-xs text-slate-500">{currentUser.role === 'admin' ? 'Administrator' : 'Siswa'}</div>
                </div>
              </div>
            ) : null}
            {currentUser ? (
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <LogOut size={16} /> Keluar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function NavItem({ icon: Icon, label, target, badge, activeView }) {
    const active = view === activeView;
    return (
      <button
        onClick={() => {
          setView(target);
          setSidebarOpen(false);
        }}
        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
          active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon size={18} /> {label}
        </span>
        {badge ? <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>{badge}</span> : null}
      </button>
    );
  }

  function Sidebar() {
    return (
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 transform border-r border-emerald-100 bg-white p-4 shadow-2xl transition md:static md:translate-x-0 md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-6 flex items-center justify-between md:hidden">
          <div className="font-semibold text-emerald-800">Menu</div>
          <button onClick={() => setSidebarOpen(false)} className="rounded-xl border border-emerald-200 p-2">
            <X size={18} />
          </button>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 text-white shadow-lg shadow-emerald-200">
          <div className="text-sm opacity-90">Sistem MCU</div>
          <div className="mt-1 text-xl font-bold leading-tight">Divisi Medical</div>
          <p className="mt-2 text-sm text-emerald-50/90">Pengajuan, persetujuan, dan hasil MCU siswa dalam satu dashboard.</p>
        </div>

        <div className="mt-5 space-y-2">
          {!currentUser ? (
            <>
              <NavItem icon={Home} label="Beranda" target="home" activeView="home" />
              <NavItem icon={Shield} label="Login" target="login" activeView="login" />
              <NavItem icon={UserPlus} label="Daftar Siswa" target="register" activeView="register" />
            </>
          ) : isStudent ? (
            <>
              <NavItem icon={Home} label="Beranda" target="student-home" activeView="student-home" />
              <NavItem icon={ClipboardList} label="Pengajuan Saya" target="student-apps" activeView="student-apps" badge={myApplications.length} />
              <NavItem icon={FileCheck2} label="Hasil MCU" target="student-results" activeView="student-results" />
            </>
          ) : (
            <>
              <NavItem icon={Home} label="Dashboard Admin" target="admin" activeView="admin" badge={pendingCount} />
              <NavItem icon={ClipboardList} label="Pengajuan Masuk" target="admin" activeView="admin" />
              <NavItem icon={FileCheck2} label="Hasil MCU" target="admin-results" activeView="admin-results" badge={resultCount} />
              <NavItem icon={Users} label="Data Siswa" target="admin-users" activeView="admin-users" badge={users.filter((u) => u.role === 'student').length} />
            </>
          )}
        </div>

        {currentUser ? (
          <button
            onClick={logout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <LogOut size={16} /> Keluar
          </button>
        ) : null}
      </aside>
    );
  }

  function StatCard({ label, value, note }) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-bold text-emerald-700">{value}</div>
        <div className="mt-1 text-sm text-slate-500">{note}</div>
      </div>
    );
  }

  function Landing() {
    return (
      <div className="grid min-h-[calc(100vh-72px)] gap-8 px-4 py-10 md:grid-cols-2 md:px-6">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            <CheckCircle2 size={16} /> Sistem MCU LPK Yonasindo Intra Pratama
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            Website medical check up dengan alur siswa dan admin yang rapi.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Siswa dapat mendaftar, login, mengajukan MCU, melihat status pengajuan, dan memantau hasil. Admin memiliki akses untuk menyetujui pengajuan dan mengisi hasil MCU.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setView('login')} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
              Login <ArrowRight size={16} />
            </button>
            <button onClick={() => setView('register')} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50">
              Daftar Siswa
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Pengajuan" value={applications.length} note="Total data masuk" />
            <StatCard label="Disetujui" value={approvedCount} note="Siap proses hasil" />
            <StatCard label="Hasil" value={resultCount} note="Sudah diinput admin" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-50">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white">
            <div className="text-sm opacity-90">Akses cepat</div>
            <div className="mt-1 text-2xl font-bold">Admin & Siswa</div>
            <p className="mt-2 text-sm text-emerald-50/90">Login admin sudah dibuat tetap. Siswa bisa mendaftar sendiri lalu mengajukan MCU.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
              <div className="font-semibold text-emerald-900">Admin</div>
              <div className="mt-2 text-sm text-slate-600">Persetujuan pengajuan, input hasil MCU, dan monitoring data.</div>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100">
              <div className="font-semibold text-slate-900">Siswa</div>
              <div className="mt-2 text-sm text-slate-600">Daftar akun, ajukan MCU, lihat pengajuan sendiri, dan cek hasil.</div>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-dashed border-emerald-200 p-5 text-sm text-slate-600">
            Integrasi API Google Sheets sudah disiapkan pada layer aplikasi. Karena format endpoint tidak ditentukan, penyimpanan lokal tetap aktif agar website langsung berjalan.
          </div>
        </div>
      </div>
    );
  }

  function LoginPage() {
    return (
      <div className="grid min-h-[calc(100vh-72px)] place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-50">
          <h2 className="text-2xl font-bold text-slate-900">Login</h2>
          <p className="mt-1 text-sm text-slate-500">Masuk sebagai admin atau siswa yang sudah terdaftar.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 focus:border-emerald-400" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="Masukkan username" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Masukkan password" />
            </div>
            <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">Login</button>
          </form>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Admin tetap: <span className="font-semibold">{ADMIN_CREDENTIALS.username}</span> / <span className="font-semibold">{ADMIN_CREDENTIALS.password}</span>
          </div>
        </div>
      </div>
    );
  }

  function RegisterPage() {
    return (
      <div className="grid min-h-[calc(100vh-72px)] place-items-center px-4 py-10">
        <div className="w-full max-w-xl rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-50">
          <h2 className="text-2xl font-bold text-slate-900">Daftar akun siswa</h2>
          <p className="mt-1 text-sm text-slate-500">Isi data untuk membuat akun siswa baru.</p>
          <form onSubmit={handleRegister} className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['fullName', 'Nama lengkap'],
              ['phone', 'Nomor handphone'],
              ['email', 'Email'],
              ['username', 'Username'],
            ].map(([field, label]) => (
              <div key={field} className={field === 'fullName' ? 'md:col-span-2' : ''}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
                <input
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                  value={registerForm[field]}
                  onChange={(e) => setRegisterForm({ ...registerForm, [field]: e.target.value })}
                  placeholder={label}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Password" />
            </div>
            <button className="md:col-span-2 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">Buat akun</button>
          </form>
        </div>
      </div>
    );
  }

  function StudentHome() {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white shadow-xl shadow-emerald-100">
          <div className="text-sm opacity-90">Selamat datang</div>
          <div className="mt-1 text-3xl font-bold">{currentUser?.fullName}</div>
          <p className="mt-2 max-w-2xl text-emerald-50/90">Silakan buat pengajuan medical checkup sesuai kebutuhan Anda. Setelah admin menyetujui, hasil MCU akan muncul di halaman hasil MCU.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total pengajuan Anda" value={myApplications.length} note="Semua status" />
          <StatCard label="Menunggu persetujuan" value={myApplications.filter((a) => a.status === 'pending').length} note="Belum diproses admin" />
          <StatCard label="Sudah ada hasil" value={myApplications.filter((a) => a.result).length} note="Tersedia di hasil MCU" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900"><ClipboardList size={20} className="text-emerald-600" /> Form Pengajuan MCU</div>
            <form onSubmit={submitMcApplication} className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Nama lengkap (sesuai KTP)</label>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-400" value={mcForm.fullName} onChange={(e) => setMcForm({ ...mcForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nomor handphone</label>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-400" value={mcForm.phone} onChange={(e) => setMcForm({ ...mcForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tanggal lahir</label>
                <input type="date" className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-400" value={mcForm.birthDate} onChange={(e) => setMcForm({ ...mcForm, birthDate: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Kumiai</label>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-400" value={mcForm.kumiai} onChange={(e) => setMcForm({ ...mcForm, kumiai: e.target.value })} placeholder="Nama Kumiai" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Klinik</label>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-400" value={mcForm.clinic} onChange={(e) => setMcForm({ ...mcForm, clinic: e.target.value })}>
                  {CLINICS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Paket pemeriksaan</label>
                <div className="grid gap-3 md:grid-cols-3">
                  {PACKAGES.map((pkg) => (
                    <label key={pkg.value} className={`cursor-pointer rounded-2xl border p-4 transition ${mcForm.packageType === pkg.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <input type="radio" name="packageType" className="hidden" checked={mcForm.packageType === pkg.value} onChange={() => setMcForm({ ...mcForm, packageType: pkg.value })} />
                      <div className="font-semibold text-slate-900">{pkg.label}</div>
                      <div className="mt-1 text-sm text-slate-500">{pkg.desc}</div>
                    </label>
                  ))}
                </div>
              </div>
              <button className="md:col-span-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">Ajukan MCU</button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900"><Shield size={20} className="text-emerald-600" /> Informasi</div>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">Data pengajuan Anda akan masuk ke antrian persetujuan admin.</div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">Hanya admin yang bisa mengubah hasil MCU menjadi FIT TO WORK, FIT WITH NOTE, atau UNFIT.</div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">Hasil siswa lain akan disensor menjadi **** saat dilihat dari akun siswa.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function StudentApplications() {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900"><ClipboardList size={20} className="text-emerald-600" /> Pengajuan saya</div>
          <p className="mt-2 text-sm text-slate-500">Status pengajuan MCU milik Anda.</p>
          {myApplications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              Anda belum mengajukan pengajuan MCU, Silahkan buat pengajuan MCU terlebih dahulu!
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {myApplications.map((app) => (
                <div key={app.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{app.fullName}</div>
                      <div className="text-sm text-slate-500">{app.packageType} · {app.clinic}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {app.status === 'approved' ? 'Disetujui' : 'Menunggu persetujuan'}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>HP: {app.phone}</div>
                    <div>Lahir: {app.birthDate}</div>
                    <div>Kumiai: {app.kumiai}</div>
                    <div>Klinik: {app.clinic}</div>
                  </div>
                  {app.result ? <div className="mt-4 rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-700">Hasil MCU: {app.result}</div> : null}
                  {app.adminNote ? <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-slate-600">Catatan admin: {app.adminNote}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function StudentResults() {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900"><FileCheck2 size={20} className="text-emerald-600" /> Hasil MCU</div>
          <p className="mt-2 text-sm text-slate-500">Anda bisa melihat hasil sendiri. Hasil siswa lain akan disensor.</p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-1 gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 md:grid-cols-5">
              <div>Nama</div>
              <div>Username</div>
              <div>Paket</div>
              <div>Klinik</div>
              <div>Hasil</div>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleResults.map((app) => {
                const mine = app.userId === currentUser?.id;
                return (
                  <div key={app.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm md:grid-cols-5 md:items-center">
                    <div className="font-medium text-slate-900">{app.fullName}</div>
                    <div className="text-slate-500">{mine ? app.username : '****'}</div>
                    <div className="text-slate-600">{mine ? app.packageType : '****'}</div>
                    <div className="text-slate-600">{mine ? app.clinic : '****'}</div>
                    <div className={`font-semibold ${mine ? 'text-emerald-700' : 'text-slate-400'}`}>{mine ? (app.result || 'Belum diisi') : '****'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function AdminDashboard() {
    const pendingApps = applications.filter((a) => a.status === 'pending');
    const approvedApps = applications.filter((a) => a.status === 'approved');
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white shadow-xl shadow-emerald-100">
          <div className="text-sm opacity-90">Admin Dashboard</div>
          <div className="mt-1 text-3xl font-bold">Persetujuan & input hasil MCU</div>
          <p className="mt-2 max-w-2xl text-emerald-50/90">Gunakan halaman ini untuk menyetujui pengajuan siswa dan mengisi hasil MCU.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Pengajuan pending" value={pendingApps.length} note="Perlu persetujuan" />
          <StatCard label="Pengajuan approved" value={approvedApps.length} note="Siap hasil" />
          <StatCard label="Total siswa" value={users.filter((u) => u.role === 'student').length} note="Akun terdaftar" />
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-bold text-slate-900">Pengajuan masuk</div>
              <div className="text-sm text-slate-500">Setujui pengajuan siswa, lalu isi hasil MCU.</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">Data disimpan otomatis</div>
          </div>

          <div className="mt-5 space-y-4">
            {applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-slate-500">Belum ada pengajuan MCU.</div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{app.fullName}</div>
                      <div className="text-sm text-slate-500">{app.username} · {app.packageType} · {app.clinic}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {app.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>HP: {app.phone}</div>
                    <div>Lahir: {app.birthDate}</div>
                    <div>Kumiai: {app.kumiai}</div>
                    <div>Created: {new Date(app.createdAt).toLocaleString('id-ID')}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => approveApplication(app.id)}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                      disabled={app.status === 'approved'}
                    >
                      {app.status === 'approved' ? 'Sudah disetujui' : 'Setujui'}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {RESULT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateResult(app.id, opt)}
                        className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${app.result === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Catatan admin</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
                      value={app.adminNote || ''}
                      onChange={(e) => updateAdminNote(app.id, e.target.value)}
                      placeholder="Opsional"
                    />
                  </div>

                  {app.result ? <div className="mt-4 rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-700">Hasil saat ini: {app.result}</div> : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  function AdminResults() {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-slate-900">Database Hasil MCU</div>
              <div className="text-sm text-slate-500">Admin melihat seluruh hasil. Siswa melihat hasil sendiri dan data lain disensor.</div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama, username, klinik..." className="w-64 bg-transparent outline-none" />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-1 gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 md:grid-cols-6">
              <div>Nama</div>
              <div>Username</div>
              <div>Paket</div>
              <div>Klinik</div>
              <div>Status</div>
              <div>Hasil</div>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleResults.map((app) => (
                <div key={app.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm md:grid-cols-6 md:items-center">
                  <div className="font-medium text-slate-900">{app.fullName}</div>
                  <div className="text-slate-600">{app.username}</div>
                  <div className="text-slate-600">{app.packageType}</div>
                  <div className="text-slate-600">{app.clinic}</div>
                  <div className={`font-semibold ${app.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>{app.status}</div>
                  <div className={`font-semibold ${app.result ? 'text-emerald-700' : 'text-slate-400'}`}>{app.result || 'Belum diisi'}</div>
                </div>
              ))}
              {visibleResults.length === 0 ? <div className="px-4 py-8 text-center text-slate-500">Tidak ada data.</div> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function AdminUsers() {
    const students = users.filter((u) => u.role === 'student');
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="text-lg font-bold text-slate-900">Data siswa</div>
          <div className="mt-1 text-sm text-slate-500">Akun siswa yang sudah terdaftar.</div>
          <div className="mt-5 space-y-3">
            {students.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-slate-500">Belum ada siswa terdaftar.</div>
            ) : (
              students.map((u) => (
                <div key={u.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="font-semibold text-slate-900">{u.fullName}</div>
                  <div className="mt-1 text-sm text-slate-500">{u.username} · {u.email} · {u.phone}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  let content = <Landing />;
  if (view === 'login') content = <LoginPage />;
  else if (view === 'register') content = <RegisterPage />;
  else if (view === 'student-home') content = <StudentHome />;
  else if (view === 'student-apps') content = <StudentApplications />;
  else if (view === 'student-results') content = <StudentResults />;
  else if (view === 'admin') content = <AdminDashboard />;
  else if (view === 'admin-results') content = <AdminResults />;
  else if (view === 'admin-users') content = <AdminUsers />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(to_bottom,_#f8fffb,_#f7faf9)] text-slate-900">
      {renderTopBar()}
      <div className="mx-auto flex max-w-7xl">
        <Sidebar />
        <main className="min-h-[calc(100vh-72px)] flex-1">
          {message ? (
            <div className="mx-4 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 md:mx-6">
              <span className="inline-flex items-center gap-2"><AlertCircle size={16} /> {message}</span>
            </div>
          ) : null}
          {content}
        </main>
      </div>
    </div>
  );
}

export default App;
