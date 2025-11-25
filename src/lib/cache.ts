// ...existing code...
import { get, set, del } from "idb-keyval";

export async function StoreToCache<T>(key: string, value: T): Promise<void> {
  await set(key, value);
}

export async function LoadFromCache<T>(key: string): Promise<T | undefined> {
  return (await get(key)) as T | undefined;
}

export async function ClearCache(key: string): Promise<void> {
  await del(key);
}
// ...existing code...
