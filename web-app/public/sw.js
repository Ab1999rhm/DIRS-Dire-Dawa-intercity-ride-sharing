const CACHE_NAME = 'dirs-v2';
const STATIC_CACHE = 'dirs-static-v2';
const API_CACHE = 'dirs-api-v2';
const IMAGE_CACHE = 'dirs-images-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== STATIC_CACHE && name !== API_CACHE && name !== IMAGE_CACHE) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network first, cache fallback
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Images - cache first
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Static assets - cache first
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation - network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirst(request));
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network first with API cache
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline JSON response for API calls
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'You are offline. Your request will be sent when connection is restored.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network first with offline page
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Show offline page
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ride-requests') {
    event.waitUntil(syncRideRequests());
  }
  if (event.tag === 'sync-location-updates') {
    event.waitUntil(syncLocationUpdates());
  }
  if (event.tag === 'sync-ratings') {
    event.waitUntil(syncRatings());
  }
});

// Sync queued ride requests
async function syncRideRequests() {
  const db = await openDB();
  const tx = db.transaction('pendingRides', 'readwrite');
  const store = tx.objectStore('pendingRides');
  const requests = await getAllFromStore(store);

  for (const request of requests) {
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data)
      });

      if (response.ok) {
        store.delete(request.id);
        const responseData = await response.json();
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({
            type: 'RIDE_SYNCED',
            id: request.id,
            data: responseData
          });
        }
      }
    } catch (err) {
      console.log('Sync failed, will retry:', err);
    }
  }
}

// Sync queued location updates
async function syncLocationUpdates() {
  const db = await openDB();
  const tx = db.transaction('pendingLocations', 'readwrite');
  const store = tx.objectStore('pendingLocations');
  const updates = await getAllFromStore(store);

  for (const update of updates) {
    try {
      await fetch('/api/auth/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update.data)
      });
      store.delete(update.id);
    } catch {}
  }
}

// Sync queued ratings
async function syncRatings() {
  const db = await openDB();
  const tx = db.transaction('pendingRatings', 'readwrite');
  const store = tx.objectStore('pendingRatings');
  const ratings = await getAllFromStore(store);

  for (const rating of ratings) {
    try {
      await fetch(`/api/ratings/trip/${rating.tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating.data)
      });
      store.delete(rating.id);
    } catch {}
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dirs-offline', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pendingRides')) {
        db.createObjectStore('pendingRides', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingLocations')) {
        db.createObjectStore('pendingLocations', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingRatings')) {
        db.createObjectStore('pendingRatings', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cachedTrips')) {
        db.createObjectStore('cachedTrips', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('cachedUser')) {
        db.createObjectStore('cachedUser', { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New update from DIRS',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'dirs-notification',
    renotify: true,
    data: data.url || '/',
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DIRS', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_USER_DATA') {
    cacheUserData(event.data.payload);
  }
  if (event.data.type === 'CACHE_TRIPS') {
    cacheTrips(event.data.payload);
  }
  if (event.data.type === 'QUEUE_RIDE') {
    queueRideRequest(event.data.payload);
  }
  if (event.data.type === 'QUEUE_LOCATION') {
    queueLocationUpdate(event.data.payload);
  }
  if (event.data.type === 'QUEUE_RATING') {
    queueRating(event.data.payload);
  }
});

async function cacheUserData(data) {
  const db = await openDB();
  const tx = db.transaction('cachedUser', 'readwrite');
  tx.objectStore('cachedUser').put({ key: 'user', ...data });
}

async function cacheTrips(trips) {
  const db = await openDB();
  const tx = db.transaction('cachedTrips', 'readwrite');
  const store = tx.objectStore('cachedTrips');
  for (const trip of trips) {
    store.put(trip);
  }
}

async function queueRideRequest(data) {
  const db = await openDB();
  const tx = db.transaction('pendingRides', 'readwrite');
  tx.objectStore('pendingRides').add({ data, timestamp: Date.now() });
}

async function queueLocationUpdate(data) {
  const db = await openDB();
  const tx = db.transaction('pendingLocations', 'readwrite');
  tx.objectStore('pendingLocations').add({ data, timestamp: Date.now() });
}

async function queueRating(data) {
  const db = await openDB();
  const tx = db.transaction('pendingRatings', 'readwrite');
  tx.objectStore('pendingRatings').add({ data, timestamp: Date.now() });
}
