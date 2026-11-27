const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { createUser, authHeader } = require('./helpers');

describe('account integrity', () => {
  it('register ignores role in the body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@example.com', password: 'secret123', role: 'admin' });
    expect(res.status).toBe(201);
    const user = await User.findOne({ email: 'eve@example.com' });
    expect(user.role).toBe('customer');
  });

  it('own-profile update cannot change role or password', async () => {
    const { user, token, password } = await createUser();
    const res = await request(app)
      .put('/api/users/me/update')
      .set(authHeader(token))
      .send({ name: 'New Name', role: 'admin', password: 'x' });
    expect(res.status).toBe(200);
    const fresh = await User.findById(user._id).select('+password');
    expect(fresh.role).toBe('customer');
    expect(fresh.name).toBe('New Name');
    expect(await fresh.matchPassword(password)).toBe(true);
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(login.status).toBe(200);
  });

  it('forgot-password does not corrupt the stored password hash', async () => {
    const { user, password } = await createUser();
    const res = await request(app).post('/api/auth/forgotpassword').send({ email: user.email });
    expect(res.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(login.status).toBe(200);
  });

  it('own-profile email collision returns 400', async () => {
    const a = await createUser();
    const b = await createUser();
    const res = await request(app)
      .put('/api/users/me/update')
      .set(authHeader(b.token))
      .send({ email: a.user.email });
    expect(res.status).toBe(400);
  });

  it('admin can change a role; invalid role returns 422; password is not writable', async () => {
    const admin = await createUser({ role: 'admin' });
    const target = await createUser();
    const ok = await request(app)
      .put(`/api/users/${target.user._id}`)
      .set(authHeader(admin.token))
      .send({ role: 'support', password: 'plaintext' });
    expect(ok.status).toBe(200);
    const fresh = await User.findById(target.user._id).select('+password');
    expect(fresh.role).toBe('support');
    expect(await fresh.matchPassword(target.password)).toBe(true);

    const bad = await request(app)
      .put(`/api/users/${target.user._id}`)
      .set(authHeader(admin.token))
      .send({ role: 'superuser' });
    expect(bad.status).toBe(422);
  });

  it('non-admin cannot use the admin update route', async () => {
    const a = await createUser();
    const b = await createUser();
    const res = await request(app)
      .put(`/api/users/${b.user._id}`)
      .set(authHeader(a.token))
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });
});
