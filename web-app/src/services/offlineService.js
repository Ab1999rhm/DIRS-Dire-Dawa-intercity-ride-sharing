const DB_NAME = 'dirs-offline';
const DB_VERSION = 1;

class OfflineService {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

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
        if (!db.objectStoreNames.contains('cachedPayments')) {
          db.createObjectStore('cachedPayments', { keyPath: '_id' });
        }
        if (!db.objectStoreNames.contains('cachedNotifications')) {
          db.createObjectStore('cachedNotifications', { keyPath: '_id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getDB() {
    if (this.db) return this.db;
    return this.init();
  }

  // Queue operations
  async queueRide(rideData) {
    const db = await this.getDB();
    const tx = db.transaction('pendingRides', 'readwrite');
    tx.objectStore('pendingRides').add({
      data: rideData,
      timestamp: Date.now()
    });

    // Register background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-ride-requests');
    }
  }

  async queueLocationUpdate(locationData) {
    const db = await this.getDB();
    const tx = db.transaction('pendingLocations', 'readwrite');
    tx.objectStore('pendingLocations').add({
      data: locationData,
      timestamp: Date.now()
    });

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-location-updates');
    }
  }

  async queueRating(tripId, ratingData) {
    const db = await this.getDB();
    const tx = db.transaction('pendingRatings', 'readwrite');
    tx.objectStore('pendingRatings').add({
      tripId,
      data: ratingData,
      timestamp: Date.now()
    });

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-ratings');
    }
  }

  // Cache operations
  async cacheUser(userData) {
    const db = await this.getDB();
    const tx = db.transaction('cachedUser', 'readwrite');
    tx.objectStore('cachedUser').put({ key: 'user', ...userData });

    // Also send to service worker
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_USER_DATA',
        payload: userData
      });
    }
  }

  async getCachedUser() {
    const db = await this.getDB();
    const tx = db.transaction('cachedUser', 'readonly');
    const store = tx.objectStore('cachedUser');
    return new Promise((resolve, reject) => {
      const req = store.get('user');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async cacheTrips(trips) {
    const db = await this.getDB();
    const tx = db.transaction('cachedTrips', 'readwrite');
    const store = tx.objectStore('cachedTrips');
    for (const trip of trips) {
      store.put(trip);
    }

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_TRIPS',
        payload: trips
      });
    }
  }

  async getCachedTrips() {
    const db = await this.getDB();
    const tx = db.transaction('cachedTrips', 'readonly');
    const store = tx.objectStore('cachedTrips');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async cachePayments(payments) {
    const db = await this.getDB();
    const tx = db.transaction('cachedPayments', 'readwrite');
    const store = tx.objectStore('cachedPayments');
    for (const payment of payments) {
      store.put(payment);
    }
  }

  async getCachedPayments() {
    const db = await this.getDB();
    const tx = db.transaction('cachedPayments', 'readonly');
    const store = tx.objectStore('cachedPayments');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async cacheNotifications(notifications) {
    const db = await this.getDB();
    const tx = db.transaction('cachedNotifications', 'readwrite');
    const store = tx.objectStore('cachedNotifications');
    for (const notif of notifications) {
      store.put(notif);
    }
  }

  async getCachedNotifications() {
    const db = await this.getDB();
    const tx = db.transaction('cachedNotifications', 'readonly');
    const store = tx.objectStore('cachedNotifications');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Get queued items count
  async getQueuedCount() {
    const db = await this.getDB();
    let total = 0;

    for (const storeName of ['pendingRides', 'pendingLocations', 'pendingRatings']) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const count = await new Promise((resolve) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      });
      total += count;
    }

    return total;
  }

  // Clear all cached data
  async clearCache() {
    const db = await this.getDB();
    const storeNames = ['cachedTrips', 'cachedPayments', 'cachedNotifications'];
    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
    }
  }
}

const offlineService = new OfflineService();
export default offlineService;
