import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replicaSet: MongoMemoryReplSet | undefined;

/**
 * Starts an isolated in-memory MongoDB replica set for this test file.
 */
beforeAll(async () => {
  replicaSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      dbName: 'tennis-xpress-test',
      storageEngine: 'wiredTiger',
    },
  });

  await mongoose.connect(replicaSet.getUri());
}, 60_000);

/**
 * Removes test data between tests while keeping the collections and indexes.
 */
afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

/**
 * Closes the Mongoose connection and stops the in-memory replica set.
 */
afterAll(async () => {
  try {
    await mongoose.disconnect();
  } finally {
    await replicaSet?.stop();
    replicaSet = undefined;
  }
}, 60_000);
