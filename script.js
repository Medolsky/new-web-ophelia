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
    const bgImages = [];
    for (let i = 1; i <= 19; i++) {
        bgImages.push(`asset/img/${i}.png`);
    }

    let currentBgIndex = 0;

    // Preload first image
    const firstImg = new Image();
    firstImg.src = bgImages[0];
    firstImg.onload = () => {
        heroBg.style.backgroundImage = `url('${bgImages[0]}')`;
    };

    function nextBg() {
        currentBgIndex = (currentBgIndex + 1) % bgImages.length;
        // Preload next image
        const img = new Image();
        img.src = bgImages[currentBgIndex];
        img.onload = () => {
            heroBg.style.opacity = '0';
            setTimeout(() => {
                heroBg.style.backgroundImage = `url('${bgImages[currentBgIndex]}')`;
                heroBg.style.opacity = '1';
            }, 800);
        };
    }

    setInterval(nextBg, 6000);

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

    // ---- Gallery ----
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryImages = [];
    for (let i = 1; i <= 19; i++) {
        galleryImages.push({
            src: `asset/img/${i}.png`,
            alt: `Ophelia Roleplay Screenshot ${i}`
        });
    }

    galleryImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('data-index', index);
        item.innerHTML = `
            <img src="${img.src}" alt="${img.alt}" loading="lazy">
            <div class="gallery-item-overlay"></div>
            <div class="gallery-item-frame"></div>
            <div class="gallery-zoom-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
            </div>
            <div class="gallery-corner tl"></div>
            <div class="gallery-corner tr"></div>
            <div class="gallery-corner bl"></div>
            <div class="gallery-corner br"></div>
        `;
        galleryGrid.appendChild(item);

        // Click to open lightbox
        item.addEventListener('click', () => openLightbox(index));
    });

    // Animate gallery items on scroll - reset when scrolling away
    const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 60);
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.gallery-item').forEach(item => {
        galleryObserver.observe(item);
    });

    // ---- Lightbox ----
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    let currentLightboxIndex = 0;

    function openLightbox(index) {
        currentLightboxIndex = index;
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateLightbox() {
        lightboxImg.src = galleryImages[currentLightboxIndex].src;
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${galleryImages.length}`;
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightbox();
    });

    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
        updateLightbox();
    });

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
            currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
            updateLightbox();
        }
        if (e.key === 'ArrowRight') {
            currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
            updateLightbox();
        }
    });

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

    // ---- Touch Swipe for Lightbox ----
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
            } else {
                currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
            }
            updateLightbox();
        }
    }, { passive: true });

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

    console.log('%c OPHELIA ROLEPLAY ', 'background: #B91C1C; color: white; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 4px;');
    console.log('%c Website by Ophelia Dev Team ', 'color: #A3A3A3; font-size: 12px;');
});
