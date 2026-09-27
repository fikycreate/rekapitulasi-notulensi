const BIN_ID = '6ab150bbffd5d160531fcbd2';
const API_KEY = '$2a$10$x55dM2Ekt4HAZis0Cdm7RuYWNPFan.KS93EQBw1CR2Q33IjF47fzK';
const ADMIN_PASSWORD = 'ti25admin';

const path = window.location.pathname;
const isBendaharaA = path.includes('bendahara_a.html');
const isBendaharaB = path.includes('bendahara_b.html');
const isAdminPage = path.includes('admin.html');

if (isBendaharaA || isBendaharaB) {
    const STORAGE_KEY = isBendaharaA ? 'kas_kelas_a' : 'kas_kelas_b';
    const SESSION_KEY = isBendaharaA ? 'isBendaharaALoggedIn' : 'isBendaharaBLoggedIn';
    const PASSWORD_BENDAHARA = 'ti25';

    let kasData = [];
    let editingIndex = null;
    const dateKeys = ['sep_17', 'okt_4', 'okt_11', 'okt_18', 'okt_25', 'nov_1', 'nov_8', 'nov_15', 'nov_22', 'nov_29', 'des_6', 'des_13', 'des_20', 'des_27', 'jan_3', 'jan_10'];

    window.handleLogin = function(e) {
        e.preventDefault();
        const pass = document.getElementById('bendahara-password').value;
        if (pass === PASSWORD_BENDAHARA) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-container').style.display = 'flex';
            loadData();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    };

    window.handleLogout = function() {
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
    };

    async function loadData() {
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            if (res.ok) {
                const json = await res.json();
                kasData = json.record[STORAGE_KEY] || [];
                renderTable();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function saveDataToCloud() {
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
                headers: { 'X-Master-Key': API_KEY }
            });
            let fullRecord = {};
            if (res.ok) {
                const json = await res.json();
                fullRecord = json.record || {};
            }
            fullRecord[STORAGE_KEY] = kasData;

            await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(fullRecord)
            });
        } catch (err) {
            console.error(err);
        }
    }

    function renderTable() {
        const tbody = document.getElementById('kas-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (kasData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="20" style="text-align: center; color: #64748b;">Belum ada data kas.</td></tr>`;
            updateTotals([]);
            return;
        }

        kasData.forEach((row, index) => {
            const tr = document.createElement('tr');
            let html = `<td>${row.no}</td><td>${row.nama}</td>`;
            
            let subtotal = 0;
            dateKeys.forEach(dk => {
                const checked = row[dk] ? 'checked' : '';
                if (row[dk]) subtotal += 5000;
                html += `<td style="text-align: center;"><input type="checkbox" ${checked} onchange="toggleCheck(${index}, '${dk}')" style="width: 16px; height: 16px; cursor: pointer;"></td>`;
            });

            html += `<td style="font-weight: bold; color: #1d4ed8;">Rp ${subtotal.toLocaleString('id-ID')}</td>`;
            html += `<td>
                <div style="display: flex; gap: 6px;">
                    <button class="btn-edit" onclick="editData(${index})">Edit</button>
                    <button class="btn-delete" onclick="deleteData(${index})">Hapus</button>
                </div>
            </td>`;
            tr.innerHTML = html;
            tbody.appendChild(tr);
        });

        updateTotals(kasData);
    }

    window.toggleCheck = function(index, dk) {
        kasData[index][dk] = !kasData[index][dk];
        saveDataToCloud();
        renderTable();
    };

    function updateTotals(data) {
        let colSums = new Array(16).fill(0);
        let grandTotal = 0;

        data.forEach(row => {
            dateKeys.forEach((dk, i) => {
                if (row[dk]) {
                    colSums[i] += 5000;
                    grandTotal += 5000;
                }
            });
        });

        colSums.forEach((sum, i) => {
            const el = document.getElementById(`col-total-${i}`);
            if (el) el.textContent = `Rp ${sum.toLocaleString('id-ID')}`;
        });
        const grandEl = document.getElementById('grand-total');
        if (grandEl) grandEl.textContent = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    }

    window.openKasModal = function(index = null) {
        editingIndex = index;
        document.getElementById('modal-title').textContent = index !== null ? 'Edit Data Kas' : 'Tambah Data Kas';
        document.getElementById('input-no').value = index !== null ? kasData[index].no : '';
        document.getElementById('input-nama').value = index !== null ? kasData[index].nama : '';
        document.getElementById('modal-container').classList.add('open');
    };

    window.closeModal = function() {
        document.getElementById('modal-container').classList.remove('open');
        editingIndex = null;
    };

    window.saveKasData = async function(e) {
        e.preventDefault();
        const no = document.getElementById('input-no').value;
        const nama = document.getElementById('input-nama').value;

        if (editingIndex !== null) {
            kasData[editingIndex].no = no;
            kasData[editingIndex].nama = nama;
        } else {
            let newRow = { no, nama };
            dateKeys.forEach(dk => newRow[dk] = false);
            kasData.push(newRow);
        }

        await saveDataToCloud();
        renderTable();
        closeModal();
    };

    window.editData = function(index) {
        openKasModal(index);
    };

    window.deleteData = async function(index) {
        if (confirm("Yakin ingin menghapus seluruh baris data ini?")) {
            kasData.splice(index, 1);
            await saveDataToCloud();
            renderTable();
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        if (sessionStorage.getItem(SESSION_KEY) === 'true') {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-container').style.display = 'flex';
            loadData();
        }
    });
}


