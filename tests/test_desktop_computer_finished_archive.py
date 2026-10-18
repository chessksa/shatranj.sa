"""Regression contracts for desktop computer games appearing in public finished matches."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def source(path):return (ROOT/path).read_text(encoding="utf-8")

def test_archiver_records_finished_matches_for_same_authenticated_player():
    migration=source("supabase/migrations/20261019014300_archive_local_computer_finished_games.sql")
    assert "create or replace function public.archive_local_computer_game(" in migration
    assert "if (select auth.uid()) is null" in migration
    assert "p.auth_user_id=(select auth.uid()) and p.status='active'" in migration
    assert "returns uuid" in migration
    assert "'finished',p_result" in migration
    assert "on conflict (id) do nothing" in migration
    assert "rating_applied,rating_before,rating_delta,rating_after" in migration
    assert "true,v_player_rating,0,v_player_rating" in migration
    assert "p_moves is null or jsonb_typeof(p_moves)<>'array'" in migration
    assert "coalesce(m.item->>'from','') !~" in migration
    assert "to authenticated" in migration
    assert "from public, anon, authenticated" in migration

def test_desktop_game_finalizes_archive_once_with_full_game_record():
    computer=source("v2/home/inline-computer.mjs")
    shell=source("v2/home/desktop-board-shell.mjs")
    assert "mountInlineComputer(body,{supabase})" in shell
    assert "export function mountInlineComputer(body,options={})" in computer
    assert "archiveClient=options?.supabase||null" in computer
    assert "archiveGameId=globalThis.crypto?.randomUUID?.()||null" in computer
    assert "const snapshot=archiveResult?" in computer
    assert "client.auth.getUser()" in computer
    assert "client.rpc('archive_local_computer_game'" in computer
    assert "p_moves:snapshot.moves" in computer
    assert "p_fen:snapshot.fen" in computer
    assert "p_minutes:snapshot.minutes" in computer
    assert "p_player_ms:snapshot.whiteMs" in computer
    assert "p_computer_ms:snapshot.blackMs" in computer
    assert "from:uci.slice(0,2),to:uci.slice(2,4)" in computer
    assert "side:ply%2?'computer':'player'" in computer
    assert "if(snapshot)void archiveFinishedGame(snapshot,message)" in computer
    assert "حُفظت في المباريات المنتهية" in computer
    assert "لم تُحفظ" not in computer or "سجّل الدخول" in computer

def test_checkmate_and_draw_are_distinguished_before_archiving():
    computer=source("v2/home/inline-computer.mjs")
    assert "async function finishOnNoLegalMoves()" in computer
    assert "chess.isCheckmate()" in computer
    assert "chess.isDraw()||chess.isStalemate()" in computer
    assert "if(!gameOver)setStatus" in computer
    assert "lastMove?.color==='w'?'player'" not in computer

def test_existing_finished_list_and_watcher_support_database_archives():
    migration=source("supabase/migrations/20260910_public_finished_games.sql")
    viewer=source("computer-watch.html")
    listing=source("watch.html")
    assert "from public.computer_games g" in migration
    assert "where g.status = 'finished'" in migration
    assert "supabase.rpc('list_public_finished_games')" in listing
    assert "get_public_computer_game" in viewer
