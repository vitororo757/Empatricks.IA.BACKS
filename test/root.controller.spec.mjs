import { describe, expect, test } from '@jest/globals';
import { RootController } from '../.nest-build/root.controller.js';

describe('GET /', () => {
  test('returns the API health payload', () => {
    const controller = new RootController();

    expect(controller.getRoot()).toEqual({
      status: 'ok',
      service: 'emprest-ai-api',
    });
  });
});
