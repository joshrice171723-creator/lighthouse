const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const BetterSqlite3 = require('better-sqlite3');
const { createOrganizationPlatform } = require('../electron/organization-platform.cjs');

test('employment-support migration creates the participant, outcome, and AI cost tables once', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-'));
  const databasePath = path.join(dir, 'platform.sqlite');
  const platform = createOrganizationPlatform({ databasePath });
  try {
    assert.deepEqual(platform.migrationStatus().map((entry) => entry.version), ['20260828_participant_employment_support', '20260828_interview_preparation']);
    platform.close();
    const secondStartup = createOrganizationPlatform({ databasePath });
    try {
      assert.equal(secondStartup.migrationStatus().length, 2);
    } finally {
      secondStartup.close();
    }
    const db = new BetterSqlite3(databasePath, { readonly: true });
    try {
      const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((entry) => entry.name);
      for (const expected of ['funding_programs', 'participant_employment_profiles', 'participant_service_records', 'participant_job_opportunities', 'participant_job_placements', 'participant_retention_checkins', 'participant_product_activities', 'ai_usage_expenses']) {
        assert.ok(tableNames.includes(expected), `${expected} should exist`);
      }
    } finally {
      db.close();
    }
  } finally {
    try { platform.close(); } catch { /* platform is already closed after the migration check. */ }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
