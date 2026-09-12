import fs from 'node:fs';
for(const file of ['analysis.html','v2/analysis/app.mjs','v2/analysis/engine.mjs']) if(!fs.existsSync(new URL(`../${file}`,import.meta.url))) throw new Error(`${file} missing`);
const html=fs.readFileSync(new URL('../analysis.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../v2/analysis/app.mjs',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../v2/analysis/engine.mjs',import.meta.url),'utf8');
for(const token of ['analysisBoard','fenInput','pgnInput','runAnalysis','runReview','reviewResults']) if(!html.includes(token)) throw new Error(token);
for(const token of ['loadPgn','classifyMove','accuracy','analyzeFen']) if(!app.includes(token)) throw new Error(token);
for(const token of ['stockfish-18-lite-single.js','new Worker','go depth','score cp','bestmove']) if(!engine.includes(token)) throw new Error(token);
console.log('V2 analysis: PASS');
