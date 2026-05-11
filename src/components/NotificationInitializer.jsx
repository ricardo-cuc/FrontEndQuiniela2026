// src/components/NotificationInitializer.jsx
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pushService } from '../services/pushService';

const NotificationInitializer = () => {
  const { isAuthenticated, loading } = useAuth();
  const initializedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Esperar a que termine la carga de autenticación
    if (loading) {
      console.log('🔍 Cargando autenticación...');
      return;
    }
    
    // Evitar inicializar múltiples veces
    if (initializedRef.current) {
      console.log('🔍 Notificaciones ya inicializadas, omitiendo...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('🔍 Usuario no autenticado, no iniciando notificaciones');
      return;
    }
    
    initializedRef.current = true;
    
    console.log('🔍 Usuario autenticado, iniciando notificaciones push...');
    
    const supported = pushService.isSupported();
    console.log('🔍 Push soportado:', supported);
    
    if (!supported) {
      console.log('❌ Push notifications no soportadas en este navegador');
      return;
    }
    
    const permissionGranted = sessionStorage.getItem('push_permission_granted');
    console.log('🔍 Permiso ya otorgado:', permissionGranted);
    
    if (permissionGranted === 'true') {
      console.log('📢 Usuario ya aceptó notificaciones, suscribiendo...');
      pushService.subscribeToPush().then(subscription => {
        console.log('📢 Resultado suscripción:', subscription ? '✅ Exitosa' : '❌ Falló');
      });
    } else if (permissionGranted !== 'false') {
      console.log('📢 Esperando 15 segundos para preguntar...');
      
      timeoutRef.current = setTimeout(() => {
        console.log('📢 Preguntando por permiso de notificaciones...');
        const wantsNotifications = confirm(
          '📢 ¿Quieres recibir notificaciones en tiempo real?\n\n' +
          'Recibirás alertas cuando:\n' +
          '• Se actualicen resultados de partidos\n' +
          '• Cambie el ranking\n' +
          '• Se bloqueen/desbloqueen predicciones\n\n' +
          '¿Activar notificaciones?'
        );
        
        if (wantsNotifications) {
          console.log('📢 Usuario aceptó, solicitando permiso...');
          pushService.requestPermission().then(granted => {
            console.log('📢 Permiso otorgado:', granted);
            
            if (granted) {
              console.log('📢 Creando suscripción push...');
              pushService.subscribeToPush().then(subscription => {
                console.log('📢 Suscripción creada:', !!subscription);
                if (subscription) {
                  sessionStorage.setItem('push_permission_granted', 'true');
                  console.log('✅ Notificaciones push activadas correctamente');
                }
              });
            } else {
              console.log('❌ Usuario denegó permiso para notificaciones');
              sessionStorage.setItem('push_permission_granted', 'false');
            }
          });
        } else {
          console.log('❌ Usuario rechazó notificaciones');
          sessionStorage.setItem('push_permission_granted', 'false');
        }
      }, 15000);
    } else {
      console.log('📢 Usuario ya rechazó notificaciones previamente');
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, loading]);

  return null;
};

export default NotificationInitializer;