/**
 * OPHELIA ROLEPLAY - ADMIN CONTROL PANEL CLIENT SCRIPT
 * Handles Authentication, CRUD operations for Posters & Articles, and UI Modals
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    let authToken = localStorage.getItem('ophelia_token') || null;
    let currentUser = null;
    let postersData = [];
    let articlesData = [];

    // Delete Modal State
    let pendingDelete = {
        type: null, // 'poster' | 'article'
        id: null,
        title: ''
    };

    // DOM Elements - Auth & Wrappers
    const loginScreen = document.getElementById('login-screen');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const btnLogout = document.getElementById('btn-logout');
    const adminUserNameEl = document.getElementById('admin-user-name');
    const toastContainer = document.getElementById('toast-container');

    // DOM Elements - Metrics
    const metricPosters = document.getElementById('metric-posters');
    const metricArticles = document.getElementById('metric-articles');

    // DOM Elements - Tabs
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const tabPanes = document.querySelectorAll('.admin-tab-pane');

    // DOM Elements - Posters
    const postersTableBody = document.getElementById('posters-table-body');
    const btnAddPoster = document.getElementById('btn-add-poster');
    const modalPoster = document.getElementById('modal-poster');
    const modalPosterHeading = document.getElementById('modal-poster-heading');
    const modalPosterClose = document.getElementById('modal-poster-close');
    const modalPosterCancel = document.getElementById('modal-poster-cancel');
    const modalPosterBackdrop = document.getElementById('modal-poster-backdrop');
    const formPoster = document.getElementById('form-poster');
    const posterEditId = document.getElementById('poster-edit-id');
    const posterTitle = document.getElementById('poster-title');
    const posterCategory = document.getElementById('poster-category');
    const posterFile = document.getElementById('poster-file');
    const posterDropArea = document.getElementById('poster-drop-area');
    const posterFileName = document.getElementById('poster-file-name');
    const posterPreviewBox = document.getElementById('poster-preview-box');
    const posterPreviewImg = document.getElementById('poster-preview-img');
    const posterRemovePreview = document.getElementById('poster-remove-preview');
    const posterDirectUrl = document.getElementById('poster-direct-url');
    const posterDesc = document.getElementById('poster-desc');

    // DOM Elements - Articles
    const articlesTableBody = document.getElementById('articles-table-body');
    const btnAddArticle = document.getElementById('btn-add-article');
    const modalArticle = document.getElementById('modal-article');
    const modalArticleHeading = document.getElementById('modal-article-heading');
    const modalArticleClose = document.getElementById('modal-article-close');
    const modalArticleCancel = document.getElementById('modal-article-cancel');
    const modalArticleBackdrop = document.getElementById('modal-article-backdrop');
    const formArticle = document.getElementById('form-article');
    const articleEditId = document.getElementById('article-edit-id');
    const articleTitle = document.getElementById('article-title');
    const articleCategory = document.getElementById('article-category');
    const articleAuthor = document.getElementById('article-author');
    const articleFile = document.getElementById('article-file');
    const articleDropArea = document.getElementById('article-drop-area');
    const articleFileName = document.getElementById('article-file-name');
    const articlePreviewBox = document.getElementById('article-preview-box');
    const articlePreviewImg = document.getElementById('article-preview-img');
    const articleRemovePreview = document.getElementById('article-remove-preview');
    const articleDirectUrl = document.getElementById('article-direct-url');
    const articleExcerpt = document.getElementById('article-excerpt');
    const articleContent = document.getElementById('article-content');

    // DOM Elements - Delete Modal
    const modalDelete = document.getElementById('modal-delete');
    const modalDeleteClose = document.getElementById('modal-delete-close');
    const modalDeleteBackdrop = document.getElementById('modal-delete-backdrop');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const deletePromptText = document.getElementById('delete-prompt-text');

    // ==========================================================================
    // TOAST NOTIFICATIONS HELPER
    // ==========================================================================
    function showToast(message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff1e27" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-msg">${escapeHtml(message)}</div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // ==========================================================================
    // AUTHENTICATION
    // ==========================================================================
    async function checkAuth() {
        if (!authToken) {
            showLogin();
            return;
        }

        try {
            const res = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                currentUser = data.user;
                showDashboard();
                loadAllData();
            } else {
                localStorage.removeItem('ophelia_token');
                authToken = null;
                showLogin();
            }
        } catch (err) {
            console.error('Auth verification error:', err);
            showLogin();
        }
    }

    function showLogin() {
        loginScreen.style.display = 'flex';
        adminDashboard.style.display = 'none';
        usernameInput.focus();
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'block';
        if (currentUser) {
            adminUserNameEl.textContent = currentUser.username;
        }
    }

    // Handle Login Form Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const btnSubmit = document.getElementById('btn-login');

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span>MEMPROSES...</span>`;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                authToken = data.token;
                localStorage.setItem('ophelia_token', authToken);
                currentUser = data.user;
                showToast(`Selamat datang, Administrator ${currentUser.username}!`, 'success');
                showDashboard();
                loadAllData();
            } else {
                showToast(data.message || 'Username atau password salah!', 'error');
            }
        } catch (err) {
            showToast('Gagal menghubungi server.', 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `
                <span>LOGIN COMMAND</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            `;
        }
    });

    // Handle Logout
    btnLogout.addEventListener('click', async () => {
        if (!confirm('Apakah kamu yakin ingin logout dari admin panel?')) return;

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        } catch (err) {
            console.warn(err);
        }

        localStorage.removeItem('ophelia_token');
        authToken = null;
        currentUser = null;
        showToast('Anda telah logout dengan aman.', 'info');
        showLogin();
    });

    // ==========================================================================
    // TABS NAVIGATION
    // ==========================================================================
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // ==========================================================================
    // DATA LOADING & METRICS
    // ==========================================================================
    async function loadAllData() {
        await Promise.all([
            fetchStats(),
            fetchPosters(),
            fetchArticles()
        ]);
    }

    const adminServerStatus = document.getElementById('admin-server-status');
    const adminDbStatus = document.getElementById('admin-db-status');

    function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
        return new Promise((resolve) => {
            if (!file || !file.type.startsWith('image/')) return resolve(file);
            if (file.size < 1024 * 1024) return resolve(file); // Already under 1MB

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob && blob.size < file.size) {
                            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                                type: 'image/webp',
                                lastModified: Date.now()
                            });
                            resolve(compressed);
                        } else {
                            resolve(file);
                        }
                    }, 'image/webp', quality);
                };
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }

    async function fetchStats() {
        try {
            const [statsRes, cfxRes] = await Promise.all([
                fetch(`/api/stats?_t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
                fetch('/api/server-status').then(r => r.json()).catch(() => ({}))
            ]);

            metricPosters.textContent = statsRes.postersCount || 0;
            metricArticles.textContent = statsRes.articlesCount || 0;

            if (adminDbStatus) {
                if (statsRes.database === 'supabase') {
                    adminDbStatus.textContent = 'SUPABASE CLOUD';
                    adminDbStatus.style.color = '#3ecf8e';
                } else {
                    adminDbStatus.textContent = 'LOCAL / FALLBACK';
                    adminDbStatus.style.color = '#f59e0b';
                }
            }

            if (adminServerStatus) {
                if (cfxRes.online) {
                    adminServerStatus.textContent = `ONLINE (${cfxRes.clients || 0} / ${cfxRes.maxClients || 1000})`;
                    adminServerStatus.className = 'metric-val text-green';
                } else {
                    adminServerStatus.textContent = 'OFFLINE';
                    adminServerStatus.className = 'metric-val text-red';
                }
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    function getBadgeClass(cat) {
        const c = (cat || '').toUpperCase();
        if (c === 'EVENT') return 'badge-event';
        if (c === 'RECRUITMENT') return 'badge-recruitment';
        if (c === 'PATCH NOTES' || c === 'UPDATE') return 'badge-patch';
        if (c === 'GUIDE') return 'badge-guide';
        return 'badge-community';
    }

    // ==========================================================================
    // POSTERS MANAGEMENT
    // ==========================================================================
    async function fetchPosters() {
        try {
            const res = await fetch(`/api/posters?_t=${Date.now()}`, { cache: 'no-store' });
            postersData = await res.json();
            renderPostersTable();
        } catch (err) {
            showToast('Gagal memuat data poster.', 'error');
        }
    }

    function renderPostersTable() {
        if (!postersData || postersData.length === 0) {
            postersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="table-empty">Belum ada poster. Klik tombol "Tambah Poster Baru" untuk membuat.</td>
                </tr>
            `;
            return;
        }

        postersTableBody.innerHTML = postersData.map(poster => `
            <tr>
                <td>
                    <img src="${escapeHtml(poster.imageUrl)}" alt="${escapeHtml(poster.title)}" class="table-thumb" onerror="this.src='asset/img/logo-3d.png'">
                </td>
                <td>
                    <div class="table-item-title">${escapeHtml(poster.title)}</div>
                    <div class="table-item-desc">${escapeHtml(poster.description || 'Tidak ada deskripsi')}</div>
                </td>
                <td>
                    <span class="badge ${getBadgeClass(poster.category)}">${escapeHtml(poster.category || 'EVENT')}</span>
                </td>
                <td>
                    <span class="text-muted">${formatDate(poster.createdAt)}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action-icon" onclick="window.editPoster('${poster.id}')" title="Edit Poster">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button class="btn-action-icon btn-action-delete" onclick="window.deletePosterPrompt('${poster.id}')" title="Hapus Poster">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Open Add Poster Modal
    btnAddPoster.addEventListener('click', () => {
        posterEditId.value = '';
        modalPosterHeading.textContent = 'Tambah Poster Baru';
        formPoster.reset();
        resetImagePreview(posterPreviewBox, posterPreviewImg, posterFileName);
        openModal(modalPoster);
    });

    // Global editPoster handler
    window.editPoster = function(id) {
        const poster = postersData.find(p => p.id === id);
        if (!poster) return;

        posterEditId.value = poster.id;
        modalPosterHeading.textContent = 'Edit Poster Foto';
        posterTitle.value = poster.title || '';
        posterCategory.value = poster.category || 'EVENT';
        posterDirectUrl.value = poster.imageUrl || '';
        posterDesc.value = poster.description || '';
        posterFile.value = '';

        if (poster.imageUrl) {
            showImagePreview(posterPreviewBox, posterPreviewImg, posterFileName, poster.imageUrl, 'Gambar Saat Ini');
        } else {
            resetImagePreview(posterPreviewBox, posterPreviewImg, posterFileName);
        }

        openModal(modalPoster);
    };

    // Global deletePosterPrompt
    window.deletePosterPrompt = function(id) {
        const poster = postersData.find(p => p.id === id);
        if (!poster) return;

        pendingDelete = {
            type: 'poster',
            id: poster.id,
            title: poster.title
        };

        deletePromptText.innerHTML = `Apakah Anda yakin ingin menghapus poster <strong>"${escapeHtml(poster.title)}"</strong> secara permanen?`;
        openModal(modalDelete);
    };

    // Save Poster Form
    formPoster.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = posterEditId.value;
        const btnSave = document.getElementById('btn-save-poster');
        btnSave.disabled = true;
        btnSave.textContent = 'Menyimpan...';

        const formData = new FormData();
        formData.append('title', posterTitle.value.trim());
        formData.append('category', posterCategory.value);
        formData.append('description', posterDesc.value.trim());
        formData.append('directImageUrl', posterDirectUrl.value.trim());

        if (posterFile.files && posterFile.files[0]) {
            const compressed = await compressImage(posterFile.files[0]);
            formData.append('image', compressed);
        }

        try {
            const url = id ? `/api/posters/${id}` : '/api/posters';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(id ? 'Poster berhasil diperbarui!' : 'Poster baru berhasil ditambahkan!', 'success');
                closeModal(modalPoster);
                await fetchPosters();
                await fetchStats();
            } else {
                showToast(data.message || 'Gagal menyimpan poster.', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan koneksi.', 'error');
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Simpan Poster';
        }
    });

    // ==========================================================================
    // ARTICLES MANAGEMENT
    // ==========================================================================
    async function fetchArticles() {
        try {
            const res = await fetch(`/api/articles?_t=${Date.now()}`, { cache: 'no-store' });
            articlesData = await res.json();
            renderArticlesTable();
        } catch (err) {
            showToast('Gagal memuat data artikel.', 'error');
        }
    }

    function renderArticlesTable() {
        if (!articlesData || articlesData.length === 0) {
            articlesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">Belum ada artikel. Klik tombol "Tulis Artikel Baru" untuk membuat.</td>
                </tr>
            `;
            return;
        }

        articlesTableBody.innerHTML = articlesData.map(article => `
            <tr>
                <td>
                    <img src="${escapeHtml(article.coverUrl)}" alt="${escapeHtml(article.title)}" class="table-thumb" onerror="this.src='asset/img/logo-3d.png'">
                </td>
                <td>
                    <div class="table-item-title">${escapeHtml(article.title)}</div>
                    <div class="table-item-desc">${escapeHtml(article.excerpt || article.content.slice(0, 100))}</div>
                </td>
                <td>
                    <span class="badge ${getBadgeClass(article.category)}">${escapeHtml(article.category || 'BERITA')}</span>
                </td>
                <td>
                    <span class="text-secondary">${escapeHtml(article.author || 'Ophelia Staff')}</span>
                </td>
                <td>
                    <span class="text-muted">${formatDate(article.createdAt)}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action-icon" onclick="window.editArticle('${article.id}')" title="Edit Artikel">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button class="btn-action-icon btn-action-delete" onclick="window.deleteArticlePrompt('${article.id}')" title="Hapus Artikel">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Open Add Article Modal
    btnAddArticle.addEventListener('click', () => {
        articleEditId.value = '';
        modalArticleHeading.textContent = 'Tulis Artikel Baru';
        formArticle.reset();
        articleAuthor.value = 'Developer Team';
        resetImagePreview(articlePreviewBox, articlePreviewImg, articleFileName);
        openModal(modalArticle);
    });

    // Global editArticle handler
    window.editArticle = function(id) {
        const article = articlesData.find(a => a.id === id);
        if (!article) return;

        articleEditId.value = article.id;
        modalArticleHeading.textContent = 'Edit Artikel & Berita';
        articleTitle.value = article.title || '';
        articleCategory.value = article.category || 'BERITA';
        articleAuthor.value = article.author || 'Ophelia Staff';
        articleDirectUrl.value = article.coverUrl || '';
        articleExcerpt.value = article.excerpt || '';
        articleContent.value = article.content || '';
        articleFile.value = '';

        if (article.coverUrl) {
            showImagePreview(articlePreviewBox, articlePreviewImg, articleFileName, article.coverUrl, 'Cover Saat Ini');
        } else {
            resetImagePreview(articlePreviewBox, articlePreviewImg, articleFileName);
        }

        openModal(modalArticle);
    };

    // Global deleteArticlePrompt
    window.deleteArticlePrompt = function(id) {
        const article = articlesData.find(a => a.id === id);
        if (!article) return;

        pendingDelete = {
            type: 'article',
            id: article.id,
            title: article.title
        };

        deletePromptText.innerHTML = `Apakah Anda yakin ingin menghapus artikel <strong>"${escapeHtml(article.title)}"</strong> secara permanen?`;
        openModal(modalDelete);
    };

    // Save Article Form
    formArticle.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = articleEditId.value;
        const btnSave = document.getElementById('btn-save-article');
        btnSave.disabled = true;
        btnSave.textContent = 'Menyimpan...';

        const formData = new FormData();
        formData.append('title', articleTitle.value.trim());
        formData.append('category', articleCategory.value);
        formData.append('author', articleAuthor.value.trim());
        formData.append('directCoverUrl', articleDirectUrl.value.trim());
        formData.append('excerpt', articleExcerpt.value.trim());
        formData.append('content', articleContent.value.trim());

        if (articleFile.files && articleFile.files[0]) {
            const compressed = await compressImage(articleFile.files[0]);
            formData.append('coverImage', compressed);
        }

        try {
            const url = id ? `/api/articles/${id}` : '/api/articles';
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(id ? 'Artikel berhasil diperbarui!' : 'Artikel baru berhasil dipublikasikan!', 'success');
                closeModal(modalArticle);
                await fetchArticles();
                await fetchStats();
            } else {
                showToast(data.message || 'Gagal menyimpan artikel.', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan koneksi.', 'error');
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Publikasikan Artikel';
        }
    });

    // ==========================================================================
    // DELETE CONFIRMATION HANDLER
    // ==========================================================================
    btnConfirmDelete.addEventListener('click', async () => {
        if (!pendingDelete.type || !pendingDelete.id) return;

        btnConfirmDelete.disabled = true;
        btnConfirmDelete.textContent = 'Menghapus...';

        try {
            const endpoint = pendingDelete.type === 'poster' 
                ? `/api/posters/${pendingDelete.id}` 
                : `/api/articles/${pendingDelete.id}`;

            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`${pendingDelete.type === 'poster' ? 'Poster' : 'Artikel'} berhasil dihapus!`, 'success');
                closeModal(modalDelete);
                if (pendingDelete.type === 'poster') {
                    await fetchPosters();
                } else {
                    await fetchArticles();
                }
                await fetchStats();
            } else {
                showToast(data.message || 'Gagal menghapus data.', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan saat menghapus data.', 'error');
        } finally {
            btnConfirmDelete.disabled = false;
            btnConfirmDelete.textContent = 'Hapus Sekarang';
            pendingDelete = { type: null, id: null, title: '' };
        }
    });

    btnCancelDelete.addEventListener('click', () => {
        closeModal(modalDelete);
        pendingDelete = { type: null, id: null, title: '' };
    });

    // ==========================================================================
    // FILE UPLOAD & PREVIEW LOGIC
    // ==========================================================================
    function setupFileUploader(fileInput, dropArea, fileNameEl, previewBox, previewImg, removeBtn) {
        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.remove('drag-over');
            });
        });

        dropArea.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect(fileInput.files[0], previewBox, previewImg, fileNameEl);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                handleFileSelect(fileInput.files[0], previewBox, previewImg, fileNameEl);
            }
        });

        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            resetImagePreview(previewBox, previewImg, fileNameEl);
        });
    }

    function handleFileSelect(file, previewBox, previewImg, fileNameEl) {
        if (!file.type.startsWith('image/')) {
            showToast('Silakan pilih file gambar yang valid (PNG, JPG, WEBP).', 'error');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            showToast('Ukuran file gambar maksimal 15MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            showImagePreview(previewBox, previewImg, fileNameEl, e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    }

    function showImagePreview(previewBox, previewImg, fileNameEl, src, label) {
        previewImg.src = src;
        previewBox.style.display = 'block';
        if (fileNameEl) fileNameEl.textContent = label;
    }

    function resetImagePreview(previewBox, previewImg, fileNameEl) {
        previewImg.src = '';
        previewBox.style.display = 'none';
        if (fileNameEl) fileNameEl.textContent = 'Maksimal 15MB';
    }

    // Bind uploaders
    setupFileUploader(posterFile, posterDropArea, posterFileName, posterPreviewBox, posterPreviewImg, posterRemovePreview);
    setupFileUploader(articleFile, articleDropArea, articleFileName, articlePreviewBox, articlePreviewImg, articleRemovePreview);

    // ==========================================================================
    // MODAL HELPERS & DISMISSALS
    // ==========================================================================
    function openModal(modal) {
        modal.classList.add('modal-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('modal-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Modal close listeners
    modalPosterClose.addEventListener('click', () => closeModal(modalPoster));
    modalPosterCancel.addEventListener('click', () => closeModal(modalPoster));
    modalPosterBackdrop.addEventListener('click', () => closeModal(modalPoster));

    modalArticleClose.addEventListener('click', () => closeModal(modalArticle));
    modalArticleCancel.addEventListener('click', () => closeModal(modalArticle));
    modalArticleBackdrop.addEventListener('click', () => closeModal(modalArticle));

    modalDeleteClose.addEventListener('click', () => closeModal(modalDelete));
    modalDeleteBackdrop.addEventListener('click', () => closeModal(modalDelete));

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalPoster.classList.contains('modal-active')) closeModal(modalPoster);
            if (modalArticle.classList.contains('modal-active')) closeModal(modalArticle);
            if (modalDelete.classList.contains('modal-active')) closeModal(modalDelete);
        }
    });

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================
    checkAuth();
});
