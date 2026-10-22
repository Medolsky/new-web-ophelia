/*
 * Early boot script (CSP-safe replacement for inline <script> and onerror="" handlers).
 * Loaded synchronously near the top of <body> so it runs before images and script.js.
 */
(function () {
    // Global image fallback: <img data-fallback="/path.png"> swaps to the fallback once on load error.
    // Image error events do not bubble, so listen in the capture phase.
    document.addEventListener('error', function (event) {
        var img = event.target;
        if (!img || img.tagName !== 'IMG') return;
        var fallback = img.getAttribute('data-fallback');
        if (!fallback) return;
        img.removeAttribute('data-fallback');
        img.src = fallback;
    }, true);

    // Emergency preloader release: ensures the website is never stuck if script is delayed or cached
    setTimeout(function () {
        var pl = document.getElementById('preloader');
        if (pl && !pl.classList.contains('hidden')) {
            pl.classList.add('hidden');
        }
    }, 2800);
})();
