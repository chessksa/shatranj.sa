import fs from 'node:fs';
for(const file of ['learn.html','train.html','v2/learn/app.mjs']) if(!fs.existsSync(new URL(`../${file}`,import.meta.url))) throw new Error(`${file} missing`);
const learn=fs.readFileSync(new URL('../learn.html',import.meta.url),'utf8');
const train=fs.readFileSync(new URL('../train.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../v2/learn/app.mjs',import.meta.url),'utf8');
for(const token of ['coursePath','lessonLibrary','lessonViewer','completeLesson']) if(!learn.includes(token)) throw new Error(token);
for(const token of ['التكتيك','الافتتاح','النهايات','الرؤية','analysis.html','puzzles.html']) if(!train.includes(token)) throw new Error(token);
for(const token of ['v2_lessons','v2_lesson_progress','v2_complete_lesson','renderLessons']) if(!app.includes(token)) throw new Error(token);
console.log('V2 learn/train: PASS');
