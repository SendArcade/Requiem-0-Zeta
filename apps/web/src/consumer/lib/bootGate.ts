const BOOT_KEY = 'rb-boot-seen'

export function hasSeenBoot() {
  try {
    return window.localStorage.getItem(BOOT_KEY) === '1'
  } catch {
    return false
  }
}

export function markBootSeen() {
  try {
    window.localStorage.setItem(BOOT_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}
