import mongoose from 'mongoose';

let rawUri = (process.env.MONGO_URI || '').trim();
rawUri = rawUri.replace(/:<([^>]+)>@/, ':$1@');
if (!rawUri || rawUri.includes('your_mongodb_atlas_connection_string')) {
  throw new Error('MONGO_URI environment variable is not set. Add it to your Vercel environment variables.');
}
const mongoUri = rawUri;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 5,
      minPoolSize: 1
    }).then((connection) => connection);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
};