function handleLogin(event) {
    event.preventDefault();
    const passInput = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');

    if (passInput === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').style.display = 'flex';
        errorMsg.style.display = 'none';
        initDashboard();
    } else {
        errorMsg.style.display = 'block';
    }
}

function handleLogout() {
    sessionStorage.removeItem('isAdminLoggedIn');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('admin-password').value = '';
}

const menuItems = document.querySelectorAll('.sidebar-menu li');
const pageSections = document.querySelectorAll('.page-section');
const pageTitle = document.getElementById('page-title');
const sidebar = document.getElementById('sidebar');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });
}

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const targetId = item.getAttribute('data-target');
        pageSections.forEach(section => {
            section.classList.remove('active');
            if (section.getAttribute('id') === targetId) {
                section.classList.add('active');
            }
        });

        pageTitle.textContent = item.textContent.trim();
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    });
});

let cloudData = {};

async function fetchFromCloud() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        if (response.ok) {
            const result = await response.json();
            cloudData = result.record || {};
        }
    } catch (error) {
        console.warn("Gagal mengambil data cloud:", error);
    }
}

async function saveToCloud() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(cloudData)
        });
    } catch (error) {
        console.error("Gagal menyimpan ke cloud:", error);
    }
}


let currentCreateTableSection = null;
window.openCreateTableModal = function(section) {
    currentCreateTableSection = section;
    document.getElementById('custom-table-title').value = '';
    document.getElementById('custom-table-cols').value = '';
    document.getElementById('custom-headers-container').innerHTML = '';
    document.getElementById('modal-create-table').classList.add('open');
};

window.closeCreateTableModal = function() {
    document.getElementById('modal-create-table').classList.remove('open');
    currentCreateTableSection = null;
};

window.generateHeaderInputs = function(count) {
    const container = document.getElementById('custom-headers-container');
    container.innerHTML = '';
    const num = parseInt(count);
    if (isNaN(num) || num <= 0) return;
    
    for (let i = 0; i < num; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.style.marginTop = '10px';
        div.innerHTML = `<label>Nama Header Kolom ${i + 1}</label><input type="text" name="header_${i}" placeholder="Masukkan nama header ${i + 1}..." required>`;
        container.appendChild(div);
    }
};

