/* ========================================
   OPHELIA ROLEPLAY - JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Preloader ----
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 2200);
    });

    // Fallback: hide preloader after 4 seconds max
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 4000);

    // ---- Cursor Glow ----
    const cursorGlow = document.getElementById('cursor-glow');
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.08;
        cursorY += (mouseY - cursorY) * 0.08;
        cursorGlow.style.left = cursorX + 'px';
        cursorGlow.style.top = cursorY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hide cursor glow on mobile
    if ('ontouchstart' in window) {
        cursorGlow.style.display = 'none';
    }

    // ---- Navbar ----
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        // Navbar background
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active section highlighting
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 200;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });

    // ---- Hamburger & Mobile Menu ----
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    function closeMobileMenu() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // ---- Hero Background Slideshow ----
    const heroBg = document.getElementById('hero-bg-slideshow');
    // Slideshow disabled when placeholder asset files are not uploaded yet
    if (heroBg) {
        heroBg.style.opacity = '1';
    }

    // ---- Particles ----
    const particlesContainer = document.getElementById('particles');
    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 3 + 1) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
        particle.style.animationDelay = Math.random() * 4 + 's';
        particle.style.opacity = Math.random() * 0.6 + 0.2;
        particlesContainer.appendChild(particle);

        // Remove after animation
        setTimeout(() => {
            particle.remove();
        }, 15000);
    }

    // Initial particles
    for (let i = 0; i < 30; i++) {
        setTimeout(createParticle, i * 200);
    }

    // Continuous particle creation
    setInterval(createParticle, 500);

    // ---- Stat Counter Animation ----
    const statNumbers = document.querySelectorAll('.stat-number');
    let statAnimating = false;

    function animateStats() {
        if (statAnimating) return;
        statAnimating = true;

        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000;
            const startTime = performance.now();

            function updateStat(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                stat.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(updateStat);
                } else {
                    stat.textContent = target;
                    statAnimating = false;
                }
            }

            requestAnimationFrame(updateStat);
        });
    }

    function resetStats() {
        statAnimating = false;
        statNumbers.forEach(stat => {
            stat.textContent = '0';
        });
    }

    // Trigger stat animation when hero is in view, reset when out
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(animateStats, 500);
            } else {
                resetStats();
            }
        });
    }, { threshold: 0.2 });

    const heroSection = document.getElementById('home');
    if (heroSection) heroObserver.observe(heroSection);



    // ---- Scroll Animations (reset on scroll away) ----
    const animateElements = document.querySelectorAll('[data-animate]');

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, parseInt(delay));
            } else {
                entry.target.classList.remove('animated');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => scrollObserver.observe(el));

    // Feature cards animation (reset on scroll away)
    const featureCards = document.querySelectorAll('.feature-card');
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, parseInt(delay));
            } else {
                entry.target.classList.remove('animated');
            }
        });
    }, { threshold: 0.15 });

    featureCards.forEach(card => {
        card.setAttribute('data-animate', 'fade-up');
        featureObserver.observe(card);
    });

    // ---- Tilt Effect on Feature Cards ----
    featureCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -5;
            const rotateY = (x - centerX) / centerX * 5;

            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ---- Parallax on scroll for hero ----
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollY < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
            heroContent.style.opacity = 1 - (scrollY / window.innerHeight * 1.2);
        }
    });



    // ---- Text reveal for join section (reset on scroll away) ----
    const joinSection = document.getElementById('join');
    const joinObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelector('.join-content')?.classList.add('animated');
            } else {
                entry.target.querySelector('.join-content')?.classList.remove('animated');
            }
        });
    }, { threshold: 0.2 });

    if (joinSection) joinObserver.observe(joinSection);

    // ---- Magnetic Buttons ----
    document.querySelectorAll('.btn-xl, .btn-lg').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ---- Team Category Filter ----
    const filterBtns = document.querySelectorAll('.team-filter-btn');
    const deptCards = document.querySelectorAll('.dept-card');

    if (filterBtns.length > 0 && deptCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetFilter = btn.getAttribute('data-filter');

                deptCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (targetFilter === 'all' || category === targetFilter) {
                        card.style.display = 'flex';
                        card.classList.add('animated');
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // ---- Media & Publication (Posters & Articles) ----
    const mediaGrid = document.getElementById('media-grid');
    const mediaFilterBtns = document.querySelectorAll('.media-filter-btn');
    const posterModal = document.getElementById('poster-modal');
    const articleModal = document.getElementById('article-modal');

    // Default Seed Data in case network fetch is delayed or offline
    const defaultPosters = [
        {
            id: 'poster_1',
            title: 'Grand Launching Ophelia City',
            description: 'Poster resmi peresmian kota Ophelia Roleplay dengan sistem custom dan ekonomi stabil.',
            imageUrl: 'asset/img/logo-3d.png',
            category: 'EVENT',
            createdAt: '2026-09-25T02:37:59.788Z'
        },
        {
            id: 'poster_2',
            title: 'Open Recruitment: Polisi & EMS',
            description: 'Pendaftaran terbuka instansi kepolisian dan medis kota Ophelia Roleplay.',
            imageUrl: 'asset/img/logo-kota.png',
            category: 'RECRUITMENT',
            createdAt: '2026-09-26T02:37:59.788Z'
        },
        {
            id: 'poster_3',
            title: 'Car Meet & Drift Championship',
            description: 'Kompetisi modifikasi mobil dan adu kecepatan di Los Santos Airport.',
            imageUrl: 'asset/img/logo-3d.png',
            category: 'COMMUNITY',
            createdAt: '2026-09-27T02:37:59.788Z'
        }
    ];

    const defaultArticles = [
        {
            id: 'article_1',
            title: 'Pembaruan Fitur Framework v2.4 & Optimalisasi FPS Kota',
            category: 'PATCH NOTES',
            author: 'Developer Team',
            coverUrl: 'asset/img/logo-3d.png',
            excerpt: 'Simak rangkuman pembaharuan script custom pekerjaan, optimalisasi handling mobil, dan peningkatan kestabilan server.',
            content: 'Warga Ophelia Roleplay yang terhormat,\n\nKami dengan bangga merilis pembaruan v2.4 yang difokuskan pada peningkatan performa dan kenyamanan bermain:\n\n1. Optimalisasi Script Core: Pengurangan lag spike dan latensi FiveM hingga 35%.\n2. Modifikasi Kendaraan: Penyeimbangan handling mobil sport, SUV dinas kepolisian, dan ambulans.\n3. Fitur Pekerjaan Baru: Penambahan variasi pekerjaan legal dan perluasan interaksi pedagang pasar.\n4. Sistem Keamanan Kota: Pengetatan integrasi Anti-Cheat dan proteksi cyber kota.\n\nSelamat menikmati petualangan roleplay yang lebih imersif dan kompetitif di Ophelia!',
            createdAt: '2026-09-25T02:37:59.788Z'
        },
        {
            id: 'article_2',
            title: 'Panduan Menjadi Warga Baru & Aturan Roleplay Ophelia',
            category: 'GUIDE',
            author: 'Head Admin',
            coverUrl: 'asset/img/logo-kota.png',
            excerpt: 'Panduan lengkap seputar etika roleplay, istilah penting (FailRP, VDM, RDM), dan tata tertib hidup di kota Ophelia.',
            content: 'Bagi seluruh pendatang baru di Ophelia Roleplay, perhatikan prinsip utama dalam menjaga kualitas cerita roleplay bersama:\n\n- Hormati Value of Life: Selalu hargai nyawa karakter Anda dalam setiap skenario kejahatan maupun kecelakaan.\n- No Random Death Match (RDM) & Vehicle Death Match (VDM): Dilarang melukai atau menabrak warga tanpa latar belakang roleplay yang jelas.\n- Menghormati Instansi: Hormati petugas kepolisian dan paramedis saat bertugas di TKP.\n\nCiptakan jalan cerita yang unik dan bangun reputasi karaktermu bersama komunitas kami!',
            createdAt: '2026-09-26T02:37:59.788Z'
        },
        {
            id: 'article_3',
            title: 'Event Komunitas: Turnamen Underground & Pasar Malam',
            category: 'EVENT',
            author: 'Kreatif Team',
            coverUrl: 'asset/img/logo-3d.png',
            excerpt: 'Bersiaplah untuk festival akhir pekan dengan hadiah ratusan juta rupiah uang in-game dan gelar juara kota.',
            content: 'Malam minggu ini Ophelia akan menggelar rangkaian event meriah:\n\n- Drag Race Championship di runway Sandy Shores.\n- Bazar Pedagang Kaki Lima di pusat kota dengan diskon makanan & merchandise khusus.\n- Konser musik live di Diamond Casino Roof.\n\nPastikan Anda mendaftarkan tim dan kendaraan terbaik Anda melalui Discord resmi Ophelia Roleplay!',
            createdAt: '2026-09-27T02:37:59.788Z'
        }
    ];

    let allMediaItems = [];

    async function loadMediaContent() {
        if (!mediaGrid) return;

        // Render defaults immediately first so user never sees blank space
        setAndRenderMedia(defaultPosters, defaultArticles);

        try {
            const [postersRes, articlesRes] = await Promise.all([
                fetch('/api/posters').then(r => r.ok ? r.json() : []).catch(() => []),
                fetch('/api/articles').then(r => r.ok ? r.json() : []).catch(() => [])
            ]);

            const posters = Array.isArray(postersRes) && postersRes.length > 0 ? postersRes : defaultPosters;
            const articles = Array.isArray(articlesRes) && articlesRes.length > 0 ? articlesRes : defaultArticles;

            setAndRenderMedia(posters, articles);
        } catch (err) {
            console.warn('[Ophelia Media] Using default media:', err);
        }
    }

    function setAndRenderMedia(posters, articles) {
        allMediaItems = [
            ...posters.map(p => ({ ...p, type: 'poster' })),
            ...articles.map(a => ({ ...a, type: 'article' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const activeBtn = document.querySelector('.media-filter-btn.active');
        const currentFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
        renderMediaGrid(currentFilter);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function renderMediaGrid(filter) {
        if (!mediaGrid) return;
        mediaGrid.innerHTML = '';

        const filtered = allMediaItems.filter(item => filter === 'all' || item.type === filter);

        if (filtered.length === 0) {
            mediaGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 16px;">
                    <p style="color: var(--text-muted); font-size: 15px;">Belum ada konten publikasi untuk kategori ini.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            if (item.type === 'poster') {
                const card = document.createElement('div');
                card.className = 'poster-card';
                card.innerHTML = `
                    <div class="poster-img-wrap">
                        <img src="${item.imageUrl || 'asset/img/logo-3d.png'}" alt="${item.title}" class="poster-img" loading="lazy" onerror="this.onerror=null;this.src='asset/img/logo-3d.png';">
                        <div class="poster-overlay">
                            <div class="poster-top-bar">
                                <span class="media-tag">${item.category || 'EVENT'}</span>
                                <div class="poster-zoom-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                </div>
                            </div>
                            <div class="poster-bottom-info">
                                <h3 class="poster-title">${item.title}</h3>
                                <span class="poster-meta">${formatDate(item.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => openPosterModal(item));
                mediaGrid.appendChild(card);
            } else if (item.type === 'article') {
                const card = document.createElement('div');
                card.className = 'article-card';
                card.innerHTML = `
                    <div class="article-cover-wrap">
                        <img src="${item.coverUrl || 'asset/img/logo-3d.png'}" alt="${item.title}" class="article-cover" loading="lazy" onerror="this.onerror=null;this.src='asset/img/logo-3d.png';">
                    </div>
                    <div class="article-body">
                        <div class="article-meta-row">
                            <span class="media-tag tag-article">${item.category || 'BERITA'}</span>
                            <span class="article-date">${formatDate(item.createdAt)}</span>
                        </div>
                        <h3 class="article-title">${item.title}</h3>
                        <p class="article-excerpt">${item.excerpt || ''}</p>
                        <div class="article-btn-read">
                            <span>Baca Selengkapnya</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => openArticleModal(item));
                mediaGrid.appendChild(card);
            }
        });
    }

    // Filter Buttons
    if (mediaFilterBtns.length > 0) {
        mediaFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                mediaFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');
                renderMediaGrid(filter);
            });
        });
    }

    function openPosterModal(poster) {
        if (!posterModal) return;
        const posterImg = document.getElementById('poster-modal-img');
        posterImg.onerror = function() { this.src = 'asset/img/logo-3d.png'; };
        posterImg.src = poster.imageUrl || 'asset/img/logo-3d.png';
        document.getElementById('poster-modal-tag').textContent = poster.category || 'EVENT';
        document.getElementById('poster-modal-title').textContent = poster.title;
        document.getElementById('poster-modal-desc').textContent = poster.description || '';
        document.getElementById('poster-modal-date').textContent = formatDate(poster.createdAt);

        posterModal.classList.add('active');
        posterModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closePosterModal() {
        if (!posterModal) return;
        posterModal.classList.remove('active');
        posterModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openArticleModal(article) {
        if (!articleModal) return;
        document.getElementById('article-modal-tag').textContent = article.category || 'BERITA';
        document.getElementById('article-modal-date').textContent = formatDate(article.createdAt);
        document.getElementById('article-modal-author').textContent = article.author ? `Penulis: ${article.author}` : '';
        document.getElementById('article-modal-title').textContent = article.title;
        const articleCover = document.getElementById('article-modal-cover');
        articleCover.onerror = function() { this.src = 'asset/img/logo-3d.png'; };
        articleCover.src = article.coverUrl || 'asset/img/logo-3d.png';
        document.getElementById('article-modal-body').textContent = article.content || article.excerpt || '';

        articleModal.classList.add('active');
        articleModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeArticleModal() {
        if (!articleModal) return;
        articleModal.classList.remove('active');
        articleModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Close handlers
    document.getElementById('poster-modal-close')?.addEventListener('click', closePosterModal);
    document.getElementById('poster-modal-backdrop')?.addEventListener('click', closePosterModal);
    document.getElementById('article-modal-close')?.addEventListener('click', closeArticleModal);
    document.getElementById('article-modal-backdrop')?.addEventListener('click', closeArticleModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePosterModal();
            closeArticleModal();
        }
    });

    // ---- Live CFX Server Status & Player Counter ----
    const navStatusDot = document.getElementById('nav-status-dot');
    const navPlayerCount = document.getElementById('nav-player-count');
    const heroStatusDot = document.getElementById('hero-status-dot');
    const heroLiveText = document.getElementById('hero-live-text');
    const livePlayerCount = document.getElementById('live-player-count');

    async function fetchLiveServerStatus() {
        try {
            const res = await fetch('/api/server-status');
            const data = await res.json();

            if (data.online) {
                const clients = typeof data.clients === 'number' ? data.clients : 0;
                const maxClients = data.maxClients || 1000;

                if (navPlayerCount) {
                    navPlayerCount.textContent = `${clients} / ${maxClients} PLAYERS`;
                }
                if (navStatusDot) navStatusDot.classList.remove('offline');
                if (heroStatusDot) heroStatusDot.classList.remove('offline');
                if (heroLiveText) {
                    heroLiveText.innerHTML = `CFX SERVER ONLINE &bull; ${clients} / ${maxClients} PLAYERS`;
                }
                if (livePlayerCount) {
                    livePlayerCount.setAttribute('data-target', clients);
                    livePlayerCount.textContent = clients;
                }
            } else {
                if (navPlayerCount) navPlayerCount.textContent = 'OFFLINE';
                if (navStatusDot) navStatusDot.classList.add('offline');
                if (heroStatusDot) heroStatusDot.classList.add('offline');
                if (heroLiveText) {
                    heroLiveText.innerHTML = `CFX SERVER MAINTENANCE / OFFLINE`;
                }
                if (livePlayerCount) {
                    livePlayerCount.setAttribute('data-target', 0);
                    livePlayerCount.textContent = '0';
                }
            }
        } catch (err) {
            console.warn('[CFX Status Fetch Error]:', err);
        }
    }

    // Initial fetch & recurring polling every 15 seconds
    fetchLiveServerStatus();
    setInterval(fetchLiveServerStatus, 15000);

    loadMediaContent();

    console.log('%c OPHELIA ROLEPLAY ', 'background: #B91C1C; color: white; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 4px;');
    console.log('%c Website by Ophelia Dev Team ', 'color: #A3A3A3; font-size: 12px;');
});
