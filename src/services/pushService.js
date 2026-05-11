const VAPID_PUBLIC_KEY =
  'BIo7IV9o8fXvETu9yDVSRa21ZeL8OR7XWfHuu61d3OMd2cHuJBIxFa9Isf003SDoqzP5XAkT61yabDhvO1KGXRM'

let initializing = false

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
    )
  },

  // =====================================
  // PERMISSION
  // =====================================

  requestPermission: async () => {

    if (!pushService.isSupported()) {
      return false
    }

    const permission =
      await Notification.requestPermission()

    return permission === 'granted'
  },

  // =====================================
  // REGISTER SW
  // =====================================

  registerServiceWorker: async () => {

    const registration =
      await navigator.serviceWorker.ready

    return registration
  },

  // =====================================
  // SUBSCRIBE
  // =====================================

  subscribeToPush: async () => {

    if (initializing) {
      return null
    }

    initializing = true

    try {

      const registration =
        await navigator.serviceWorker.ready

      let subscription =
        await registration.pushManager.getSubscription()

      // =====================================
      // CREATE IF NOT EXISTS
      // =====================================

      if (!subscription) {

        subscription =
          await registration.pushManager.subscribe({

            userVisibleOnly: true,

            applicationServerKey:
              urlBase64ToUint8Array(
                VAPID_PUBLIC_KEY
              )
          })

        console.log('✅ NUEVA SUSCRIPCIÓN')
      }
      else {

        console.log('♻️ SUSCRIPCIÓN EXISTENTE')
      }

      const token =
        sessionStorage.getItem('token')

      if (!token) {

        console.error('❌ TOKEN NO ENCONTRADO')

        return null
      }

      // =====================================
      // SEND TO BACKEND
      // =====================================

      const response = await fetch(
        'http://localhost:3000/api/notificaciones/suscribir',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            'Authorization':
              `Bearer ${token}`,

            'x-api-key':
              'QNL_537490A8DF994B36BB687DEE'
          },

          body: JSON.stringify(subscription)
        }
      )

      const result = await response.json()

      console.log('📡 BACKEND RESPONSE:', result)

      return subscription

    } catch (error) {

      console.error(
        '❌ PUSH ERROR:',
        error
      )

      return null

    } finally {

      initializing = false
    }
  }
}

// =====================================
// VAPID CONVERTER
// =====================================

function urlBase64ToUint8Array(base64String) {

  const padding =
    '='.repeat(
      (4 - base64String.length % 4) % 4
    )

  const base64 =
    (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

  const rawData =
    window.atob(base64)

  const outputArray =
    new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {

    outputArray[i] =
      rawData.charCodeAt(i)
  }

  return outputArray
}