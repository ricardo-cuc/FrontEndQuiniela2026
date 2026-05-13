// services/tokenScheduler.js
import { authService } from './authService';

let refreshTimeout = null;
let isScheduling = false;

const getTokenRemainingTime = (token) => {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const remaining = exp - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Error al calcular tiempo restante:', error);
    return 0;
  }
};

export const scheduleTokenRefresh = () => {
  // Evitar múltiples schedulers simultáneos
  if (isScheduling) {
    console.log('⏳ Ya hay un scheduler en proceso...');
    return;
  }
  
  // Limpiar timeout existente
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
  
  const token = authService.getToken();
  if (!token) {
    console.log('⏰ No hay token válido para programar refresh');
    return;
  }
  
  const remainingTime = getTokenRemainingTime(token);
  
  // Si el token ya expiró o expirará en menos de 1 minuto
  if (remainingTime <= 60000) {
    console.log('⚠️ Token por expirar o ya expirado, no se programa refresh');
    return;
  }
  
  // Renovar 5 minutos antes de que expire (o a la mitad del tiempo si es menor a 10 minutos)
  const refreshThreshold = Math.min(5 * 60 * 1000, remainingTime / 2);
  const timeToRefresh = remainingTime - refreshThreshold;
  
  if (timeToRefresh > 0 && timeToRefresh < 60 * 60 * 1000) { // Solo si falta menos de 1 hora
    isScheduling = true;
    
    console.log(`🕐 Programando refresh de token en ${Math.round(timeToRefresh / 60000)} minutos`);
    
    refreshTimeout = setTimeout(async () => {
      console.log('🔄 Ejecutando refresh automático de token...');
      try {
        await authService.refreshToken();
        console.log('✅ Token renovado exitosamente');
      } catch (error) {
        console.error('❌ Error al renovar token automáticamente:', error);
        // No hacer nada aquí, el interceptor manejará el 401
      } finally {
        isScheduling = false;
        refreshTimeout = null;
      }
    }, timeToRefresh);
  } else {
    console.log(`⏰ Tiempo hasta expiración: ${Math.round(remainingTime / 60000)} minutos. No se programa refresh.`);
  }
};

export const clearTokenSchedule = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
    isScheduling = false;
    console.log('🗑️ Scheduler de token cancelado');
  }
};

// ✅ Función para verificar el estado del scheduler
export const isTokenRefreshScheduled = () => {
  return refreshTimeout !== null;
};