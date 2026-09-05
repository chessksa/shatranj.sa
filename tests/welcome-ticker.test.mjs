import assert from 'node:assert/strict';
import {
  countryForRegion,
  formatMemberLabel,
  selectLatestMembers,
  buildLatestMembersUrl
} from '../welcome-ticker-core.mjs';

const rows = Array.from({length: 12}, (_, index) => ({
  id: String(index + 1),
  name: `لاعب ${index + 1}`,
  region: index === 11 ? 'الرياض' : 'مصر',
  city: index === 11 ? 'الرياض' : 'القاهرة',
  created_at: new Date(Date.UTC(2026, 8, index + 1)).toISOString()
}));

assert.equal(countryForRegion('الرياض'), 'السعودية');
assert.equal(countryForRegion('مصر'), 'مصر');
assert.equal(
  formatMemberLabel({name:'أحمد', region:'السعودية', city:'الرياض'}),
  'نرحب بانضمام أحمد — السعودية، الرياض'
);

const latest = selectLatestMembers(rows, 10);
assert.equal(latest.length, 10);
assert.equal(latest[0].name, 'لاعب 12');
assert.equal(latest[9].name, 'لاعب 3');

const url = buildLatestMembersUrl('https://example.supabase.co', 10);
assert.match(url, /public_players/);
assert.match(url, /order=created_at\.desc/);
assert.match(url, /limit=10/);

console.log('welcome ticker tests passed');
