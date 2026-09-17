import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

const read=(path)=>fs.readFileSync(path,'utf8');
const tune=read('v2/home/desktop-board-shell-tune.mjs');
const inlinePath='v2/home/inline-play.mjs';
const inlineCss=read('v2/home/inline-play.css');

function pieceVisualBounds(path){
  const png=fs.readFileSync(path);
  let offset=8,width=0,height=0,bitDepth=0,colorType=0;
  const idat=[];
  while(offset<png.length){
    const len=png.readUInt32BE(offset); offset+=4;
    const type=png.toString('ascii',offset,offset+4); offset+=4;
    const data=png.subarray(offset,offset+len); offset+=len+4;
    if(type==='IHDR'){
      width=data.readUInt32BE(0); height=data.readUInt32BE(4);
      bitDepth=data[8]; colorType=data[9];
    }else if(type==='IDAT') idat.push(data);
    else if(type==='IEND') break;
  }
  assert.equal(bitDepth,8,'قياس تمركز القطع يدعم PNG بعمق 8 بت');
  const channels={6:4,4:2}[colorType];
  assert.ok(channels,'قياس تمركز القطع يحتاج PNG بقناة شفافية');
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const stride=width*channels;
  const rows=[];
  let p=0;
  const paeth=(a,b,c)=>{
    const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);
    return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
  };
  for(let y=0;y<height;y++){
    const filter=raw[p++];
    const row=Buffer.alloc(stride);
    const prev=rows[y-1];
    for(let x=0;x<stride;x++){
      const value=raw[p++];
      const a=x>=channels?row[x-channels]:0;
      const b=prev?prev[x]:0;
      const c=prev&&x>=channels?prev[x-channels]:0;
      const recon=filter===0?value:
        filter===1?(value+a)&255:
        filter===2?(value+b)&255:
        filter===3?(value+Math.floor((a+b)/2))&255:
        filter===4?(value+paeth(a,b,c))&255:NaN;
      assert.ok(Number.isFinite(recon),`مرشح PNG غير مدعوم: ${filter}`);
      row[x]=recon;
    }
    rows.push(row);
  }
  const alphaIndex=channels-1;
  let minX=width,minY=height,maxX=-1,maxY=-1;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const alpha=rows[y][x*channels+alphaIndex];
    if(alpha>12){
      minX=Math.min(minX,x); maxX=Math.max(maxX,x);
      minY=Math.min(minY,y); maxY=Math.max(maxY,y);
    }
  }
  assert.ok(maxX>=0&&maxY>=0,`لم يتم العثور على رسم مرئي داخل ${path}`);
  const canvasCenterX=(width-1)/2;
  const canvasCenterY=(height-1)/2;
  const centerX=(minX+maxX)/2;
  const centerY=(minY+maxY)/2;
  return {width,height,minX,maxX,minY,maxY,centerX,centerY,canvasCenterX,canvasCenterY,offsetX:centerX-canvasCenterX,offsetY:centerY-canvasCenterY};
}

assert.ok(fs.existsSync(inlinePath),'يجب وجود وحدة لعب داخلية للواجهة الرئيسية');
const inline=read(inlinePath);

assert.match(tune,/inline-play\.mjs/,'يجب تحميل وحدة اللعب الداخلي من الواجهة الرئيسية');
assert.match(inline,/data-desktop-nav=["']play["']/,'وحدة اللعب الداخلي يجب أن تعالج زر اللعب في القائمة');
assert.match(inline,/data-tune-action=["']play["']/,'وحدة اللعب الداخلي يجب أن تعالج زر ابدأ اللعب');
assert.match(inline,/homeBoardPreview/,'وحدة اللعب الداخلي يجب أن تستخدم الرقعة الحالية');
assert.match(inline,/preventDefault\(\)/,'الضغط على اللعب يجب أن يمنع الانتقال إلى صفحة أخرى');
assert.match(inline,/setAttribute\(["']href["'],["']#play["']\)/,'يجب تحويل روابط اللعب في الواجهة إلى رابط داخلي');
assert.doesNotMatch(inline,/play-v2\.html\?game=/,'وضع اللعب الداخلي لا يجب أن يغيّر العنوان إلى صفحة اللعب المنفصلة');
assert.match(inline,/url\.hash\s*=\s*["']#play["']/,'الدخول إلى وضع اللعب يجب أن يحفظ #play في الرابط حتى يعود بعد التحديث');
assert.match(inline,/location\.hash\s*===\s*["']#play["']/,'بدء الصفحة يجب أن يتعرف على #play ويعيد فتح وضع اللعب بعد التحديث');
assert.match(inline,/url\.hash\s*=\s*["']["']/,'الخروج من اللعب يجب أن يزيل #play من الرابط');
assert.match(inlineCss,/\.inline-play-piece\s*\{[\s\S]*?width:94%[\s\S]*?height:94%/,'قطع اللعب داخل الواجهة يجب أن تكون بحجم 94% من المربع');
assert.match(inlineCss,/\.inline-play-square\s*\{[\s\S]*?position:relative/,'مربع اللعب يجب أن يكون مرجع تمركز للقطعة');

const pieceCodes=['wp','wn','wb','wr','wq','wk','bp','bn','bb','br','bq','bk'];
const pieceBounds=Object.fromEntries(pieceCodes.map(code=>[code,pieceVisualBounds(`assets/pieces/${code}.png`)]));
console.log('PIECE_BOUNDS',JSON.stringify(pieceBounds));
console.log('home inline play verification passed');
