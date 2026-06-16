// ========== GLOBAL STATE ==========
let currentSection = 'dashboard';
let editingAppId = null;
let editingBannerId = null;

// ========== NAVIGATION ==========
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    document.getElementById('sec-' + id).classList.remove('hidden');
    document.querySelector('[data-sec="' + id + '"]').classList.add('active');
    currentSection = id;
    closeSidebar();

    if (id === 'dashboard') loadDashboard();
    else if (id === 'apps') loadApps();
    else if (id === 'banners') loadBanners();
    else if (id === 'announcement') loadAnnouncement();
    else if (id === 'users') loadUsers();
    else if (id === 'settings') loadSettings();
    else if (id === 'smartlink') loadSmartlink();
    else if (id === 'reviews') loadReviews();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ========== DASHBOARD ==========
function loadDashboard() {
    db.ref('users').once('value', s => {
        document.getElementById('stat-users').innerText = s.numChildren();
    });
    db.ref('apps').once('value', s => {
        document.getElementById('stat-apps').innerText = s.numChildren();
        let downloads = 0;
        s.forEach(child => { downloads += (child.val().downloads || 0); });
        document.getElementById('stat-downloads').innerText = downloads;
    });
    db.ref('statistics/totalUnlocks').once('value', s => {
        document.getElementById('stat-unlocks').innerText = s.val() || 0;
    });
    db.ref('reviews').once('value', s => {
        let total = 0;
        s.forEach(appSnap => { total += appSnap.numChildren(); });
        document.getElementById('stat-reviews').innerText = total;
    });
    loadTopApps();
}

function loadTopApps() {
    db.ref('apps').orderByChild('downloads').limitToLast(5).once('value', s => {
        const list = document.getElementById('top-apps-list');
        list.innerHTML = '';
        const apps = [];
        s.forEach(c => apps.unshift({ id: c.key, ...c.val() }));
        apps.forEach(app => {
            list.innerHTML += `<div class="top-app-row">
                <img src="${app.icon}" class="top-app-icon">
                <div class="top-app-info">
                    <div class="top-app-name">${app.name}</div>
                    <div class="top-app-sub">${app.category || ''} &bull; ${app.downloads || 0} downloads</div>
                </div>
            </div>`;
        });
        if (!apps.length) list.innerHTML = '<p class="empty-msg">No apps yet.</p>';
    });
}

// ========== APPS ==========
function loadApps() {
    db.ref('apps').on('value', s => {
        const list = document.getElementById('apps-list');
        list.innerHTML = '';
        const apps = [];
        s.forEach(c => apps.unshift({ id: c.key, ...c.val() }));
        if (!apps.length) { list.innerHTML = '<p class="empty-msg">No apps found.</p>'; return; }
        apps.forEach(app => {
            list.innerHTML += `<div class="app-row">
                <img src="${app.icon}" class="app-row-icon" onerror="this.src='https://via.placeholder.com/48'">
                <div class="app-row-info">
                    <div class="app-row-name">${app.name}</div>
                    <div class="app-row-sub">${app.category || ''} &bull; v${app.version || '1.0'} &bull; ${app.size || ''}</div>
                    <div class="badge-row">
                        ${app.featured ? '<span class="badge badge-blue">Featured</span>' : ''}
                        ${app.trending ? '<span class="badge badge-orange">Trending</span>' : ''}
                        ${app.published === false ? '<span class="badge badge-red">Unpublished</span>' : '<span class="badge badge-green">Published</span>'}
                    </div>
                </div>
                <div class="app-row-actions">
                    <button class="btn-icon btn-edit" onclick="openEditApp('${app.id}')"><i class="fa fa-pen"></i></button>
                    <button class="btn-icon btn-del" onclick="deleteApp('${app.id}')"><i class="fa fa-trash"></i></button>
                </div>
            </div>`;
        });
    });
}

function openAddApp() {
    editingAppId = null;
    document.getElementById('app-form-title').innerText = 'Add New App';
    document.getElementById('app-form').reset();
    document.getElementById('ss-list').innerHTML = '';
    document.getElementById('app-modal').classList.remove('hidden');
}

