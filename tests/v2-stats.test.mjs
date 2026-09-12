import fs from 'node:fs';
for(const file of ['stats.html','v2/stats/app.mjs']) if(!fs.existsSync(new URL(`../${file}`,import.meta.url))) throw new Error(`${file} missing`);
const html=fs.readFileSync(new URL('../stats.html',import.meta.url),'utf8');const app=fs.readFileSync(new URL('../v2/stats/app.mjs',import.meta.url),'utf8');
for(const token of ['ratingStat','resultStats','colorStats','timeControlStats','ratingHistory','puzzleStats','achievementList']) if(!html.includes(token)) throw new Error(token);
for(const token of ['v2_stats_summary','v2_stats_time_controls','v2_stats_rating_history','v2_list_achievements','winRate']) if(!app.includes(token)) throw new Error(token);
console.log('V2 stats: PASS');
