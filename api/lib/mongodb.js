import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://healthcare-admin:8985611578%40aA@cluster0.ki0akth.mongodb.net/healthcare-platform?retryWrites=true&w=majority';

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function db(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db();
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export { clientPromise };
