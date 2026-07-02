// バージョンを更新 → 古いキャッシュを自動破棄、prefecture.htmlを含む全HTMLを刷新
const CACHE = 'kanto-gourmet-v13';
const STATIC = ['./', './index.html', './style.css', './script.js', './data.js', './prefecture.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => { })));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (!url.origin.includes(self.location.hostname)) return;

  const isHtml = e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html');

  if (isHtml) {
    // HTMLファイルはNetwork-first戦略: 常に最新を取得、失敗時のみキャッシュ
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic' && e.request.url.startsWith('http')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone).catch(err => console.warn('Cache put err:', err)));
        }
        return res;
      }).catch(() => caches.match(e.request).then(cached => {
        if (cached) return cached;
        return new Response('Network error and no cache available', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }))
    );
    return;
  }

  // CSS/JS/画像: Cache-first戦略
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && res.type === 'basic' && e.request.url.startsWith('http')) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone).catch(err => console.warn('Cache put err:', err)));
      }
      return res;
    }).catch(() => new Response('', { status: 503 })))
  );
});