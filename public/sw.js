// Starflect PWA Service Worker (CLEANUP MODE)
// このファイルは古いキャッシュを強制消去し、すべてのリクエストをネットワークに直接送るようにします。

const CACHE_NAME = 'starflect-cache-v-cleanup';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ 強制クリーンアップ: キャッシュを削除', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('🚀 キャッシュクリア完了。ネットワーク直通モードです。');
      return self.clients.claim();
    })
  );
});

// キャッシュを一切使わず、すべてネットワークから取得
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