function openEditApp(id) {
    editingAppId = id;
    document.getElementById('app-form-title').innerText = 'Edit App';
    db.ref('apps/' + id).once('value', s => {
        const app = s.val();
        document.getElementById('af-name').value = app.name || '';
        document.getElementById('af-dev').value = app.dev || '';
        document.getElementById('af-category').value = app.category || 'App';
        document.getElementById('af-icon').value = app.icon || '';
        document.getElementById('af-apk').value = app.apk || '';
        document.getElementById('af-size').value = app.size || '';
        document.getElementById('af-version').value = app.version || '';
        document.getElementById('af-desc').value = app.desc || '';
        document.getElementById('af-tags').value = (app.tags || []).join(', ');
        document.getElementById('af-featured').checked = !!app.featured;
        document.getElementById('af-trending').checked = !!app.trending;
        document.getElementById('af-published').checked = app.published !== false;
        const ssList = document.getElementById('ss-list');
        ssList.innerHTML = '';
        (app.screenshots || []).forEach((url, i) => addSSRow(url, i));
        document.getElementById('app-modal').classList.remove('hidden');
    });
}

function closeAppModal() { document.getElementById('app-modal').classList.add('hidden'); }

function addSSRow(val, idx) {
    const ssList = document.getElementById('ss-list');
    const div = document.createElement('div');
    div.className = 'ss-row';
    div.innerHTML = `<input type="text" class="input ss-input" placeholder="Screenshot URL" value="${val || ''}">
        <button class="btn-icon btn-del" onclick="this.parentElement.remove()"><i class="fa fa-times"></i></button>`;
    ssList.appendChild(div);
}

function saveApp() {
    const name = document.getElementById('af-name').value.trim();
    if (!name) { alert('App name required'); return; }
    const screenshots = [...document.querySelectorAll('.ss-input')].map(i => i.value.trim()).filter(Boolean);
    const tags = document.getElementById('af-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
        name,
        dev: document.getElementById('af-dev').value.trim(),
        category: document.getElementById('af-category').value,
        icon: document.getElementById('af-icon').value.trim(),
        apk: document.getElementById('af-apk').value.trim(),
        size: document.getElementById('af-size').value.trim(),
        version: document.getElementById('af-version').value.trim(),
        desc: document.getElementById('af-desc').value.trim(),
        tags,
        screenshots,
        featured: document.getElementById('af-featured').checked,
        trending: document.getElementById('af-trending').checked,
        published: document.getElementById('af-published').checked,
        rating: 0,
        downloads: 0,
        updatedAt: Date.now()
    };
    const ref = editingAppId ? db.ref('apps/' + editingAppId) : db.ref('apps').push();
    if (!editingAppId) data.createdAt = Date.now();
    (editingAppId ? ref.update(data) : ref.set(data)).then(() => {
        closeAppModal();
        showToast('App saved successfully!');
    }).catch(e => alert(e.message));
}

function deleteApp(id) {
    if (!confirm('Delete this app?')) return;
    db.ref('apps/' + id).remove().then(() => showToast('App deleted.'));
}

// ========== BANNERS ==========
function loadBanners() {
    db.ref('banners').on('value', s => {
        const list = document.getElementById('banners-list');
        list.innerHTML = '';
        const banners = [];
        s.forEach(c => banners.push({ id: c.key, ...c.val() }));
        if (!banners.length) { list.innerHTML = '<p class="empty-msg">No banners.</p>'; return; }
        banners.forEach(b => {
            list.innerHTML += `<div class="banner-row">
                <img src="${b.img}" class="banner-thumb" onerror="this.src='https://via.placeholder.com/80x40'">
                <div class="banner-info">
                    <div class="banner-link">${b.link || 'No link'}</div>
                    <span class="badge ${b.active !== false ? 'badge-green' : 'badge-red'}">${b.active !== false ? 'Active' : 'Disabled'}</span>
                </div>
                <div class="app-row-actions">
                    <button class="btn-icon btn-edit" onclick="openEditBanner('${b.id}')"><i class="fa fa-pen"></i></button>
                    <button class="btn-icon btn-del" onclick="deleteBanner('${b.id}')"><i class="fa fa-trash"></i></button>
                </div>
            </div>`;
        });
    });
}

function openAddBanner() {
    editingBannerId = null;
    document.getElementById('bf-img').value = '';
    document.getElementById('bf-link').value = '';
    document.getElementById('bf-active').checked = true;
    document.getElementById('banner-modal').classList.remove('hidden');
}

