const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';

class NotificationService {
  constructor() {
    this.subscription = null;
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      this.subscription = await reg.pushManager.getSubscription();

      if (!this.subscription) {
        await this.subscribe();
      }

      return true;
    } catch (err) {
      console.error('Notification init failed:', err);
      return false;
    }
  }

  async subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // For development, use a simple subscription
      // In production, use real VAPID keys
      this.subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      return false;
    }
  }

  async unsubscribe() {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  async sendSubscriptionToServer(userId) {
    if (!this.subscription) return;

    try {
      const api = (await import('./api')).default;
      await api.post('/notifications/subscribe', {
        userId,
        subscription: this.subscription.toJSON()
      });
    } catch (err) {
      console.error('Failed to send subscription:', err);
    }
  }

  // Local notification (works without server)
  async showLocalNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: options.tag || 'dirs-notification',
      renotify: true,
      data: options.url || '/',
      actions: options.actions || []
    });
  }

  // Ride-specific notifications
  async notifyRideAccepted(driverName, vehicleInfo) {
    await this.showLocalNotification(
      'Ride Accepted!',
      `${driverName} is on the way with ${vehicleInfo}`,
      { tag: 'ride-accepted', url: '/passenger/trips' }
    );
  }

  async notifyDriverArriving() {
    await this.showLocalNotification(
      'Driver Arriving',
      'Your driver is arriving at the pickup location',
      { tag: 'driver-arriving', url: '/passenger/trips' }
    );
  }

  async notifyTripCompleted(fare) {
    await this.showLocalNotification(
      'Trip Complete!',
      `Trip completed. Fare: ${fare} ETB`,
      { tag: 'trip-completed', url: '/passenger/history' }
    );
  }

  async notifyNewRideRequest() {
    await this.showLocalNotification(
      'New Ride Request',
      'A passenger is requesting a ride nearby',
      { tag: 'new-ride', url: '/driver' }
    );
  }

  async notifySOSAlert(userName, location) {
    await this.showLocalNotification(
      'SOS ALERT',
      `${userName} has triggered an emergency alert at ${location}`,
      { tag: 'sos-alert', url: '/admin/sos' }
    );
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

const notificationService = new NotificationService();
export default notificationService;
