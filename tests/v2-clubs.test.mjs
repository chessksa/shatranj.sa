import fs from 'node:fs';
for(const file of ['clubs.html','club.html','v2/clubs/app.mjs']) if(!fs.existsSync(new URL(`../${file}`,import.meta.url))) throw new Error(`${file} missing`);
const clubs=fs.readFileSync(new URL('../clubs.html',import.meta.url),'utf8');
const detail=fs.readFileSync(new URL('../club.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../v2/clubs/app.mjs',import.meta.url),'utf8');
for(const token of ['clubList','createClubForm','clubName','clubDescription']) if(!clubs.includes(token)) throw new Error(token);
for(const token of ['clubTitle','clubMembers','clubMessages','clubMessageForm','joinClub']) if(!detail.includes(token)) throw new Error(token);
for(const token of ['v2_list_clubs','v2_create_club','v2_join_club','v2_list_club_members','v2_list_club_messages','v2_post_club_message']) if(!app.includes(token)) throw new Error(token);
console.log('V2 clubs: PASS');
