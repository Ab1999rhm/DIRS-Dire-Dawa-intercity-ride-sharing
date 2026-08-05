const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

let token;

beforeAll(async () => {
  const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/dirs_test';
  await mongoose.connect(url);

  const user = await User.create({
    firstName: 'Security',
    lastName: 'Test',
    phoneNumber: '+251999999999',
    password: 'password123',
    role: 'passenger'
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      phoneNumber: '+251999999999',
      password: 'password123'
    });

  token = res.body.accessToken;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Security Tests', () => {
  describe('Authentication Validation', () => {
    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toEqual(401);
    });

    it('should reject expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMH0.abc123';
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid phone number format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: 'invalid',
          password: 'password123',
          role: 'passenger'
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+251988888888',
          password: '123',
          role: 'passenger'
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('NoSQL Injection', () => {
    it('should prevent NoSQL injection in login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: { '$ne': '' },
          password: { '$ne': '' }
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should prevent NoSQL injection in search', async () => {
      const res = await request(app)
        .get('/api/admin/users?search={"$ne":""}')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).not.toEqual(500);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags in input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '<script>alert("xss")</script>',
          lastName: 'User',
          phoneNumber: '+251977777777',
          password: 'password123',
          role: 'passenger'
        });

      if (res.statusCode === 201) {
        expect(res.body.user.firstName).not.toContain('<script>');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      const requests = [];
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              phoneNumber: '+251911111111',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should prevent passenger from accessing admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });
  });
});
