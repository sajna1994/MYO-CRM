const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4 DNS resolution (fixes campus/university network issues)
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  // ─── Attempt 1: Connect to MongoDB Atlas ──────────────────────────────────
  try {
    console.log('⏳  Attempting to connect to MongoDB Atlas...');

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      family: 4,
    });

    console.log(`✅  MongoDB Atlas Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.warn(`⚠️  Atlas connection failed: ${error.message}`);
    console.log('⏳  Falling back to in-memory MongoDB...');
  }

  // ─── Attempt 2: Fall back to in-memory MongoDB ────────────────────────────
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();

    const conn = await mongoose.connect(memoryUri);

    console.log(`✅  In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log('⚠️  NOTE: Data will be lost when the server restarts.');
    console.log('   To persist data, fix your Atlas connection or use mobile hotspot.\n');
  } catch (memError) {
    console.error(`❌  In-memory MongoDB also failed: ${memError.message}`);
    console.error('   Run: npm install mongodb-memory-server');
  }
};

module.exports = connectDB;
