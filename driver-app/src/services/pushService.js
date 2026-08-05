const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const requestPushPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const registerForPush = async (userId) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
      )
    });

    const token = JSON.stringify(subscription);

    await fetch(`${API_URL}/notifications/push-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('driverAccessToken')}`
      },
      body: JSON.stringify({ token, userId })
    });

    return subscription;
  } catch (error) {
    console.error('Push registration failed:', error);
    return null;
  }
};

export const unregisterPush = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch (error) {
    console.error('Push unregistration failed:', error);
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
