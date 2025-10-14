import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const uri = process.env.MONGODB_URI!;
const cache = global.__mongooseCache ?? { conn: null, promise: null };
if (!global.__mongooseCache) global.__mongooseCache = cache;

export async function connectToDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(uri, { bufferCommands: false });
  cache.conn = await cache.promise;
  return cache.conn;
}