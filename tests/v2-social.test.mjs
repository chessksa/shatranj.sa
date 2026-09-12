import fs from 'node:fs';
for(const file of ['community.html','notifications.html','v2/social/app.mjs','v2/social/notifications.mjs']) if(!fs.existsSync(new URL(`../${file}`,import.meta.url))) throw new Error(`${file} missing`);
const community=fs.readFileSync(new URL('../community.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../v2/social/app.mjs',import.meta.url),'utf8');
const notices=fs.readFileSync(new URL('../v2/social/notifications.mjs',import.meta.url),'utf8');
for(const token of ['playerSearch','searchResults','friendsList','friendRequests','challengeList','directMessages']) if(!community.includes(token)) throw new Error(token);
for(const token of ['v2_search_players','v2_send_friend_request','v2_respond_friend_request','v2_send_challenge','v2_respond_challenge','v2_set_block','v2_send_message','v2_list_direct_messages']) if(!app.includes(token)) throw new Error(token);
for(const token of ['v2_list_notifications','v2_mark_notification_read']) if(!notices.includes(token)) throw new Error(token);
console.log('V2 social and notifications: PASS');
