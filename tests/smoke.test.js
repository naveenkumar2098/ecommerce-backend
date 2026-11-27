const request = require('supertest');
const app = require('../app');
const { createUser, authHeader } = require('./helpers');

describe('harness', () => {
  it('serves public product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
  });

  it('authenticates a helper-created user', async () => {
    const { token, user } = await createUser({ role: 'admin' });
    const res = await request(app).get('/api/auth/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });
});
