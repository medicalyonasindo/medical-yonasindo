<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Divisi Medical - LPK Yonasindo Intra Pratama</title>
    <style>
        :root { 
            --primary: #346739; --secondary: #79AE6F; --light-green: #9FCB98;
            --danger: #e74c3c; --dark: #1e3a1f; --warning: #f1c40f; 
        }
        
        body { font-family: 'Segoe UI', sans-serif; background-color: #f4f7f4; margin: 0; padding: 0; }
        
        /* AUTH PAGE */
        .auth-container { max-width: 450px; margin: 60px auto; background: white; padding: 35px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-top: 5px solid var(--primary); }
        .auth-container h2 { text-align: center; color: var(--primary); margin-top: 0; margin-bottom: 5px; }
        .auth-container input { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        
        .remember-box { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin: 10px 0; cursor: pointer; }
        .remember-box input { width: auto; margin: 0; }

        /* APP LAYOUT */
        .main-app { display: none; padding: 20px; }
        .container { max-width: 1300px; margin: auto; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.05); }
        
        /* TAB SYSTEM */
        .tab-menu { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid var(--light-green); padding-bottom: 10px; }
        .tab-btn { padding: 10px 20px; border: none; background: #eee; cursor: pointer; border-radius: 8px; font-weight: bold; color: #666; transition: 0.3s; }
        .tab-btn.active { background: var(--primary); color: white; }
        .page-content { display: none; }
        .page-content.active { display: block; }

        .section-box { background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid var(--light-green); margin-bottom: 25px; }
        form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        input, select, button { padding: 12px; border: 1px solid #ced4da; border-radius: 8px; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: var(--primary); color: white; padding: 12px; text-align: left; font-size: 13px; }
        td { border-bottom: 1px solid #edf2ed; padding: 12px; font-size: 13px; }

        .blur-text { filter: blur(6px); user-select: none; background: #eee; border-radius: 4px; pointer-events: none; }
        .badge { padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: bold; color: white; text-transform: uppercase; }
        .fit { background: #27ae60; } .note { background: #f39c12; } .unfit { background: #c0392b; } .wait { background: #95a5a6; }

        .btn { cursor: pointer; border: none; font-weight: bold; color: white; padding: 8px 12px; border-radius: 6px; transition: 0.2s; font-size: 12px; }
        .btn-primary { background-color: var(--primary); }
        .btn-success { background-color: var(--secondary); }
        .btn-danger { background-color: var(--danger); }

        @media print { .no-print { display: none !important; } .blur-text { filter: none !important; } }
    </style>
</head>
<body>

<div id="authPage" class="auth-container">
    <h2>Login Medical</h2>
    <p style="text-align:center; font-size:12px; color: #666; margin-bottom:20px;">LPK YONASINDO INTRA PRATAMA</p>
    
    <div id="loginForm">
        <input type="text" id="uName" placeholder="Username">
        <input type="password" id="uPass" placeholder="Password">
        <label class="remember-box"><input type="checkbox" id="rememberMe"> Ingat akun saya</label>
        <button class="btn btn-primary" style="width: 100%; margin-top:10px;" onclick="doLogin()">MASUK KE SISTEM</button>
    </div>

    <div id="registerForm" style="display:none;">
        <input type="text" id="regFullName" placeholder="Nama Lengkap">
        <input type="text" id="regEmail" placeholder="Email (contoh@gmail.com)">
        <input type="text" id="regPhone" placeholder="Nomor HP (08xxxxxxxxxx)">
        <input type="text" id="regUser" placeholder="Username Baru">
        <input type="password" id="regPass" placeholder="Password Baru">
        <button class="btn btn-success" style="width: 100%; margin-top: 10px;" onclick="doRegister()">DAFTAR SEKARANG</button>
    </div>
    
    <div style="text-align: center; margin-top: 20px;"><a href="javascript:void(0)" onclick="toggleAuth()" id="switchLink" style="color:var(--primary); font-weight:bold; text-decoration:none">Buat Akun Siswa</a></div>
</div>

<div id="appPage" class="main-app">
    <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
            <h3 style="color:var(--primary); margin:0">SISTEM MEDICAL YONASINDO</h3>
            <div><span id="displayUser" style="font-weight:bold; margin-right:10px; color: var(--primary);"></span><button class="btn" style="background:#95a5a6" onclick="logout()">LOGOUT</button></div>
        </div>

        <div class="tab-menu no-print">
            <button class="tab-btn active" id="tab1" onclick="openTab('pengajuan')">1. PENGAJUAN MCU</button>
            <button class="tab-btn" id="tab2" onclick="openTab('hasil')">2. HASIL & STATUS</button>
            <button class="tab-btn" id="tabAdmin" onclick="openTab('admin')" style="display:none; background: var(--danger); color: white;">3. DATABASE AKUN</button>
        </div>

        <div id="page-pengajuan" class="page-content active">
            <div class="section-box">
                <form id="formMcu">
                    <input type="text" id="nama" placeholder="Nama Lengkap Siswa" required>
                    <input type="text" id="noHp" placeholder="No. HP (Hanya Angka)" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                    <input type="date" id="tglLahir" required>
                    <input type="text" id="kumiai" placeholder="Nama Kumiai" required>
                    <select id="tipeMcu" required>
                        <option value="" disabled selected>Tipe MCU</option>
                        <option value="MCU PRA">MCU PRA</option>
                        <option value="MCU FULL">MCU FULL</option>
                        <option value="MCU AKHIR">MCU AKHIR</option>
                    </select>
                    <button type="submit" class="btn btn-primary">SIMPAN PENGAJUAN</button>
                </form>
            </div>
            <div id="adminApprovalUI" style="display:none">
                <h4 style="color:var(--danger)">Antrean Pengajuan (Terbaru di atas)</h4>
                <table>
                    <thead><tr><th>Tgl Daftar</th><th>Nama</th><th>Kumiai</th><th>Tipe</th><th>Aksi</th></tr></thead>
                    <tbody id="listPending"></tbody>
                </table>
            </div>
        </div>

        <div id="page-hasil" class="page-content">
            <div class="section-box">
                <h4 style="color:var(--primary)">Database Hasil (A-Z)</h4>
                <input type="text" id="search" placeholder="Cari Nama..." onkeyup="loadData()" style="width:100%; margin-bottom:15px">
                <table>
                    <thead><tr><th>Approved</th><th>Tgl MCU</th><th>Nama</th><th>No. HP</th><th>Kumiai</th><th>Tipe</th><th>Hasil</th><th id="adminCol" style="display:none">Opsi</th></tr></thead>
                    <tbody id="listHasil"></tbody>
                </table>
            </div>
        </div>

        <div id="page-admin" class="page-content">
            <div class="section-box">
                <h4 style="color:var(--danger)">Database Seluruh Akun (A-Z)</h4>
                <table>
                    <thead><tr><th>Nama Lengkap</th><th>Email</th><th>No. HP</th><th>Username</th><th>Aksi</th></tr></thead>
                    <tbody id="listUser"></tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<script>
    // --- KUNCI NAMA DATABASE AGAR TIDAK HILANG ---
    const DB_USERS = "YONASINDO_USERS_DATABASE";
    const DB_RECORDS = "YONASINDO_RECORDS_DATABASE";
    const DB_SESSION = "YONASINDO_ACTIVE_SESSION";
    const ADMIN_CRED = { user: "adminmcuyonasindo", pass: "adminmcuyonasindo" };

    let users = JSON.parse(localStorage.getItem(DB_USERS)) || [];
    let records = JSON.parse(localStorage.getItem(DB_RECORDS)) || [];
    let currentUser = null;

    // Auto Login
    (function() {
        const saved = localStorage.getItem(DB_SESSION);
        if (saved) { currentUser = JSON.parse(saved); enterApp(); }
    })();

    function toggleAuth() {
        const isLogin = document.getElementById('loginForm').style.display !== 'none';
        document.getElementById('loginForm').style.display = isLogin ? 'none' : 'block';
        document.getElementById('registerForm').style.display = isLogin ? 'block' : 'none';
        document.getElementById('switchLink').innerText = isLogin ? 'Login Disini' : 'Buat Akun Siswa';
    }

    function doRegister() {
        const name = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const u = document.getElementById('regUser').value.trim();
        const p = document.getElementById('regPass').value.trim();

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("data berikut bukan email aktif, harap isi email aktif");
        if(!/^\d+$/.test(phone)) return alert("harap masukan nomor hp aktif");
        if(!name || !u || !p) return alert("Harap lengkapi semua kolom!");
        if(users.find(x => x.u === u)) return alert("Username sudah digunakan!");

        users.push({ u, p, name, email, phone });
        localStorage.setItem(DB_USERS, JSON.stringify(users));
        alert("Berhasil Daftar!"); toggleAuth();
    }

    function doLogin() {
        const u = document.getElementById('uName').value.trim();
        const p = document.getElementById('uPass').value.trim();
        const remember = document.getElementById('rememberMe').checked;
        let found = (u === ADMIN_CRED.user && p === ADMIN_CRED.pass) ? { u, role: 'admin' } : users.find(x => x.u === u && x.p === p);
        if(found) {
            currentUser = found;
            if(remember) localStorage.setItem(DB_SESSION, JSON.stringify(found));
            enterApp();
        } else alert("Login Gagal!");
    }

    function enterApp() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        document.getElementById('displayUser').innerText = "USER: " + currentUser.u.toUpperCase();
        if(currentUser.role === 'admin') {
            document.getElementById('adminApprovalUI').style.display = 'block';
            document.getElementById('tabAdmin').style.display = 'block';
            document.getElementById('adminCol').style.display = 'table-cell';
        }
        loadData();
    }

    function logout() { localStorage.removeItem(DB_SESSION); location.reload(); }

    function openTab(name) {
        document.querySelectorAll('.page-content, .tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById('page-' + name).classList.add('active');
        loadData();
    }

    document.getElementById('formMcu').onsubmit = function(e) {
        e.preventDefault();
        records.push({
            id: Date.now(), owner: currentUser.u,
            nama: document.getElementById('nama').value,
            noHp: document.getElementById('noHp').value,
            tglLahir: document.getElementById('tglLahir').value,
            kumiai: document.getElementById('kumiai').value,
            tipe: document.getElementById('tipeMcu').value,
            tglInput: new Date().toLocaleDateString('id-ID'),
            timestamp: new Date().getTime(),
            status: 'pending', hasil: 'PROSES', tglMcu: '-'
        });
        localStorage.setItem(DB_RECORDS, JSON.stringify(records));
        alert("Berhasil!"); this.reset(); loadData();
    };

    function loadData() {
        const isAdmin = currentUser.role === 'admin';
        const q = document.getElementById('search').value.toLowerCase();

        if(isAdmin) {
            // Antrean (Terbaru ke Terlama)
            const pending = records.filter(i => i.status === 'pending').sort((a,b) => b.timestamp - a.timestamp);
            document.getElementById('listPending').innerHTML = pending.map(i => `
                <tr><td>${i.tglInput}</td><td>${i.nama}</td><td>${i.kumiai}</td><td>${i.tipe}</td>
                <td><button class="btn btn-success" onclick="approve(${i.id})">APPROVE</button></td></tr>`).join('');

            // DB Akun (A-Z)
            const sortedUsers = [...users].sort((a,b) => a.name.localeCompare(b.name));
            document.getElementById('listUser').innerHTML = sortedUsers.map(u => `
                <tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone}</td><td>${u.u}</td>
                <td><button class="btn btn-danger" onclick="hapusUser('${u.u}')">HAPUS</button></td></tr>`).join('');
        }

        // Hasil (A-Z)
        let approved = records.filter(i => i.status === 'approved' && i.nama.toLowerCase().includes(q)).sort((a,b) => a.nama.localeCompare(b.nama));
        document.getElementById('listHasil').innerHTML = approved.map(i => {
            const noBlur = isAdmin || (i.owner === currentUser.u);
            const blur = noBlur ? '' : 'blur-text';
            const hClass = i.hasil.includes('Fit to Work') ? 'fit' : (i.hasil.includes('Note') ? 'note' : (i.hasil.includes('Unfit') ? 'unfit' : 'wait'));
            return `<tr><td>${i.tglApp}</td><td><b>${i.tglMcu}</b></td><td>${i.nama}</td><td class="${blur}">${i.noHp}</td>
                <td>${i.kumiai}</td><td>${i.tipe}</td><td><span class="badge ${hClass} ${blur}">${i.hasil}</span></td>
                <td style="${isAdmin?'':'display:none'}"><button class="btn btn-success" onclick="setHasil(${i.id})">HASIL</button></td></tr>`;
        }).join('');
    }

    function approve(id) {
        const tgl = prompt("Tgl MCU:"); if(!tgl) return;
        const idx = records.findIndex(i => i.id === id);
        records[idx].status = 'approved'; records[idx].tglMcu = tgl; records[idx].tglApp = new Date().toLocaleDateString('id-ID');
        localStorage.setItem(DB_RECORDS, JSON.stringify(records)); loadData();
    }

    function setHasil(id) {
        const h = prompt("1:Fit, 2:Note, 3:Unfit");
        const idx = records.findIndex(i => i.id === id);
        if(h==='1') records[idx].hasil = 'Fit to Work';
        else if(h==='2') records[idx].hasil = 'Fit with Note';
        else if(h==='3') records[idx].hasil = 'Unfit';
        localStorage.setItem(DB_RECORDS, JSON.stringify(records)); loadData();
    }

    function hapusUser(username) {
        if(confirm("Hapus akun?")) {
            users = users.filter(u => u.u !== username);
            localStorage.setItem(DB_USERS, JSON.stringify(users)); loadData();
        }
    }
</script>
</body>
</html>
