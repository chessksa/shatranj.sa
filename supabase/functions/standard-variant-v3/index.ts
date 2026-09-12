import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Chess } from 'npm:chess.js@1.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json; charset=utf-8',
};
const reply=(payload:Record<string,unknown>,status=200)=>new Response(JSON.stringify(payload),{status,headers:corsHeaders});
const STANDARD_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const SUPPORTED=new Set(['threecheck','kingofthehill']);
const CENTER=['d4','e4','d5','e5'] as const;

function dateMs(value:unknown){const parsed=Date.parse(String(value??''));return Number.isFinite(parsed)?parsed:Date.now()}
function isCenterSquare(chess:Chess,color:'w'|'b'){
  return CENTER.some(square=>{const piece=chess.get(square);return piece?.type==='k'&&piece.color===color});
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const url=Deno.env.get('SUPABASE_URL');
  const anon=Deno.env.get('SUPABASE_ANON_KEY');
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization=req.headers.get('Authorization')||req.headers.get('authorization')||'';
  if(!url||!anon||!service||!authorization)return reply({error:'Authentication required'},401);

  const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await userClient.auth.getUser();
  if(authError||!authData?.user)return reply({error:'Authentication required'},401);
  const {data:player}=await admin.from('players').select('id,status,is_synthetic').eq('auth_user_id',authData.user.id).maybeSingle();
  if(!player||player.status!=='active'||player.is_synthetic)return reply({error:'Player profile required'},403);

  let body:Record<string,unknown>;try{body=await req.json()}catch{return reply({error:'Invalid request'},400)}
  const action=String(body.action??'');

  async function checkRateLimit(bucket:string,maxHits:number,windowSeconds:number){
    const {data,error}=await admin.rpc('v6_consume_rate_limit_server',{
      p_player_id:player.id,p_bucket:bucket,p_max_hits:maxHits,p_window_seconds:windowSeconds,
    });
    if(error)throw error;
    return Array.isArray(data)?data[0]??null:data;
  }

  if(action==='queue'){
    const variant=String(body.variant??'');
    if(!SUPPORTED.has(variant))return reply({error:'Unsupported variant'},400);
    const baseSeconds=Math.max(30,Math.min(3600,Number(body.baseSeconds)||600));
    const incrementSeconds=Math.max(0,Math.min(60,Number(body.incrementSeconds)||0));
    const rated=Boolean(body.rated);
    const {data,error}=await admin.rpc('v3_queue_variant_server',{
      p_player_id:player.id,p_variant:variant,p_base_seconds:baseSeconds,p_increment_seconds:incrementSeconds,
      p_rated:rated,p_start_index:518,p_start_fen:STANDARD_FEN,
    });
    if(error)return reply({error:'تعذر بدء البحث',code:error.message},409);
    const game=Array.isArray(data)?data[0]??null:data;
    return reply({waiting:!game,game,serverNow:new Date().toISOString()});
  }

  if(action==='cancel_queue'){
    const {data,error}=await userClient.rpc('v3_cancel_variant_queue');
    if(error)return reply({error:'تعذر إلغاء البحث'},409);
    return reply({cancelled:Boolean(data)});
  }

  const gameId=typeof body.gameId==='string'?body.gameId:'';
  if(!gameId)return reply({error:'Game required'},400);
  const {data:game,error:gameError}=await admin.from('v3_variant_games').select('*').eq('id',gameId).maybeSingle();
  if(gameError||!game)return reply({error:'Game not found'},404);
  if(!SUPPORTED.has(game.variant))return reply({error:'Wrong variant engine'},409);
  if(![game.white_player_id,game.black_player_id].includes(player.id))return reply({error:'Game not accessible'},403);

  if(['resign','offer_draw','respond_draw','timeout'].includes(action)){
    try{
      const rate=await checkRateLimit('variant_action',30,60);
      if(rate?.allowed===false)return reply({error:'Too many requests',code:'rate_limited',retryAfterMs:rate.retry_after_ms},429);
    }catch(error){console.error('Variant rate limit failed',error);return reply({error:'Rate limit unavailable'},503)}
    const {data,error}=await admin.rpc('v3_variant_action_server',{
      p_game_id:gameId,p_player_id:player.id,p_action:action,p_accept:action==='respond_draw'?Boolean(body.accept):null,
    });
    if(error)return reply({error:'تعذر تنفيذ الإجراء',code:error.message},409);
    return reply({game:data,serverNow:new Date().toISOString()});
  }

  if(action!=='move')return reply({error:'Unsupported action'},400);
  if(game.status!=='active')return reply({error:'Game is not active'},409);
  const expectedPly=Number(body.expectedPly);
  const from=typeof body.from==='string'?body.from:'';
  const to=typeof body.to==='string'?body.to:'';
  const promotion=typeof body.promotion==='string'?body.promotion:'';
  if(!Number.isInteger(expectedPly)||expectedPly<0||game.ply!==expectedPly||!/^[a-h][1-8]$/.test(from)||!/^[a-h][1-8]$/.test(to))return reply({error:'Game state changed',code:'stale_state'},409);
  try{
    const rate=await checkRateLimit('variant_move',12,2);
    if(rate?.allowed===false)return reply({error:'Too many requests',code:'rate_limited',retryAfterMs:rate.retry_after_ms},429);
  }catch(error){console.error('Variant rate limit failed',error);return reply({error:'Rate limit unavailable'},503)}

  const mover: 'w'|'b'=game.white_player_id===player.id?'w':'b';
  if(game.turn!==mover)return reply({error:'Not your turn'},409);

  const now=Date.now();
  const elapsed=Math.max(0,now-dateMs(game.clock_anchor_at));
  let whiteMs=Number(game.white_ms),blackMs=Number(game.black_ms);
  if(mover==='w')whiteMs=Math.max(0,whiteMs-elapsed);else blackMs=Math.max(0,blackMs-elapsed);
  if((mover==='w'?whiteMs:blackMs)<=0){
    const timed=await admin.rpc('v3_variant_action_server',{p_game_id:gameId,p_player_id:player.id,p_action:'timeout',p_accept:null});
    return reply({game:timed.data??game,error:timed.error?'Clock expired':undefined,serverNow:new Date(now).toISOString()},409);
  }

  let chess:Chess;try{chess=new Chess(game.fen)}catch{return reply({error:'Invalid authoritative position'},500)}
  let move;try{move=chess.move({from,to,promotion:promotion||'q'})}catch{return reply({error:'Illegal move',code:'illegal_move'},409)}
  if(!move)return reply({error:'Illegal move',code:'illegal_move'},409);

  const incrementMs=Number(game.increment_seconds||0)*1000;
  if(mover==='w')whiteMs+=incrementMs;else blackMs+=incrementMs;
  let whiteChecks=Number(game.white_checks||0),blackChecks=Number(game.black_checks||0);
  if(game.variant === 'threecheck' && chess.isCheck()){
    if(mover==='w')whiteChecks=Math.min(3,whiteChecks+1);else blackChecks=Math.min(3,blackChecks+1);
  }

  let result:string|null=null;
  let termination:string|null=null;
  if(game.variant === 'threecheck' && (mover==='w'?whiteChecks:blackChecks)>=3){result=mover==='w'?'1-0':'0-1';termination='third-check';}
  else if(game.variant === 'kingofthehill' && isCenterSquare(chess,mover)){result=mover==='w'?'1-0':'0-1';termination='king-of-the-hill';}
  else if(chess.isCheckmate()){result=mover==='w'?'1-0':'0-1';termination='checkmate';}
  else if(chess.isStalemate()){result='1/2-1/2';termination='stalemate';}
  else if(chess.isDraw()){result='1/2-1/2';termination='draw';}

  const uci=`${move.from}${move.to}${move.promotion||''}`;
  const {data:committed,error:commitError}=await admin.rpc('v3_commit_standard_variant_move_server',{
    p_game_id:gameId,p_player_id:player.id,p_expected_ply:expectedPly,p_san:move.san,p_uci:uci,p_fen:chess.fen(),
    p_next_turn:chess.turn(),p_white_ms:Math.round(whiteMs),p_black_ms:Math.round(blackMs),
    p_white_checks:whiteChecks,p_black_checks:blackChecks,p_result:result,p_termination:termination,
  });
  if(commitError)return reply({error:'Game state changed',code:commitError.message},409);
  const telemetry=await admin.rpc('v6_record_move_event_server',{
    p_source_type:game.variant,p_game_id:gameId,p_player_id:player.id,p_ply:expectedPly+1,
    p_move_uci:uci,p_san:move.san,p_server_move_ms:Math.round(elapsed),
    p_remaining_ms:Math.round(mover==='w'?whiteMs:blackMs),p_rated:Boolean(game.rated),
  });
  if(telemetry.error)console.error('Fair Play telemetry failed',telemetry.error.message);
  return reply({game:committed,serverNow:new Date(now).toISOString()});
});
