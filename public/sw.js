// Starflect PWA Service Worker
// バージョン管理
const CACHE_VERSION = 'starflect-v1.0.2';
const CACHE_NAME = `starflect-cache-${CACHE_VERSION}`;

// キャッシュする静的リソース
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // アプリのコアファイルは動的に追加
];

// AI分析結果などの動的キャッシュ
const DYNAMIC_CACHE_NAME = `starflect-dynamic-${CACHE_VERSION}`;

// オフライン時のフォールバックページ
const OFFLINE_PAGE = '/offline.html';

// キャッシュ戦略の設定
const CACHE_STRATEGIES = {
  // 静的リソース: Cache First
  static: 'cache-first',
  // AI API: Network First (with cache fallback) 
  api: 'network-first',
  // 画像: Stale While Revalidate
  images: 'stale-while-revalidate'
};

// Service Worker のインストール
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: インストール開始');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: 静的リソースをキャッシュ中');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: インストール完了');
        // 新しいService Workerを即座に有効化
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: インストールエラー', error);
      })
  );
});

// Service Worker の有効化
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: 有効化開始');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 古いキャッシュを削除
              return cacheName.startsWith('starflect-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('🗑️ Service Worker: 古いキャッシュを削除', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: 有効化完了');
        // すべてのクライアントを即座にコントロール
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker: 有効化エラー', error);
      })
  );
});

// フェッチイベント（リクエストの処理）
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // HTTPSまたはlocalhostのみ処理
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // リクエストタイプ別のキャッシュ戦略
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// 静的リソースの判定
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.html') ||
         url.pathname === '/' ||
         url.pathname.includes('/assets/');
}

// APIリクエストの判定
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.hostname.includes('api.openai.com') ||
         url.pathname.includes('/api/') ||
         request.url.includes('api');
}

// 画像リクエストの判定  
function isImageRequest(request) {
  return request.destination === 'image' ||
         request.url.includes('.png') ||
         request.url.includes('.jpg') ||
         request.url.includes('.jpeg') ||
         request.url.includes('.gif') ||
         request.url.includes('.svg');
}

// 静的リソースの処理（Cache First）
async function handleStaticResource(request) {
  try {
    // まずキャッシュから探す
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 キャッシュから提供:', request.url);
      return cachedResponse;
    }
    
    // キャッシュにない場合はネットワークから取得
    const networkResponse = await fetch(request);
    
    // 成功したレスポンスをキャッシュに保存
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('💾 キャッシュに保存:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ 静的リソース取得エラー:', error);
    
    // オフライン時のフォールバック
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_PAGE);
      return offlineResponse || new Response('オフラインです', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    }
    
    throw error;
  }
}

// APIリクエストの処理（Network First）
async function handleAPIRequest(request) {
  try {
    // まずネットワークを試す
    const networkResponse = await fetch(request);
    
    // AIの分析結果をキャッシュ（GETリクエストのみ）
    if (request.method === 'GET' && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('🤖 AI分析結果をキャッシュ:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🔄 ネットワークエラー、キャッシュを確認:', error.message);
    
    // ネットワークエラー時はキャッシュから探す
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 キャッシュされたAI分析を提供:', request.url);
      return cachedResponse;
    }
    
    // AI API用のフォールバック応答
    if (request.url.includes('openai.com')) {
      return new Response(JSON.stringify({
        error: 'オフライン中です。過去の分析結果をご確認ください。',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// 画像リクエストの処理（Stale While Revalidate）
async function handleImageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // バックグラウンドで更新
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse); // ネットワークエラー時はキャッシュを返す
  
  // キャッシュがあればすぐに返す、なければネットワークを待つ  
  return cachedResponse || fetchPromise;
}

// その他のリクエストの処理
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // キャッシュにあるか確認
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // ナビゲーションリクエストの場合はオフラインページ
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE) || new Response('オフラインです', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// プッシュ通知の受信
self.addEventListener('push', (event) => {
  console.log('📢 プッシュ通知受信:', event);
  
  const options = {
    body: '今日の運勢をチェックしましょう！',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/?notification=today'
    },
    actions: [
      {
        action: 'open',
        title: '開く',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss', 
        title: '閉じる',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  // プッシュメッセージがある場合は使用
  if (event.data) {
    try {
      const pushData = event.data.json();
      options.body = pushData.body || options.body;
      options.data.url = pushData.url || options.data.url;
    } catch (error) {
      console.error('プッシュデータ解析エラー:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('✨ Starflect', options)
  );
});

// 通知クリックの処理
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 通知クリック:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // アプリを開く
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // 既に開いているタブがあれば、そこに移動
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      
      // 新しいタブでアプリを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// バックグラウンド同期（将来の機能拡張用）
self.addEventListener('sync', (event) => {
  console.log('🔄 バックグラウンド同期:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 同期処理をここに実装
      syncData()
    );
  }
});

// データ同期処理（将来の実装用）
async function syncData() {
  try {
    // オフライン中に蓄積されたデータの同期処理
    console.log('📡 データ同期開始');
    
    // 実装例：
    // - 占い結果の送信
    // - ユーザー設定の同期
    // - 分析結果のアップロード
    
    console.log('✅ データ同期完了');
  } catch (error) {
    console.error('❌ データ同期エラー:', error);
  }
}

// Service Worker のアップデート通知
self.addEventListener('message', (event) => {
  console.log('💬 メッセージ受信:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('🚀 Starflect Service Worker 読み込み完了:', CACHE_VERSION); 