window.handleCreateTableSubmit = async function(e) {
    e.preventDefault();
    if (!currentCreateTableSection) return;
    
    const title = document.getElementById('custom-table-title').value;
    const colsCount = parseInt(document.getElementById('custom-table-cols').value);
    const headers = [];
    
    for (let i = 0; i < colsCount; i++) {
        const input = document.querySelector(`input[name="header_${i}"]`);
        if (input) headers.push(input.value);
    }

    const storageKey = `custom_tables_${currentCreateTableSection}`;
    if (!cloudData[storageKey]) cloudData[storageKey] = [];

    const newTable = {
        id: 'tbl_' + Date.now(),
        title: title,
        headers: headers,
        rows: []
    };

    cloudData[storageKey].push(newTable);
    await saveToCloud();
    renderCustomTables(currentCreateTableSection);
    closeCreateTableModal();
};

window.deleteCustomTable = async function(section, tableId) {
    if (confirm("Yakin ingin menghapus tabel manual ini beserta seluruh isinya?")) {
        const storageKey = `custom_tables_${section}`;
        if (cloudData[storageKey]) {
            cloudData[storageKey] = cloudData[storageKey].filter(t => t.id !== tableId);
            await saveToCloud();
            renderCustomTables(section);
        }
    }
};

let activeCustomTableId = null;
let activeCustomRowIndex = null;

