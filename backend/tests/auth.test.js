const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

let token;
let userId;

beforeAll(async () => {
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirs_test';
  await mongoose.connect(url);
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+251911234567',
        password: 'password123',
        role: 'passenger'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.firstName).toEqual('Test');

    token = res.body.accessToken;
    userId = res.body.user._id;
  });

  it('should not register with existing phone', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test2',
        lastName: 'User2',
        phoneNumber: '+251911234567',
        password: 'password123',
        role: 'passenger'
      });

    expect(res.statusCode).toEqual(400);
  });

  it('should login user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '+251911234567',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should get current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.user.phoneNumber).toEqual('+251911234567');
  });

  it('should fail without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toEqual(401);
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/api/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
  });
});
