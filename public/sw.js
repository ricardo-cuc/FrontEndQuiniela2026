// public/sw.js
self.addEventListener('install', (event) => {
  console.log('🔧 SW instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW activado');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('🔥 Push recibido en SW');
  
  let data = {
    title: 'Quiniela Lucalza',
    body: 'Nueva notificación',
    icon: '/favicon.svg',
    url: '/'
  };
  
  if (event.data) {
    try {
      const parsedData = event.data.json();
      console.log('📦 Datos parseados:', parsedData);
      data = { ...data, ...parsedData };
    } catch (error) {
      console.log('❌ Error parseando JSON:', error);
      // Si no es JSON, usar el texto plano
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: data.url || '/' }
  };
  
  console.log('🔔 Mostrando notificación:', data.title);
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('✅ Notificación mostrada'))
      .catch(err => console.error('❌ Error mostrando notificación:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Clic en notificación');
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});