function openEditBanner(id) {
    editingBannerId = id;
    db.ref('banners/' + id).once('value', s => {
        const b = s.val();
        document.getElementById('bf-img').value = b.img || '';
        document.getElementById('bf-link').value = b.link || '';
        document.getElementById('bf-active').checked = b.active !== false;
        document.getElementById('banner-modal').classList.remove('hidden');
    });
}

function closeBannerModal() { document.getElementById('banner-modal').classList.add('hidden'); }

function saveBanner() {
    const img = document.getElementById('bf-img').value.trim();
    if (!img) { alert('Image URL required'); return; }
    const data = { img, link: document.getElementById('bf-link').value.trim(), active: document.getElementById('bf-active').checked };
    const ref = editingBannerId ? db.ref('banners/' + editingBannerId) : db.ref('banners').push();
    (editingBannerId ? ref.update(data) : ref.set(data)).then(() => { closeBannerModal(); showToast('Banner saved!'); }).catch(e => alert(e.message));
}

function deleteBanner(id) {
    if (!confirm('Delete banner?')) return;
    db.ref('banners/' + id).remove().then(() => showToast('Banner deleted.'));
}

// ========== ANNOUNCEMENT ==========
function loadAnnouncement() {
    db.ref('announcement').once('value', s => {
        const d = s.val() || {};
        document.getElementById('ann-message').value = d.message || '';
        document.getElementById('ann-image').value = d.image || '';
        document.getElementById('ann-active').checked = !!d.active;
    });
}

function saveAnnouncement() {
    const data = {
        message: document.getElementById('ann-message').value.trim(),
        image: document.getElementById('ann-image').value.trim(),
        active: document.getElementById('ann-active').checked,
        updatedAt: Date.now()
    };
    db.ref('announcement').set(data).then(() => showToast('Announcement saved!')).catch(e => alert(e.message));
}

// ========== USERS ==========
function loadUsers() {
    db.ref('users').on('value', s => {
        const list = document.getElementById('users-list');
        list.innerHTML = '';
        const users = [];
        s.forEach(c => users.push({ id: c.key, ...c.val() }));
        if (!users.length) { list.innerHTML = '<p class="empty-msg">No users registered via panel.</p>'; return; }
        users.forEach(u => {
            list.innerHTML += `<div class="user-row">
                <div class="user-avatar">${(u.name || u.email || 'U')[0].toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${u.name || 'Unknown'}</div>
                    <div class="user-email">${u.email || ''}</div>
                    <div class="user-meta">Downloads: ${u.downloads || 0} &bull; Unlocks: ${u.unlocks || 0}</div>
                </div>
                <div class="app-row-actions">
                    ${u.blocked ? `<button class="btn-sm btn-green" onclick="toggleBlock('${u.id}', false)">Unblock</button>` : `<button class="btn-sm btn-del" onclick="toggleBlock('${u.id}', true)">Block</button>`}
                </div>
            </div>`;
        });
    });
}

function toggleBlock(uid, block) {
    db.ref('users/' + uid).update({ blocked: block }).then(() => showToast(block ? 'User blocked.' : 'User unblocked.'));
}

// ========== SETTINGS ==========
function loadSettings() {
    db.ref('settings').once('value', s => {
        const d = s.val() || {};
        document.getElementById('set-adlock').checked = d.adLockEnabled !== false;
        document.getElementById('set-freedl').checked = !!d.freeDownload;
        document.getElementById('set-adcount').value = d.requiredAdCount || 3;
        document.getElementById('set-popup-text').value = d.unlockPopupText || 'Complete Ads To Unlock Download';
        document.getElementById('set-reward-msg').value = d.rewardMessage || 'Watch ads to unlock the download.';
    });
}

function saveSettings() {
    const data = {
        adLockEnabled: document.getElementById('set-adlock').checked,
        freeDownload: document.getElementById('set-freedl').checked,
        requiredAdCount: parseInt(document.getElementById('set-adcount').value) || 3,
        unlockPopupText: document.getElementById('set-popup-text').value.trim(),
        rewardMessage: document.getElementById('set-reward-msg').value.trim(),
        updatedAt: Date.now()
    };
    db.ref('settings').update(data).then(() => showToast('Settings saved!')).catch(e => alert(e.message));
}

