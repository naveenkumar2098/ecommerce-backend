process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://client.example.test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(undefined));

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Make sure unique indexes exist before tests start
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
