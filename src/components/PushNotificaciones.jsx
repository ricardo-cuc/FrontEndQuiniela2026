// src/components/PushNotificaciones.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { pushService } from '../services/pushService';

const PushNotificaciones = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const checkSupport = async () => {
      const supported = pushService.isSupported();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };
    
    checkSupport();
  }, []);

  const handleEnableNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const granted = await pushService.requestPermission();
      if (granted) {
        const subscription = await pushService.subscribeToPush();
        setIsSubscribed(!!subscription);
        setPermission('granted');
        sessionStorage.setItem('push_permission_granted', 'true');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50">
      {permission !== 'granted' ? (
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition"
          title="Activar notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>
      ) : isSubscribed ? (
        <button
          disabled
          className="bg-green-600 text-white rounded-full p-3 shadow-lg cursor-default"
          title="Notificaciones activadas"
        >
          <CheckCircle className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="bg-gray-500 text-white rounded-full p-3 shadow-lg hover:bg-gray-600 transition"
          title="Activar notificaciones"
        >
          <BellOff className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default PushNotificaciones;