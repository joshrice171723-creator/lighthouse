const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('partner workspace exposes a bounded workforce recording flow without private career fields', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'OrganizationPortal.jsx'), 'utf8');
  assert.match(source, /id="lighthouse-record-employment"/);
  assert.match(source, /employment-support\/save/);
  for (const kind of ['consent', 'profile', 'enrollment', 'service', 'job_activity', 'job_opportunity', 'placement', 'retention', 'exit']) assert.match(source, new RegExp(`value="${kind}"`));
  assert.match(source, /No clinical or treatment data/);
  assert.match(source, /canRecordEmployment = \["owner", "admin", "manager", "employee", "staff"\]/);
  assert.doesNotMatch(source.slice(source.indexOf('lighthouse-record-employment'), source.indexOf('lighthouse-participants')), /resume|cover.?letter|answer|email/i);
});
