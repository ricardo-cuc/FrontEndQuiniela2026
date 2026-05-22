//src/services/pushService.js
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

let initializing = false;
const API_URL = import.meta.env.VITE_API;

export const pushService = {
  // =====================================
  // SUPPORT
  // =====================================
  isSupported: () => {
    return (
      window.isSecureContext &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  },

  // =====================================
  // PERMISSION
  // =====================================
  requestPermission: async () => {
    if (!pushService.isSupported()) {
      console.warn('⚠️ Push no soportado en este navegador');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // =====================================
  // REGISTER SW
  // =====================================
  registerServiceWorker: async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  },

  // =====================================
  // SUBSCRIBE
  // =====================================
  subscribeToPush: async () => {
    // Verificar que la clave VAPID está configurada
    if (!VAPID_PUBLIC_KEY) {
      console.error('❌ ERROR: VITE_VAPID_PUBLIC_KEY no está configurada en variables de entorno');
      return null;
    }

    if (initializing) {
      //console.log('⏳ Ya hay una suscripción en curso...');
      return null;
    }

    initializing = true;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        //console.log('✅ NUEVA SUSCRIPCIÓN CREADA');
      } else {
        //console.log('♻️ SUSCRIPCIÓN EXISTENTE REUTILIZADA');
      }

      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('❌ TOKEN NO ENCONTRADO - Usuario no autenticado');
        return null;
      }

      // Enviar la suscripción al backend
      const response = await fetch(`${API_URL}/api/notificaciones/suscribir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': import.meta.env.VITE_API_KEY || 'QNL_537490A8DF994B36BB687DEE'
        },
        body: JSON.stringify(subscription)
      });

      const result = await response.json();

      if (response.ok) {
        //console.log('📡 BACKEND RESPONSE:', result);
      } else {
        console.error('❌ BACKEND ERROR:', result);
      }

      return subscription;

    } catch (error) {
      console.error('❌ PUSH ERROR:', error);
      return null;
    } finally {
      initializing = false;
    }
  }
};

// =====================================
// VAPID CONVERTER (no necesita cambios)
// =====================================
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