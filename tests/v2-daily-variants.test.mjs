import fs from 'node:fs';
for(const file of ['daily.html','variants.html','v2/daily/app.mjs','v2/variants/catalog.mjs']) if(!fs.existsSync(new URL(`../${file}`,import.meta.url))) throw new Error(`${file} missing`);
const daily=fs.readFileSync(new URL('../daily.html',import.meta.url),'utf8');const app=fs.readFileSync(new URL('../v2/daily/app.mjs',import.meta.url),'utf8');const variants=fs.readFileSync(new URL('../v2/variants/catalog.mjs',import.meta.url),'utf8');
for(const token of ['dailyBoard','dailyGames','dailyPlayerSearch','daysPerMove','dailyResign']) if(!daily.includes(token)) throw new Error(token);
for(const token of ['v2_create_daily_game','v2_list_daily_games','v2_get_daily_game','daily-game-v2','expectedPly']) if(!app.includes(token)) throw new Error(token);
for(const token of ['chess960','three-check','king-of-the-hill','crazyhouse','atomic','horde']) if(!variants.includes(token)) throw new Error(token);
console.log('V2 daily/variants: PASS');