// ========== SMARTLINK ==========
function loadSmartlink() {
    db.ref('settings/adlock').once('value', s => {
        const d = s.val() || {};
        document.getElementById('sl-url').value = d.smartlinkUrl || '';
        document.getElementById('sl-network').value = d.network || 'monetag';
        document.getElementById('sl-count').value = d.requiredCount || 3;
        document.getElementById('sl-enabled').checked = d.enabled !== false;
        document.getElementById('sl-rewardlock').checked = d.rewardLock !== false;
    });
}

function saveSmartlink() {
    const data = {
        smartlinkUrl: document.getElementById('sl-url').value.trim(),
        network: document.getElementById('sl-network').value,
        requiredCount: parseInt(document.getElementById('sl-count').value) || 3,
        enabled: document.getElementById('sl-enabled').checked,
        rewardLock: document.getElementById('sl-rewardlock').checked,
        updatedAt: Date.now()
    };
    db.ref('settings/adlock').update(data).then(() => showToast('Smartlink settings saved!')).catch(e => alert(e.message));
}

// ========== REVIEWS ==========
function loadReviews() {
    db.ref('apps').once('value', appsSnap => {
        const apps = appsSnap.val() || {};
        const container = document.getElementById('reviews-list');
        container.innerHTML = '';
        let hasAny = false;

        const appIds = Object.keys(apps);
        let pending = appIds.length;
        if (!pending) { container.innerHTML = '<p class="empty-msg">No apps found.</p>'; return; }

        appIds.forEach(appId => {
            db.ref('apps/' + appId + '/reviews').once('value', revSnap => {
                const reviews = revSnap.val() || {};
                Object.entries(reviews).forEach(([uid, rev]) => {
                    hasAny = true;
                    container.innerHTML += `<div class="review-row">
                        <div class="review-meta">
                            <span class="review-user">${rev.userName || 'Anon'}</span>
                            <span class="review-app">App: ${apps[appId].name}</span>
                            <span class="review-stars">${'★'.repeat(rev.rating || 0)}</span>
                        </div>
                        <div class="review-text">${rev.comment || ''}</div>
                        <button class="btn-sm btn-del" onclick="deleteReview('${appId}','${uid}')">Delete</button>
                    </div>`;
                });
                pending--;
                if (pending === 0 && !hasAny) container.innerHTML = '<p class="empty-msg">No reviews yet.</p>';
            });
        });
    });
}

function deleteReview(appId, uid) {
    if (!confirm('Delete this review?')) return;
    db.ref('apps/' + appId + '/reviews/' + uid).remove().then(() => { showToast('Review deleted.'); loadReviews(); });
}

// ========== ADMIN AUTH ==========
function handleAdminLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-pass').value;
    if (!email || !pass) { showAuthError('Enter email and password.'); return; }
    auth.signInWithEmailAndPassword(email, pass).then(res => {
        return db.ref('admins/' + res.user.uid).once('value');
    }).then(snap => {
        if (!snap.exists() || snap.val() !== true) {
            auth.signOut();
            showAuthError('Access denied. Not an admin account.');
            return;
        }
        showAdminPanel(auth.currentUser);
    }).catch(e => showAuthError(e.message));
}

function handleAdminLogout() {
    if (!confirm('Logout from Admin Panel?')) return;
    auth.signOut().then(() => {
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    });
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.innerText = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function showAdminPanel(user) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('admin-name-display').innerText = user.displayName || user.email;
    showSection('dashboard');
}

// ========== TOAST ==========
function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('admin-panel').classList.add('hidden');
            return;
        }
        db.ref('admins/' + user.uid).once('value').then(snap => {
            if (snap.exists() && snap.val() === true) {
                showAdminPanel(user);
            } else {
                auth.signOut();
                document.getElementById('login-screen').classList.remove('hidden');
                document.getElementById('admin-panel').classList.add('hidden');
                showAuthError('Access denied.');
            }
        });
    });

    document.getElementById('admin-email').addEventListener('keydown', e => { if (e.key === 'Enter') handleAdminLogin(); });
    document.getElementById('admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') handleAdminLogin(); });
});
