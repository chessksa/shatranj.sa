import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('v2/home/move-notebook.mjs','utf8');
const css=fs.readFileSync('v2/home/move-notebook.css','utf8');
const start=source.indexOf('function syncNotebookDock(){');
const end=source.indexOf('\nfunction text(',start);
assert.ok(start>=0&&end>start,'Actual live notebook layout function exists');
const functionSource=source.slice(start,end);
assert.doesNotMatch(functionSource,/dataset\.mode|compact|data-open/,'Never silently show the hamburger-only strip');
assert.match(css,/\.move-notebook-columns,.move-notebook-row\{display:grid/);
assert.doesNotMatch(css,/data-mode="compact"|width:38px/);
assert.match(source,/document\.body\.appendChild\(root\)/);

function simulateBoard({left,top=7,height=800,viewportHeight=900}){
  const writes=new Map();
  const root={dataset:{},style:{setProperty(key,value){writes.set(key,value)}}};
  let rectCalls=0;
  const board={getBoundingClientRect(){
    rectCalls++;
    return {left,top,height};
  }};
  const context={
    HOST_ID:'desktopMoveNotebook',
    document:{
      getElementById(id){
        if(id==='desktopMoveNotebook')return root;
        if(id==='homeBoardPreview')return board;
        return null;
      },
      body:{classList:{contains(name){return name==='desktop-move-notebook-active';}}}
    },
    window:{innerHeight:viewportHeight},
    Math
  };
  vm.runInNewContext(functionSource+';syncNotebookDock();',context);
  assert.equal(rectCalls,1,'Geometry must use the real board position');
  return writes;
}

const largeGap=simulateBoard({left:780,height:810});
assert.equal(largeGap.get('--notebook-docked-width'),'680px','Fill generous left gap with a full table');
assert.equal(largeGap.get('--notebook-docked-left'),'97px','Leave just 3px between notebook and board without shifting it');
assert.equal(largeGap.get('--notebook-board-top'),'7px');
assert.equal(largeGap.get('--notebook-board-height'),'810px');
const tallBoard=simulateBoard({left:780,top:21.5,height:810.25,viewportHeight:610});
assert.equal(tallBoard.get('--notebook-board-top'),'21.5px','Notebook top must follow exact board top');
assert.equal(tallBoard.get('--notebook-board-height'),'810.25px','Notebook must not be cut off by viewport height');
assert.equal(
  parseFloat(tallBoard.get('--notebook-board-top'))+parseFloat(tallBoard.get('--notebook-board-height')),
  831.75,
  'Notebook bottom must be pixel-aligned with the board bottom'
);

const mediumGap=simulateBoard({left:410,height:720});
assert.equal(mediumGap.get('--notebook-docked-width'),'397px','Fill the medium gap with only 3px separation');
assert.equal(mediumGap.get('--notebook-docked-left'),'10px');

const tight=simulateBoard({left:180,height:650});
assert.equal(tight.get('--notebook-docked-width'),'167px','Even narrow monitors must preserve a 3px non-overlapping gap');
assert.equal(tight.get('--notebook-docked-left'),'10px');
assert.equal(tight.get('visibility'),'visible');
const noSpace=simulateBoard({left:70,height:650});
assert.equal(noSpace.get('--notebook-docked-width'),'57px','Never impose the former 250px minimum');
assert.equal(noSpace.get('visibility'),'hidden','When no real space exists, do not overlay the board');

// Explicit nonintersection checks across desktop sizes and board placements.
// Catch precisely the user-visible bug: width=250 even though availableLeft<250.
for(const x of [10,30,70,110,150,180,215,230,260,350,410,550,780,900,1200]){
  const layout=simulateBoard({left:x});
  const left=parseFloat(layout.get('left'));
  const width=parseFloat(layout.get('width'));
  const visibility=layout.get('visibility');
  assert.ok(width>=0,'No negative widths');
  if(visibility==='visible'){
    assert.ok(width>=94,'Only show a table if at least 94px fit');
    assert.ok(left+width+3<=x,`Move log must not cover chessboard when boardLeft=${x}: panelRight=${left+width}`);
  }
}
console.log('Move log runtime geometry: fully constrained to vacant space; board overlap impossible: PASS');
