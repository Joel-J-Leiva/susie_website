/*
 * Susie's Stories: shared page behaviour.
 * Loaded with `defer`, so the DOM is parsed before this runs.
 * Everything here is progressive enhancement: if the script fails,
 * all content stays visible and links keep working.
 */
(() => {
    'use strict';

    const EMAIL = 'berubes@kean.edu';
    const TOAST_ID = 'emailToast';
    const TOAST_HIDDEN = ['translate-y-20', 'opacity-0'];
    const TOAST_DURATION_MS = 3000;
    const COPY_TRIGGER_IDS = ['copyMailBtn', 'footerContactBtn', 'getInTouchBtn'];
    const REVEAL_STAGGER_MS = 70;
    const REVEAL_STAGGER_STEPS = 6;
    const NAV_SCROLL_THRESHOLD = 8;

    /* ---------- Email copy + toast ---------- */

    let toastTimer = 0;

    function getToast() {
        let toast = document.getElementById(TOAST_ID);
        if (!toast) {
            toast = document.createElement('div');
            toast.id = TOAST_ID;
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-on-surface text-white px-6 py-3 rounded-full font-sans text-sm uppercase tracking-widest font-bold transition-[transform,opacity] duration-300 transform translate-y-20 opacity-0 z-50 shadow-xl pointer-events-none';
            document.body.appendChild(toast);
        }
        return toast;
    }

    function showToast() {
        const toast = getToast();
        window.clearTimeout(toastTimer);
        // Set the text on every show so screen readers announce it each time.
        toast.textContent = 'Email copied!';
        toast.classList.remove(...TOAST_HIDDEN);
        toastTimer = window.setTimeout(() => {
            toast.classList.add(...TOAST_HIDDEN);
            toast.textContent = '';
        }, TOAST_DURATION_MS);
    }

    function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus({ preventScroll: true });
        textArea.select();
        try {
            if (document.execCommand('copy')) showToast();
        } catch (err) {
            console.warn('Unable to copy email address', err);
        } finally {
            textArea.remove();
        }
    }

    function copyEmail() {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(EMAIL).then(showToast, () => fallbackCopy(EMAIL));
        } else {
            fallbackCopy(EMAIL);
        }
    }

    function initEmailCopy() {
        getToast();
        COPY_TRIGGER_IDS.forEach((id) => {
            document.getElementById(id)?.addEventListener('click', copyEmail);
        });
    }

    /* ---------- Mobile menu ---------- */

    function initMobileMenu() {
        const button = document.getElementById('mobileMenuBtn');
        const menu = document.getElementById('mobileMenu');
        if (!button || !menu) return;

        const isOpen = () => menu.classList.contains('is-open');

        function setOpen(open) {
            menu.classList.toggle('is-open', open);
            button.setAttribute('aria-expanded', String(open));
            button.textContent = open ? 'close' : 'menu';
        }

        button.addEventListener('click', () => setOpen(!isOpen()));

        menu.addEventListener('click', (event) => {
            if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen()) {
                setOpen(false);
                button.focus();
            }
        });
    }

    /* ---------- Scroll reveal ---------- */

    function initReveal() {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        document.querySelectorAll('[data-reveal-stagger]').forEach((container) => {
            Array.from(container.children).forEach((child, index) => {
                const delay = (index % REVEAL_STAGGER_STEPS) * REVEAL_STAGGER_MS;
                child.style.setProperty('--reveal-delay', `${delay}ms`);
            });
        });

        // Anything already on screen is shown before hiding is switched on, so it never flashes.
        const pending = [];
        // Elements hidden by a filter have no box yet; they stay observed and reveal when shown.
        document.querySelectorAll('[data-reveal]').forEach((el) => {
            if (el.getClientRects().length && el.getBoundingClientRect().top < window.innerHeight) {
                el.classList.add('is-visible');
            } else {
                pending.push(el);
            }
        });

        document.documentElement.classList.add('motion-ready');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

        pending.forEach((el) => observer.observe(el));
    }

    /* ---------- Gallery filter (photography.html) ---------- */

    function initGalleryFilter() {
        const bar = document.querySelector('.gallery-filters');
        const grid = document.querySelector('.masonry-grid');
        if (!bar || !grid) return;

        const buttons = Array.from(bar.querySelectorAll('button[data-filter]'));
        const items = Array.from(grid.querySelectorAll(':scope > [data-tags]'));
        const known = new Set(buttons.map((b) => b.dataset.filter));

        function apply(tag) {
            buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === tag)));
            items.forEach((item) => {
                item.hidden = tag !== 'all' && !item.dataset.tags.split(' ').includes(tag);
            });
        }

        bar.addEventListener('click', (event) => {
            const button = event.target instanceof Element ? event.target.closest('button[data-filter]') : null;
            if (!button) return;
            const tag = button.dataset.filter;
            apply(tag);
            history.replaceState(null, '', tag === 'all' ? location.pathname + location.search : '#tag=' + tag);
        });

        // Only tags that have a button are accepted; anything else shows all photos.
        function applyHash() {
            const match = /^#tag=([a-z-]+)$/.exec(location.hash);
            apply(match && known.has(match[1]) ? match[1] : 'all');
        }

        window.addEventListener('hashchange', applyHash);
        applyHash();
    }

    /* ---------- Nav shadow ---------- */

    function initNavShadow() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        let ticking = false;
        const update = () => {
            nav.classList.toggle('nav-scrolled', window.scrollY > NAV_SCROLL_THRESHOLD);
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        update();
    }

    initEmailCopy();
    initMobileMenu();
    initGalleryFilter(); // before reveal, so a #tag= filter is in place when on-screen items are measured
    initReveal();
    initNavShadow();
})();
