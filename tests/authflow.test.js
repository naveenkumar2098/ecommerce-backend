const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const { createUser, authHeader } = require('./helpers');

describe('auth middleware', () => {
  it('token for a deleted user returns 401', async () => {
    const { user, token } = await createUser();
    await User.findByIdAndDelete(user._id);
    const res = await request(app).get('/api/auth/me').set(authHeader(token));
    expect(res.status).toBe(401);
  });

  it('rejects non-Bearer authorization schemes', async () => {
    const { token } = await createUser();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Token ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const bad = jwt.sign({ id: 'x' }, 'other-secret');
    const res = await request(app).get('/api/auth/me').set(authHeader(bad));
    expect(res.status).toBe(401);
  });
});

describe('auth inputs', () => {
  it('login without password returns 422', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@example.com' });
    expect(res.status).toBe(422);
  });

  it('forgotpassword with invalid email returns 422', async () => {
    const res = await request(app).post('/api/auth/forgotpassword').send({ email: 'nope' });
    expect(res.status).toBe(422);
  });

  it('resetpassword with short password returns 422', async () => {
    const res = await request(app).put('/api/auth/resetpassword/abc').send({ password: '123' });
    expect(res.status).toBe(422);
  });
});

describe('forgot/reset password', () => {
  it('unknown email still returns 200 and sends nothing', async () => {
    const res = await request(app).post('/api/auth/forgotpassword').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('reset link uses CLIENT_URL, not the Host header', async () => {
    const { user } = await createUser();
    const res = await request(app)
      .post('/api/auth/forgotpassword')
      .set('Host', 'evil.example.com')
      .send({ email: user.email });
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const { message } = sendEmail.mock.calls[0][0];
    expect(message).toContain(`${process.env.CLIENT_URL}/reset-password/`);
    expect(message).not.toContain('evil.example.com');
  });

  it('mail failure still returns generic 200 and clears the token', async () => {
    sendEmail.mockRejectedValueOnce(new Error('smtp down'));
    const { user } = await createUser();
    const res = await request(app).post('/api/auth/forgotpassword').send({ email: user.email });
    expect(res.status).toBe(200);
    const fresh = await User.findById(user._id);
    expect(fresh.resetPasswordToken).toBeUndefined();
  });

  it('full reset flow lets the user log in with the new password', async () => {
    const { user } = await createUser();
    await request(app).post('/api/auth/forgotpassword').send({ email: user.email });
    const { message } = sendEmail.mock.calls[0][0];
    const resetToken = message.trim().split('/').pop();
    const reset = await request(app)
      .put(`/api/auth/resetpassword/${resetToken}`)
      .send({ password: 'brandnew1' });
    expect(reset.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'brandnew1' });
    expect(login.status).toBe(200);
  });
});
