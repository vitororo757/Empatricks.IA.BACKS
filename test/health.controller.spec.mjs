import { describe, expect, test } from '@jest/globals';
import { HealthController } from '../.nest-build/health.controller.js';

describe('GET /health', () => {
  test('returns the API health payload', () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'emprest-ai-api',
    });
  });
});
