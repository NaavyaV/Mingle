const mongoose = require('mongoose');

async function connectDb(uri) {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and add your Atlas connection string.'
    );
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('[db] connected to MongoDB');
}

module.exports = { connectDb };
