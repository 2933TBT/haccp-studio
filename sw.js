// HACCP Studio — Service Worker (offline support)
const CACHE_NAME = "haccp-studio-v3";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./icon.svg",
    "./manifest.json",
    "./js/app.js",
    "./js/wizard.js",
    "./js/principles.js",
    "./js/dashboard.js",
    "./js/render.js",
    "./js/rules.js",
    "./js/templates.js",
    "./js/export.js",
    "./js/samples.js",
    "./js/data.js",
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    const url = new URL(e.request.url);

    if (url.origin === location.origin) {
        // Cache-first for all same-origin assets
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(res => {
                    if (res && res.status === 200 && res.type !== "opaque") {
                        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
                    }
                    return res;
                });
            })
        );
    } else {
        // Network-first for CDN (fonts, xlsx) — cache on success, fallback on offline
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    if (res && res.status === 200) {
                        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
                    }
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
    }
});
