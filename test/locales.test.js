const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const files = [
  'public/locales/nl/index.json',
  'public/locales/nl/ui.json',
  'public/locales/nl/game-client.json',
  'server/locales/nl/messages.json',
  'server/locales/nl/profiles.json',
];

test('Dutch locale files are valid and contain the complete audited sources', () => {
  for (const file of files) {
    const value = JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
    assert.ok(Object.keys(value).length > 0, `${file} must not be empty`);
  }
  const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, '..', files[4]), 'utf8'));
  assert.equal(Object.keys(profiles).length, 10);
  for (const profile of Object.values(profiles)) {
    assert.ok(profile.name);
    assert.ok(profile.tagline);
    assert.ok(profile.chat_tone);
  }
});