window.openCustomRowModal = function(section, tableId, rowIndex = null) {
    currentCreateTableSection = section;
    activeCustomTableId = tableId;
    activeCustomRowIndex = rowIndex;

    const storageKey = `custom_tables_${section}`;
    const tables = cloudData[storageKey] || [];
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    document.getElementById('custom-row-modal-title').textContent = (rowIndex !== null ? 'Edit Data Baris' : 'Tambah Data Baris') + ` (${table.title})`;
    const container = document.getElementById('custom-row-inputs');
    container.innerHTML = '';

    const rowData = rowIndex !== null ? table.rows[rowIndex] : [];

    table.headers.forEach((header, i) => {
        const val = rowData[i] !== undefined ? rowData[i] : '';
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label>${header}</label><input type="text" name="col_${i}" value="${val}" required>`;
        container.appendChild(div);
    });

    document.getElementById('modal-custom-row').classList.add('open');
};

window.closeCustomRowModal = function() {
    document.getElementById('modal-custom-row').classList.remove('open');
    activeCustomTableId = null;
    activeCustomRowIndex = null;
};

window.handleCustomRowSubmit = async function(e) {
    e.preventDefault();
    if (!currentCreateTableSection || !activeCustomTableId) return;

    const storageKey = `custom_tables_${currentCreateTableSection}`;
    const tables = cloudData[storageKey] || [];
    const table = tables.find(t => t.id === activeCustomTableId);
    if (!table) return;

    const newRowVals = [];
    table.headers.forEach((_, i) => {
        const input = document.querySelector(`input[name="col_${i}"]`);
        newRowVals.push(input ? input.value : '');
    });

    if (activeCustomRowIndex !== null) {
        table.rows[activeCustomRowIndex] = newRowVals;
    } else {
        table.rows.push(newRowVals);
    }

    await saveToCloud();
    renderCustomTables(currentCreateTableSection);
    closeCustomRowModal();
};

window.deleteCustomRow = async function(section, tableId, rowIndex) {
    if (confirm("Yakin ingin menghapus baris ini?")) {
        const storageKey = `custom_tables_${section}`;
        const tables = cloudData[storageKey] || [];
        const table = tables.find(t => t.id === tableId);
        if (table) {
            table.rows.splice(rowIndex, 1);
            await saveToCloud();
            renderCustomTables(section);
        }
    }
};

window.renderCustomTables = function(section) {
    const containerId = `container-custom-${section}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    const storageKey = `custom_tables_${section}`;
    const tables = cloudData[storageKey] || [];
    container.innerHTML = '';

    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'card-table-container';
        
        let headerThs = '';
        table.headers.forEach(h => {
            headerThs += `<th>${h}</th>`;
        });
        headerThs += `<th>Aksi</th>`;

        let rowsHtml = '';
        if (table.rows.length === 0) {
            rowsHtml = `<tr><td colspan="${table.headers.length + 1}" style="text-align: center; color: #64748b;">Belum ada data.</td></tr>`;
        } else {
            table.rows.forEach((row, rIdx) => {
                let tds = '';
                row.forEach(val => {
                    tds += `<td>${val}</td>`;
                });
                tds += `<td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-edit" type="button" onclick="openCustomRowModal('${section}', '${table.id}', ${rIdx})">Edit</button>
                        <button class="btn-delete" type="button" onclick="deleteCustomRow('${section}', '${table.id}', ${rIdx})">Hapus</button>
                    </div>
                </td>`;
                rowsHtml += `<tr>${tds}</tr>`;
            });
        }

        card.innerHTML = `
            <div class="table-action-bar">
                <h3>${table.title}</h3>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-primary" onclick="openCustomRowModal('${section}', '${table.id}')"><i class="fa-solid fa-plus"></i> Tambah Data</button>
                    <button class="btn-delete" onclick="deleteCustomTable('${section}', '${table.id}')"><i class="fa-solid fa-trash"></i> Hapus Tabel</button>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>${headerThs}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
        container.appendChild(card);
    });
};

window.renderPublicCustomTables = function(section) {
    const containerId = `public-custom-${section}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    const storageKey = `custom_tables_${section}`;
    const tables = cloudData[storageKey] || [];
    container.innerHTML = '';

    tables.forEach(table => {
        const card = document.createElement('div');
        card.className = 'card-table-container';
        
        let headerThs = '';
        table.headers.forEach(h => {
            headerThs += `<th>${h}</th>`;
        });

        let rowsHtml = '';
        if (table.rows.length === 0) {
            rowsHtml = `<tr><td colspan="${table.headers.length}" style="text-align: center; color: #64748b;">Belum ada data.</td></tr>`;
        } else {
            table.rows.forEach(row => {
                let tds = '';
                row.forEach(val => {
                    tds += `<td>${val}</td>`;
                });
                rowsHtml += `<tr>${tds}</tr>`;
            });
        }

        card.innerHTML = `
            <div class="table-action-bar">
                <h3>${table.title}</h3>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>${headerThs}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
        container.appendChild(card);
    });
};


let editingNoteIndex = null;

window.openNoteModal = function(index = null) {
    editingNoteIndex = index;
    const titleEl = document.getElementById('note-modal-title');
    const inputTitle = document.getElementById('note-title');
    const inputContent = document.getElementById('note-content');
    
    if (titleEl) titleEl.textContent = index !== null ? 'Edit Catatan' : 'Tambah Catatan';
    if (!cloudData['data_catatan']) cloudData['data_catatan'] = [];
    
    if (index !== null) {
        const note = cloudData['data_catatan'][index];
        if (inputTitle) inputTitle.value = note.title || '';
        if (inputContent) inputContent.value = note.content || '';
    } else {
        if (inputTitle) inputTitle.value = '';
        if (inputContent) inputContent.value = '';
    }
    
    const modal = document.getElementById('modal-note');
    if (modal) modal.classList.add('open');
};

window.closeNoteModal = function() {
    const modal = document.getElementById('modal-note');
    if (modal) modal.classList.remove('open');
    editingNoteIndex = null;
};

window.handleNoteSubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;

    if (!cloudData['data_catatan']) cloudData['data_catatan'] = [];

    if (editingNoteIndex !== null) {
        cloudData['data_catatan'][editingNoteIndex] = { title, content, date: new Date().toLocaleDateString('id-ID') };
    } else {
        cloudData['data_catatan'].push({ title, content, date: new Date().toLocaleDateString('id-ID') });
    }

    await saveToCloud();
    renderAdminNotes();
    closeNoteModal();
};

window.deleteNote = async function(index) {
    if (confirm("Yakin ingin menghapus catatan ini?")) {
        if (cloudData['data_catatan']) {
            cloudData['data_catatan'].splice(index, 1);
            await saveToCloud();
            renderAdminNotes();
        }
    }
};

window.renderAdminNotes = function() {
    const container = document.getElementById('admin-notes-container');
    if (!container) return;
    const notes = cloudData['data_catatan'] || [];
    container.innerHTML = '';

    if (notes.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada catatan.</p>`;
        return;
    }

    notes.forEach((note, index) => {
        const card = document.createElement('div');
        card.style.cssText = "background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;";
        card.innerHTML = `
            <div>
                <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">${note.title}</h4>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;"><i class="fa-solid fa-calendar-days"></i> ${note.date || '-'}</p>
                <p style="font-size: 14px; color: var(--text-main); white-space: pre-line; line-height: 1.5;">${note.content}</p>
            </div>
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button class="btn-edit" onclick="openNoteModal(${index})">Edit</button>
                <button class="btn-delete" onclick="deleteNote(${index})">Hapus</button>
            </div>
        `;
        container.appendChild(card);
    });
};

window.renderPublicNotes = function() {
    const container = document.getElementById('public-notes-container');
    if (!container) return;
    const notes = cloudData['data_catatan'] || [];
    container.innerHTML = '';

    if (notes.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada catatan.</p>`;
        return;
    }

    notes.forEach((note) => {
        const card = document.createElement('div');
        card.style.cssText = "background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);";
        card.innerHTML = `
            <h4 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">${note.title}</h4>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;"><i class="fa-solid fa-calendar-days"></i> ${note.date || '-'}</p>
            <p style="font-size: 14px; color: var(--text-main); white-space: pre-line; line-height: 1.5;">${note.content}</p>
        `;
        container.appendChild(card);
    });
};


const dateKeysAdmin = ['sep_17', 'okt_4', 'okt_11', 'okt_18', 'okt_25', 'nov_1', 'nov_8', 'nov_15', 'nov_22', 'nov_29', 'des_6', 'des_13', 'des_20', 'des_27', 'jan_3', 'jan_10'];
let activeAdminKasKey = null;
let adminEditingIndex = null;

function renderAdminKasTable(storageKey, elementId) {
    const tbody = document.getElementById(elementId);
    if (!tbody) return;
    const data = cloudData[storageKey] || [];
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="20" style="text-align: center; color: #64748b;">Belum ada data kas.</td></tr>`;
        return;
    }

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        let html = `<td>${row.no}</td><td>${row.nama}</td>`;
        let subtotal = 0;
        dateKeysAdmin.forEach(dk => {
            const checked = row[dk] ? 'checked' : '';
            if (row[dk]) subtotal += 5000;
            html += `<td style="text-align: center;"><input type="checkbox" ${checked} onchange="toggleAdminCheck('${storageKey}', '${elementId}', ${index}, '${dk}')" style="width: 16px; height: 16px; cursor: pointer;"></td>`;
        });
        html += `<td style="font-weight: bold; color: #1d4ed8;">Rp ${subtotal.toLocaleString('id-ID')}</td>`;
        html += `<td><div style="display: flex; gap: 6px;"><button class="btn-edit" onclick="editAdminKas('${storageKey}', ${index})">Edit</button><button class="btn-delete" onclick="deleteAdminKas('${storageKey}', '${elementId}', ${index})">Hapus</button></div></td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function toggleAdminCheck(storageKey, elementId, index, dk) {
    if (!cloudData[storageKey]) cloudData[storageKey] = [];
    cloudData[storageKey][index][dk] = !cloudData[storageKey][index][dk];
    saveToCloud();
    renderAdminKasTable(storageKey, elementId);
}

function openAdminKasModal(storageKey, index = null) {
    activeAdminKasKey = storageKey;
    adminEditingIndex = index;
    const modalTitle = document.getElementById('admin-kas-modal-title');
    if (modalTitle) {
        modalTitle.textContent = (index !== null ? 'Edit ' : 'Tambah ') + (storageKey === 'kas_kelas_a' ? 'Kas Kelas A' : 'Kas Kelas B');
    }
    const noInput = document.getElementById('admin-kas-no');
    const namaInput = document.getElementById('admin-kas-nama');
    if (noInput) noInput.value = index !== null ? cloudData[storageKey][index].no : '';
    if (namaInput) namaInput.value = index !== null ? cloudData[storageKey][index].nama : '';
    
    const modalKasAdmin = document.getElementById('modal-kas-admin');
    if (modalKasAdmin) modalKasAdmin.classList.add('open');
}

function closeAdminKasModal() {
    const modalKasAdmin = document.getElementById('modal-kas-admin');
    if (modalKasAdmin) modalKasAdmin.classList.remove('open');
    activeAdminKasKey = null;
    adminEditingIndex = null;
}

async function saveAdminKasData(e) {
    e.preventDefault();
    if (!activeAdminKasKey) return;
    const no = document.getElementById('admin-kas-no').value;
    const nama = document.getElementById('admin-kas-nama').value;

    if (!cloudData[activeAdminKasKey]) cloudData[activeAdminKasKey] = [];

    if (adminEditingIndex !== null) {
        cloudData[activeAdminKasKey][adminEditingIndex].no = no;
        cloudData[activeAdminKasKey][adminEditingIndex].nama = nama;
    } else {
        let newRow = { no, nama };
        dateKeysAdmin.forEach(dk => newRow[dk] = false);
        cloudData[activeAdminKasKey].push(newRow);
    }

    await saveToCloud();
    const elementId = activeAdminKasKey === 'kas_kelas_a' ? 'admin-kas-a-tbody' : 'admin-kas-b-tbody';
    renderAdminKasTable(activeAdminKasKey, elementId);
    closeAdminKasModal();
}

function editAdminKas(storageKey, index) {
    openAdminKasModal(storageKey, index);
}

async function deleteAdminKas(storageKey, elementId, index) {
    if (confirm("Yakin ingin menghapus baris kas ini?")) {
        cloudData[storageKey].splice(index, 1);
        await saveToCloud();
        renderAdminKasTable(storageKey, elementId);
    }
}

async function initDashboard() {
    await fetchFromCloud();
    renderAdminKasTable('kas_kelas_a', 'admin-kas-a-tbody');
    renderAdminKasTable('kas_kelas_b', 'admin-kas-b-tbody');
    
    renderCustomTables('rekapitulasi');
    renderCustomTables('notulensi');
    renderCustomTables('rincian-output');
    renderAdminNotes();

    initDashboardWidgets();
}

window.addEventListener('DOMContentLoaded', async () => {
    initDashboardWidgets();
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    if (isAdminPage) {
        if (isLoggedIn === 'true') {
            const loginScreen = document.getElementById('login-screen');
            const appContainer = document.getElementById('app-container');
            if (loginScreen) loginScreen.classList.add('hidden');
            if (appContainer) appContainer.style.display = 'flex';
            await initDashboard();
        } else {
            const loginScreen = document.getElementById('login-screen');
            const appContainer = document.getElementById('app-container');
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (appContainer) appContainer.style.display = 'none';
        }
    }

  
    if (!isAdminPage && !isBendaharaA && !isBendaharaB) {
        await fetchFromCloud();
        renderPublicCustomTables('rekapitulasi');
        renderPublicCustomTables('notulensi');
        renderPublicCustomTables('rincian-output');
        renderPublicNotes();
    }
});


function initCalcDrag() {
    const popup = document.getElementById('calc-popup');
    const handle = document.getElementById('calc-drag-handle');
    if (!popup || !handle) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = popup.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

       
        popup.style.right = 'auto';
        popup.style.left = `${initialLeft}px`;
        popup.style.top = `${initialTop}px`;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        popup.style.left = `${initialLeft + dx}px`;
        popup.style.top = `${initialTop + dy}px`;
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function initDashboardWidgets() {
    function updateDateTime() {
        const now = new Date();
        const timeEl = document.getElementById('live-time');
        const dateEl = document.getElementById('live-date');
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        }
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    async function fetchWeather() {
        const weatherEl = document.getElementById('live-weather');
        if (!weatherEl) return;
        try {
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-7.7261&longitude=113.5658&current_weather=true');
            if (response.ok) {
                const data = await response.json();
                const cw = data.current_weather;
                if (cw) {
                    const temp = cw.temperature;
                    const code = cw.weathercode;
                    let desc = "Cerah";
                    if (code >= 1 && code <= 3) desc = "Berawan";
                    else if (code >= 45 && code <= 48) desc = "Berkabut";
                    else if (code >= 51 && code <= 67) desc = "Hujan";
                    else if (code >= 71 && code <= 77) desc = "Salju";
                    else if (code >= 80 && code <= 82) desc = "Hujan Lebat";
                    else if (code >= 95) desc = "Badai Petir";

                    weatherEl.textContent = `${desc}, ${temp}°C`;
                } else {
                    weatherEl.textContent = "Cerah, 28°C";
                }
            } else {
                weatherEl.textContent = "Cerah, 28°C";
            }
        } catch (err) {
            console.warn("Gagal mengambil data cuaca:", err);
            weatherEl.textContent = "Cerah, 28°C";
        }
    }
    fetchWeather();

    const openCalcBtn = document.getElementById('open-calc-btn');
    if (openCalcBtn && !document.getElementById('calc-popup')) {
        const calcHTML = `
            <div id="calc-popup" class="calc-popup-container" style="display: none;">
                <div class="calc-header" id="calc-drag-handle" style="cursor: grab;">
                    <div class="calc-title"><i class="fa-solid fa-calculator"></i> Kalkulator</div>
                    <button class="calc-close-btn" id="calc-close-btn">&times;</button>
                </div>
                <div class="calc-body">
                    <div class="calc-screen">
                        <div class="calc-history" id="calc-history"></div>
                        <div class="calc-display" id="calc-display">0</div>
                    </div>
                    <div class="calc-keys">
                        <button class="calc-btn op-clear" onclick="calcClear()">C</button>
                        <button class="calc-btn op-btn" onclick="calcAppend('(')">(</button>
                        <button class="calc-btn op-btn" onclick="calcAppend(')')">)</button>
                        <button class="calc-btn op-btn" onclick="calcAppend('/')">/</button>
                        <button class="calc-btn" onclick="calcAppend('7')">7</button>
                        <button class="calc-btn" onclick="calcAppend('8')">8</button>
                        <button class="calc-btn" onclick="calcAppend('9')">9</button>
                        <button class="calc-btn op-btn" onclick="calcAppend('*')">×</button>
                        <button class="calc-btn" onclick="calcAppend('4')">4</button>
                        <button class="calc-btn" onclick="calcAppend('5')">5</button>
                        <button class="calc-btn" onclick="calcAppend('6')">6</button>
                        <button class="calc-btn op-btn" onclick="calcAppend('-')">-</button>
                        <button class="calc-btn" onclick="calcAppend('1')">1</button>
                        <button class="calc-btn" onclick="calcAppend('2')">2</button>
                        <button class="calc-btn" onclick="calcAppend('3')">3</button>
                        <button class="calc-btn op-btn" onclick="calcAppend('+')">+</button>
                        <button class="calc-btn zero-btn" onclick="calcAppend('0')">0</button>
                        <button class="calc-btn" onclick="calcAppend('.')">.</button>
                        <button class="calc-btn equals-btn" onclick="calcCalculate()">=</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', calcHTML);

        const calcPopup = document.getElementById('calc-popup');
        const closeCalcBtn = document.getElementById('calc-close-btn');

        openCalcBtn.addEventListener('click', () => {
            calcPopup.style.display = 'block';
            initCalcDrag(); // Mengaktifkan fungsi geser saat kalkulator dibuka
        });

        closeCalcBtn.addEventListener('click', () => {
            calcPopup.style.display = 'none';
        });
    }
}

let calcExpression = '0';
window.calcAppend = function(val) {
    const display = document.getElementById('calc-display');
    if (calcExpression === '0' && val !== '.') {
        calcExpression = val;
    } else {
        calcExpression += val;
    }
    if (display) display.textContent = calcExpression;
};

window.calcClear = function() {
    calcExpression = '0';
    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');
    if (display) display.textContent = '0';
    if (history) history.textContent = '';
};

window.calcCalculate = function() {
    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');
    try {
        let sanitized = calcExpression.replace(/×/g, '*');
        let result = eval(sanitized);
        if (history) history.textContent = calcExpression + ' =';
        calcExpression = String(result);
        if (display) display.textContent = calcExpression;
    } catch (e) {
        if (display) display.textContent = 'Error';
        calcExpression = '0';
    }
};