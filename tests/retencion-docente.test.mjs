import assert from 'node:assert/strict';
import test from 'node:test';
import { isExpiredPro, isReactivationCampaignOpen, REACTIVATION_DAYS, REACTIVATION_PRICE_USD } from '../src/lib/reactivation.ts';

const now = Date.parse('2026-12-01T12:00:00Z');
const expired = { role:'teacher', planType:'pro', access_level:'pro', expiresAt:'2026-11-25T12:00:00Z' };

test('solo docentes Pro vencidos, no invitados, Plus ni administradores', () => {
  assert.equal(isExpiredPro(expired, now), true);
  assert.equal(isExpiredPro({...expired, role:'admin'}, now), false);
  assert.equal(isExpiredPro({...expired, planType:'plus'}, now), false);
  assert.equal(isExpiredPro({...expired, access_level:'guest'}, now), false);
  assert.equal(isExpiredPro({...expired, expiresAt:'2026-12-02T12:00:00Z'}, now), false);
  assert.equal(isExpiredPro({...expired, expiresAt:'invalid'}, now), false);
  assert.equal(isExpiredPro(null, now), false);
});
test('precio, duración y fin de campaña en Venezuela', () => {
  assert.equal(REACTIVATION_DAYS,37);
  assert.equal(REACTIVATION_PRICE_USD,2);
  assert.equal(isReactivationCampaignOpen(now),true);
  assert.equal(isReactivationCampaignOpen(Date.parse('2027-01-01T03:59:59Z')),true);
  assert.equal(isReactivationCampaignOpen(Date.parse('2027-01-01T04:00:00Z')),false);
});
