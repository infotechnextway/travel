import mongoose from 'mongoose';
import { config } from '.';

export const connectDatabase = async (): Promise<mongoose.Connection> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};
