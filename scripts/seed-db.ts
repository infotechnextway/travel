import mongoose from 'mongoose';
import { config } from '../services/api/src/config';

async function seed() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Database connected for seeding');
    console.log('Seed data will be populated in Phase 3');
    await mongoose.disconnect();
    console.log('Seeding complete');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
