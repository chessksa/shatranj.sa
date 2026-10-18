/* One last-move indicator for online play and read-only spectating.
   Board colors and piece images are never changed by this module. */
const SQUARE=/^[a-h][1-8]$/;
const PIECE=/^[pnbrqkPNBRQK]$/;

export function moveFromRecord(record){
  if(!record||typeof record!=='object')return null;
  const from=record.from_square??record.from??record.fromSquare;
  const to=record.to_square??record.to??record.toSquare;
  if(typeof from==='string'&&typeof to==='string'&&SQUARE.test(from)&&SQUARE.test(to)&&from!==to)
    return {from,to};
  const uci=record.uci||record.move_uci||record.move;
  if(typeof uci==='string'&&/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))
    return {from:uci.slice(0,2),to:uci.slice(2,4)};
  return null;
}

function placement(fen){
  const rows=String(fen||'').trim().split(/\s+/)[0].split('/');
  if(rows.length!==8)return null;
  const squares=new Map();
  for(let r=0;r<8;r++){
    let file=0;
    for(const symbol of rows[r]){
      if(/^[1-8]$/.test(symbol)){file+=Number(symbol);continue;}
      if(!PIECE.test(symbol)||file>=8)return null;
      squares.set('abcdefgh'[file]+(8-r),symbol);
      file++;
    }
    if(file!==8)return null;
  }
  return squares;
}

export function moveFromPositions(beforeFen,afterFen){
  if(!beforeFen||!afterFen||beforeFen===afterFen)return null;
  const before=placement(beforeFen),after=placement(afterFen);
  if(!before||!after)return null;
  const turn=String(beforeFen).trim().split(/\s+/)[1];
  const nextTurn=String(afterFen).trim().split(/\s+/)[1];
  if(!['w','b'].includes(turn)||nextTurn!==(turn==='w'?'b':'w'))return null;
  const mine=p=>p&&(turn==='w'?p===p.toUpperCase():p===p.toLowerCase());
  const changed=new Set([...before.keys(),...after.keys()]);
  const from=[],to=[];
  for(const sq of changed){
    const prior=before.get(sq),latest=after.get(sq);
    if(prior===latest)continue;
    if(mine(prior))from.push({sq,piece:prior});
    if(mine(latest))to.push({sq,piece:latest});
  }
  if(from.length===1&&to.length===1&&from[0].sq!==to[0].sq)
    return {from:from[0].sq,to:to[0].sq};
  // Castling changes king AND rook; highlight the king's actual travel.
  const king=turn==='w'?'K':'k';
  const kingFrom=from.filter(p=>p.piece===king);
  const kingTo=to.filter(p=>p.piece===king);
  if(kingFrom.length===1&&kingTo.length===1&&kingFrom[0].sq!==kingTo[0].sq)
    return {from:kingFrom[0].sq,to:kingTo[0].sq};
  // Ambiguous snapshots (e.g. two plies since last poll) must not guess.
  return null;
}

export function setLastMoveClass(board,move){
  if(!board)return;
  const from=SQUARE.test(move?.from||'')?move.from:null;
  const to=SQUARE.test(move?.to||'')?move.to:null;
  for(const square of board.querySelectorAll('[data-square]')){
    square.classList.toggle('last-move-from',!!from&&square.dataset.square===from);
    square.classList.toggle('last-move-to',!!to&&square.dataset.square===to);
  }
}
