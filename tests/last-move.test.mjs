import assert from 'node:assert/strict';
import {moveFromRecord, moveFromPositions, setLastMoveClass} from '../v2/play/last-move.mjs';

const before='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const after='rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
assert.deepEqual(moveFromPositions(before,after),{from:'e2',to:'e4'});
assert.deepEqual(moveFromRecord({from_square:'e2',to_square:'e4'}),{from:'e2',to:'e4'});
assert.deepEqual(moveFromRecord({uci:'e7e8q'}),{from:'e7',to:'e8'});
assert.deepEqual(moveFromPositions(
  'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
  'r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1'
),{from:'e1',to:'g1'}); // castling
assert.deepEqual(moveFromPositions(
  '8/8/8/3pP3/8/8/8/4K2k w - d6 0 1',
  '8/8/3P4/8/8/8/8/4K2k b - - 0 1'
),{from:'e5',to:'d6'}); // en passant
assert.deepEqual(moveFromPositions(
  '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
  'Q3k3/8/8/8/8/8/8/4K3 b - - 0 1'
),{from:'a7',to:'a8'}); // promotion
assert.equal(moveFromPositions('not a fen',after),null);
assert.equal(moveFromRecord({from_square:'a9',to_square:'a8'}),null);
const squares=['e2','e4','g1'].map(square=>({
  dataset:{square},flags:new Set(),
  classList:null
}));
for(const el of squares)el.classList={toggle:(key,enabled)=>enabled?el.flags.add(key):el.flags.delete(key)};
const board={querySelectorAll:()=>squares};
setLastMoveClass(board,{from:'e2',to:'e4'});
assert.equal(squares[0].flags.has('last-move-from'),true);
assert.equal(squares[1].flags.has('last-move-to'),true);
setLastMoveClass(board,{from:'e4',to:'g1'});
assert.equal(squares[0].flags.has('last-move-from'),false);
assert.equal(squares[1].flags.has('last-move-to'),false);
assert.equal(squares[1].flags.has('last-move-from'),true);
assert.equal(squares[2].flags.has('last-move-to'),true);
setLastMoveClass(board,null);
assert.equal(squares.every(x=>x.flags.size===0),true);
console.log('Last-move highlight: standard, castle, en passant, promotion, restore and clear PASS');
