import { MongoClient, Db, Collection } from 'mongodb';

type CacheRecord = {
  _id: string;
  data: any;
  createdAt: Date;
  ttlSeconds?: number;
};

let client: MongoClient | null = null;
let db: Db | null = null;

const DB_NAME = process.env.MONGODB_DB || 'space_weather_cache';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'api_cache';
const DEFAULT_TTL = parseInt(process.env.DONKI_CACHE_TTL_SECONDS || '', 10) || 60 * 60 * 2; // 2 hours

async function connect() {
  if (db && client) return { client, db };
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);

  // ensure TTL index on createdAt
  const coll = db.collection(COLLECTION_NAME);
  try {
    await coll.createIndex({ createdAt: 1 }, { expireAfterSeconds: 0 });
  } catch (e) {
    // ignore if index exists
  }

  return { client, db };
}

export async function getCache(key: string) {
  const { db } = await connect();
  const coll = db!.collection<CacheRecord>(COLLECTION_NAME);
  const doc = await coll.findOne({ _id: key });
  return doc ? doc.data : null;
}

export async function setCache(key: string, data: any, ttlSeconds?: number) {
  const { db } = await connect();
  const coll = db!.collection<CacheRecord>(COLLECTION_NAME);
  const ttl = typeof ttlSeconds === 'number' && ttlSeconds > 0 ? ttlSeconds : DEFAULT_TTL;
  const expireAt = new Date(Date.now() + ttl * 1000);

  await coll.updateOne(
    { _id: key },
    { $set: { data, createdAt: new Date(), expireAt, ttlSeconds: ttl } },
    { upsert: true }
  );

  // ensure expireAt index
  try {
    await coll.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
  } catch (e) {}
};

export async function closeClient() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export default { connect, getCache, setCache, closeClient };
