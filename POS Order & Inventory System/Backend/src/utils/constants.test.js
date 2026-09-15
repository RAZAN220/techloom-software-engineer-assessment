import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition } from './constants.js';

test('order lifecycle allows only supported transitions', () => {
  assert.equal(canTransition('PENDING', 'RESERVING'), true);
  assert.equal(canTransition('RESERVING', 'RESERVED'), true);
  assert.equal(canTransition('RESERVED', 'PAID'), true);
  assert.equal(canTransition('RESERVED', 'FAILED'), true);
  assert.equal(canTransition('RESERVED', 'EXPIRED'), true);
  assert.equal(canTransition('RESERVED', 'CANCELLED'), true);
  assert.equal(canTransition('PAID', 'CANCELLED'), true);
  assert.equal(canTransition('PAID', 'PENDING'), false);
  assert.equal(canTransition('FAILED', 'PAID'), false);
  assert.equal(canTransition('EXPIRED', 'PAID'), false);
  assert.equal(canTransition('CANCELLED', 'PAID'), false);
});