// tests/auth.test.js

const request = require('supertest');
const app = require('../app');

describe('Auth Routes', () => {

  test('POST /api/auth/login - success with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@gmail.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  test('POST /api/auth/login - fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@gmail.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login - fails with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@gmail.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login - fails with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('POST /api/auth/login - fails with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.statusCode).toBe(422);
  });

  test('GET /api/auth/me - returns user when logged in', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@gmail.com', password: 'password123' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('testadmin@gmail.com'); // ← was res.body.user.email, getMe returns res.body.data
  });

  test('GET /api/auth/me - fails without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

});