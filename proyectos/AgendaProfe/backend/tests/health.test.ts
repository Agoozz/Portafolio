import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/config/database';

describe('GET /api/v1/health', () => {
  before(async () => {
    // Attempt DB auth
    try {
      await sequelize.authenticate();
    } catch (e) {
      console.warn('DB not connected during tests, test might return 503.');
    }
  });

  after(async () => {
    await sequelize.close();
  });

  it('Debe retornar status 200 si DB está disponible o 503 si no', async () => {
    const res = await request(app).get('/api/v1/health');
    if (res.statusCode === 200) {
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.db, 'connected');
    } else {
      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.body.status, 'error');
      assert.strictEqual(res.body.db, 'disconnected');
    }
  });
});
