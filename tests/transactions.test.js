const request = require('supertest');
const app = require('../app');

let adminToken;
let analystToken;
let viewerToken;
let createdTransactionId;

beforeAll(async () => {
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testadmin@gmail.com', password: 'password123' });
  adminToken = adminRes.body.token;

  const analystRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testanalyst@gmail.com', password: 'password123' });
  analystToken = analystRes.body.token;

  const viewerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'testviewer@gmail.com', password: 'password123' });
  viewerToken = viewerRes.body.token;

  console.log('ADMIN LOGIN:', JSON.stringify(adminRes.body.user));
  console.log('ANALYST LOGIN:', JSON.stringify(analystRes.body.user));
  console.log('VIEWER LOGIN:', JSON.stringify(viewerRes.body.user));

  if (!adminToken || !analystToken || !viewerToken) {
    throw new Error('Test tokens are undefined — check setup.js user creation');
  }
});

describe('GET /api/transactions', () => {

  test('admin can fetch all transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });

  test('analyst can fetch all transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('viewer cannot fetch transactions - 403', async () => {
  const res = await request(app)
    .get('/api/transactions')
    .set('Authorization', `Bearer ${viewerToken}`);
  expect(res.statusCode).toBe(403);
});

  test('fails without token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toBe(401);
  });

});

describe('POST /api/transactions', () => {

  test('admin can create a transaction', async () => {
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
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    createdTransactionId = res.body.data._id;
  });

  test('analyst cannot create a transaction - 403', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 5000, type: 'income', category: 'Salary' });
    expect(res.statusCode).toBe(403);
  });

  test('viewer cannot create a transaction - 403', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 5000, type: 'income', category: 'Salary' });
    expect(res.statusCode).toBe(403);
  });

  test('fails with missing amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'income', category: 'Salary' });
    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toHaveProperty('amount');
  });

  test('fails with missing category', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 1000, type: 'income' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toHaveProperty('category');
  });

  test('fails with invalid type', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 1000, type: 'invalid', category: 'Salary' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toHaveProperty('type');
  });

  test('fails with negative amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -100, type: 'income', category: 'Salary' });
    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toHaveProperty('amount');
  });

});

describe('GET /api/transactions/summary', () => {

  test('analyst can access summary', async () => {
    const res = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('netBalance');
  });

  test('admin can access summary', async () => {
    const res = await request(app)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('viewer can access summary', async () => {
  const res = await request(app)
    .get('/api/transactions/summary')
    .set('Authorization', `Bearer ${viewerToken}`);
  expect(res.statusCode).toBe(200);
});
});

describe('GET /api/transactions/stats', () => {

  test('analyst can access stats', async () => {
    const res = await request(app)
      .get('/api/transactions/stats')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('viewer can access stats', async () => {
  const res = await request(app)
    .get('/api/transactions/stats')
    .set('Authorization', `Bearer ${viewerToken}`);
  expect(res.statusCode).toBe(200);
});

});

describe('DELETE /api/transactions/:id', () => {

  test('analyst cannot delete a transaction - 403', async () => {
    if (!createdTransactionId) return;
    const res = await request(app)
      .delete(`/api/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('admin can soft delete a transaction', async () => {
    if (!createdTransactionId) return;
    const res = await request(app)
      .delete(`/api/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});