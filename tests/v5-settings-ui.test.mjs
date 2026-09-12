import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('settings-v2.html','utf8');
const module=fs.readFileSync('v2/settings/account.mjs','utf8');

for(const id of [
  'v5-allow-challenges','v5-allow-messages','v5-show-online',
  'v5-site-notifications','v5-sound-enabled','v5-language','v5-timezone','v5-settings-save'
]) assert.match(html,new RegExp(`id=["']${id}["']`));

assert.match(html,/v2\/settings\/account\.mjs/);
assert.match(html,/config-base\.js/);
for(const token of ['v5_get_my_settings','v5_update_my_settings','allow_challenges','allow_messages','site_notifications','sound_enabled']){
  assert.match(module,new RegExp(token));
}
