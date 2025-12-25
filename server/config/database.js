const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check for MongoDB URLs in order of preference
    const mongoUri = process.env.MONGO_PUBLIC_URL || 
                     process.env.MONGO_URL || 
                     process.env.MONGODB_URI || 
                     'mongodb://localhost:27017/darkcity';
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
