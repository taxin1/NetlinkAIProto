import {
  getDataConnect,
  connectDataConnectEmulator,
  type DataConnect,
} from "firebase/data-connect"
import {
  connectorConfig,
  upsertUser,
  listMyContacts,
  getCurrentUser,
} from "@netlink/dataconnect"
import { tryGetFirebaseApp } from "./app"
import { isFirebaseDataConnectEnabled } from "./config"

let dataConnect: DataConnect | undefined

export function getFirebaseDataConnect(): DataConnect | null {
  if (!isFirebaseDataConnectEnabled()) return null

  const app = tryGetFirebaseApp()
  if (!app) return null

  if (!dataConnect) {
    dataConnect = getDataConnect(app, connectorConfig)

    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_FIREBASE_DATACONNECT_EMULATOR === "true"
    ) {
      connectDataConnectEmulator(dataConnect, "localhost", 9399)
    }
  }

  return dataConnect
}

export async function tryUpsertDataConnectUser(input: {
  email: string
  displayName?: string | null
  supabaseUserId?: string | null
}): Promise<boolean> {
  try {
    const dc = getFirebaseDataConnect()
    if (!dc) return false
    await upsertUser(dc, input)
    return true
  } catch {
    return false
  }
}

export async function tryListDataConnectContacts(limit = 50): Promise<unknown[] | null> {
  try {
    const dc = getFirebaseDataConnect()
    if (!dc) return null
    const result = await listMyContacts(dc, { limit })
    return result.data.contacts ?? []
  } catch {
    return null
  }
}

export async function tryGetDataConnectCurrentUser(): Promise<unknown | null> {
  try {
    const dc = getFirebaseDataConnect()
    if (!dc) return null
    const result = await getCurrentUser(dc)
    return result.data.user ?? null
  } catch {
    return null
  }
}

export { connectorConfig }
