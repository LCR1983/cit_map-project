// バージョンを更新 → 古いキャッシュを自動破棄、prefecture.htmlを含む全HTMLを刷新
const CACHE = 'kanto-gourmet-v11';
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
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // CSS/JS/画像: Cache-first戦略
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && res.type === 'basic' && e.request.url.startsWith(self.location.origin)) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => { }))
  );
});