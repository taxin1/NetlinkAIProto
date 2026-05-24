import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, type FirebaseStorage } from "firebase/storage"
import { getFirebaseApp, tryGetFirebaseApp } from "./app"
import { isFirebaseEnabled } from "./config"

let storage: FirebaseStorage | undefined

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

export function tryGetFirebaseStorage(): FirebaseStorage | null {
  if (!isFirebaseEnabled()) return null
  try {
    return getFirebaseStorage()
  } catch {
    return null
  }
}

export async function uploadUserFile(
  uid: string,
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  contentType?: string
): Promise<string | null> {
  const bucket = tryGetFirebaseStorage()
  if (!bucket) return null

  const objectRef = ref(bucket, `users/${uid}/${path}`)
  await uploadBytes(objectRef, file, contentType ? { contentType } : undefined)
  return getDownloadURL(objectRef)
}

export async function deleteUserFile(uid: string, path: string): Promise<void> {
  const bucket = tryGetFirebaseStorage()
  if (!bucket) return
  await deleteObject(ref(bucket, `users/${uid}/${path}`))
}

export async function uploadPublicFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  contentType?: string
): Promise<string | null> {
  const bucket = tryGetFirebaseStorage()
  if (!bucket) return null

  const objectRef = ref(bucket, `public/${path}`)
  await uploadBytes(objectRef, file, contentType ? { contentType } : undefined)
  return getDownloadURL(objectRef)
}
