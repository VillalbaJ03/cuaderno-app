/**
 * Almacenamiento persistente.
 *
 * Por defecto el navegador puede borrar los datos de un sitio cuando necesita
 * espacio, y Safari en iOS los descarta tras varios días sin visitarlo. Con
 * `navigator.storage.persist()` se pide que no lo haga. Cada navegador decide:
 * Chrome lo concede según el uso, Firefox pregunta al usuario y Safari lo da
 * cuando la app está añadida a la pantalla de inicio.
 */

function api(): StorageManager | null {
  if (typeof navigator === 'undefined') return null
  return navigator.storage ?? null
}

export function persistenceSupported(): boolean {
  return typeof api()?.persist === 'function'
}

/** ¿El navegador ya se comprometió a conservar los datos? */
export async function isPersisted(): Promise<boolean> {
  const storage = api()
  if (typeof storage?.persisted !== 'function') return false
  try {
    return await storage.persisted()
  } catch {
    return false
  }
}

/** Solicita la protección. Devuelve si quedó concedida. */
export async function requestPersistence(): Promise<boolean> {
  const storage = api()
  if (typeof storage?.persist !== 'function') return false
  try {
    return await storage.persist()
  } catch {
    return false
  }
}

export interface StorageUsage {
  /** Bytes ocupados por la app. */
  usage: number
  /** Bytes disponibles según el navegador. */
  quota: number
}

export async function storageUsage(): Promise<StorageUsage | null> {
  const storage = api()
  if (typeof storage?.estimate !== 'function') return null
  try {
    const { usage = 0, quota = 0 } = await storage.estimate()
    return { usage, quota }
  } catch {
    return null
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
