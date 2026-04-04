const request = require('supertest');
const app = require('../app');

let adminToken;
let analystToken;
let viewerToken;

beforeAll(async () => {
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@gmail.com', password: 'password123' });
  adminToken = adminRes.body.token;

  const analystRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'analyst@gmail.com', password: 'password123' });
  analystToken = analystRes.body.token;

  const viewerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'viewer@gmail.com', password: 'password123' });
  viewerToken = viewerRes.body.token;
});

describe('Transaction Routes', () => {

  test('GET /api/transactions - admin can fetch all', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  test('GET /api/transactions - analyst can fetch all', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/transactions - viewer can fetch all', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/transactions - fails without token', async () => {
    const res = await request(app)
      .get('/api/transactions');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/transactions - admin can create', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'Salary',
        description: 'Test salary',
        date: '2024-01-15'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('transaction');
  });

  test('POST /api/transactions - analyst cannot create', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'Salary',
        description: 'Test'
      });
    expect(res.statusCode).toBe(403);
  });

  test('POST /api/transactions - viewer cannot create', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'Salary',
        description: 'Test'
      });
    expect(res.statusCode).toBe(403);
  });

  test('GET /api/transactions/summary - analyst can access', async () => {
    const res = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/transactions/summary - viewer gets 403', async () => {
    const res = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('GET /api/transactions/stats - analyst can access', async () => {
    const res = await request(app)
      .get('/api/transactions/stats')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/transactions/stats - viewer gets 403', async () => {
    const res = await request(app)
      .get('/api/transactions/stats')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

});