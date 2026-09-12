from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'supabase/migrations/20260912_full_platform_phase2.sql'
assert path.exists(), 'phase2 migration missing'
sql = path.read_text(encoding='utf-8')
for token in [
    'v2_friendships','v2_blocks','v2_challenges','v2_notifications',
    'v2_clubs','v2_club_members','v2_messages','v2_puzzles','v2_puzzle_attempts',
    'v2_lessons','v2_lesson_progress','v2_achievements','v2_user_achievements',
    'v2_correspondence_games','enable row level security','v2_current_player_id',
    'v2_send_friend_request','v2_respond_friend_request','v2_set_block',
    'v2_send_challenge','v2_respond_challenge','v2_mark_notification_read',
    'v2_submit_puzzle_attempt','v2_create_club','v2_join_club'
]:
    assert token in sql, token
print('Full platform phase2 schema contract: PASS')
