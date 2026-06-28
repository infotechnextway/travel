import mongoose from 'mongoose';
import { config } from '../config';

async function migrate() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Database connected for migration');
    await mongoose.disconnect();
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
