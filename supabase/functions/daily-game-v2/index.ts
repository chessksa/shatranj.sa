import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Chess } from 'npm:chess.js@1.4.0';

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Content-Type':'application/json; charset=utf-8',
};
const reply=(payload:Record<string,unknown>,status=200)=>new Response(JSON.stringify(payload),{status,headers:corsHeaders});
const isSquare=(v:unknown):v is string=>typeof v==='string'&&/^[a-h][1-8]$/.test(v);
const int=(v:unknown)=>Number.isInteger(Number(v))?Number(v):null;

function terminal(chess:Chess,mover:'w'|'b'){
  if(chess.isCheckmate())return {result:mover==='w'?'1-0':'0-1',termination:'checkmate'};
  if(chess.isStalemate())return {result:'1/2-1/2',termination:'stalemate'};
  if(chess.isDraw())return {result:'1/2-1/2',termination:'draw'};
  return {result:null,termination:null};
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization=req.headers.get('Authorization')||'';
  if(!url||!anon||!service||!authorization)return reply({error:'Authentication required'},401);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await userClient.auth.getUser();
  if(authError||!authData?.user)return reply({error:'Authentication required'},401);
  const {data:player,error:playerError}=await admin.from('players').select('id,status,is_synthetic').eq('auth_user_id',authData.user.id).maybeSingle();
  if(playerError||!player||player.is_synthetic||['banned','suspended','inactive'].includes(String(player.status??'')))return reply({error:'Player profile required'},403);
  let body:Record<string,unknown>;try{body=await req.json()}catch{return reply({error:'Invalid request'},400)}
  const action=String(body.action||'move'),gameId=typeof body.gameId==='string'?body.gameId:'';
  if(!gameId)return reply({error:'Invalid game'},400);

  if(action==='resign'||action==='timeout'){
    const {data,error}=await admin.rpc('v2_daily_action_server',{action_value:action,game_id:gameId,player_id:player.id});
    if(error){const conflict=/deadline_not_expired|game_not_active|not_participant/i.test(error.message||'');return reply({error:'تعذر تنفيذ الإجراء الآن'},conflict?409:500)}
    return reply({game:data,serverNow:new Date().toISOString()});
  }
  if(action!=='move')return reply({error:'Unsupported action'},400);

  const expectedPly=int(body.expectedPly),from=body.from,to=body.to,promotion=body.promotion==null||body.promotion===''?null:String(body.promotion);
  if(expectedPly==null||expectedPly<0||!isSquare(from)||!isSquare(to)||(promotion&&!['q','r','b','n'].includes(promotion)))return reply({error:'Invalid move request'},400);
  const {data:game,error:gameError}=await admin.from('v2_correspondence_games').select('id,white_player_id,black_player_id,variant,fen,turn,ply,status,result,move_due_at').eq('id',gameId).maybeSingle();
  if(gameError)return reply({error:'Could not load game'},500);if(!game)return reply({error:'Game not found'},404);if(game.status!=='active')return reply({error:'Game is not active'},409);if(game.ply!==expectedPly)return reply({error:'Game state changed',code:'stale_state'},409);
  const moverColor: 'w'|'b'|null=game.white_player_id===player.id?'w':game.black_player_id===player.id?'b':null;
  if(!moverColor)return reply({error:'Game not accessible'},403);if(game.turn!==moverColor)return reply({error:'Not your turn'},409);
  if(Date.parse(game.move_due_at)<=Date.now()){
    await admin.rpc('v2_daily_action_server',{action_value:'timeout',game_id:gameId,player_id:player.id});
    return reply({error:'Move deadline expired',code:'deadline_expired'},409);
  }
  if(game.variant!=='standard')return reply({error:'Variant not yet supported by daily engine'},409);
  let chess:Chess;try{chess=new Chess(game.fen)}catch{return reply({error:'Invalid authoritative position'},500)}
  let move;try{move=chess.move({from,to,...(promotion?{promotion}:{})})}catch{return reply({error:'Illegal move',code:'illegal_move'},409)}
  if(!move)return reply({error:'Illegal move',code:'illegal_move'},409);
  const end=terminal(chess,moverColor);
  const {data,error}=await admin.rpc('v2_daily_commit_server',{game_id:gameId,mover_player_id:player.id,expected_ply:expectedPly,from_square:from,to_square:to,promotion,san_value:move.san,fen_value:chess.fen(),next_turn:chess.turn(),result_value:end.result,termination_value:end.termination});
  if(error){const stale=/stale_game_version|wrong_turn|move_deadline_expired|game_not_active/i.test(error.message||'');return reply({error:stale?'Game state changed':'Could not save move',code:stale?'stale_state':'commit_failed'},stale?409:500)}
  return reply({game:data,serverNow:new Date().toISOString()});
});
