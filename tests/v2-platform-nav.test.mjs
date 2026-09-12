import fs from 'node:fs';
const nav = fs.readFileSync(new URL('../v2/site/nav.mjs', import.meta.url),'utf8');
const api = fs.readFileSync(new URL('../v2/platform/api.mjs', import.meta.url),'utf8');
for (const href of ['puzzles.html','learn.html','analysis.html','community.html','clubs.html','stats.html','notifications.html','daily.html','variants.html']) {
  if (!nav.includes(href)) throw new Error(`missing nav target ${href}`);
}
for (const token of ['getSessionPlayer','rpc','table','requirePlayer']) {
  if (!api.includes(`export async function ${token}`) && !api.includes(`export function ${token}`)) throw new Error(`missing api export ${token}`);
}
console.log('V2 platform nav/API: PASS');
