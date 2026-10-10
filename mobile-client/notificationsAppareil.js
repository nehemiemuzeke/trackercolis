import * as Notifications from 'expo-notifications'
import api from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
})

export async function enregistrerTokenPush() {
  try {
    const permission = await Notifications.requestPermissionsAsync()
    if (!permission.granted) {
      return false
    }
    const jetonPeripherique = await Notifications.getDevicePushTokenAsync()
    if (jetonPeripherique?.data && typeof jetonPeripherique.data === 'string') {
      await api.mettreAJourTokenFcm(jetonPeripherique.data)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function afficherNotificationLocale({ titre, corps }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: titre, body: corps, sound: true },
      trigger: null
    })
  } catch {
    return
  }
}
