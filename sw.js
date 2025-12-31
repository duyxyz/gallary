const CACHE_NAME = 'duyxyz-v1';
const TOTAL_IMAGES = 100;

// Danh sách file cần cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Thêm tất cả ảnh vào danh sách cache
for (let i = 1; i <= TOTAL_IMAGES; i++) {
  urlsToCache.push(`/picture/${i}.webp`);
}

// Cài đặt Service Worker và cache tất cả files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Kích hoạt ngay
  );
});

// Kích hoạt và xóa cache cũ
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý requests - Cache First Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Trả về cache nếu có
        if (response) {
          return response;
        }
        
        // Nếu không có trong cache, fetch từ mạng
        return fetch(event.request)
          .then(response => {
            // Kiểm tra response hợp lệ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response để cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Nếu offline và không có cache, trả về trang lỗi
            return new Response('Offline - Không thể tải nội dung', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});