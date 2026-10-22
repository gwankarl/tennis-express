import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected; Mongoose will attempt to reconnect.');
});

mongoose.connection.on('reconnected', () => {
  console.info('MongoDB reconnected.');
});

/**
 * Opens the application's default Mongoose connection.
 * Rejects if the initial connection to the configured MongoDB server fails.
 */
export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri);
  console.info('Connected to MongoDB.');
}

/**
 * Closes all Mongoose connections during application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.info('Disconnected from MongoDB.');
}
