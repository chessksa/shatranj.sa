from pathlib import Path
root=Path(__file__).resolve().parents[1]
path=root/'supabase/functions/daily-game-v2/index.ts'
assert path.exists(),'daily-game-v2 missing'
text=path.read_text(encoding='utf-8')
for token in ['chess.js@1.4.0','v2_correspondence_games','v2_daily_commit_server','v2_daily_action_server','expectedPly','move_due_at','Illegal move','resign','timeout']:
    assert token in text,token
print('V2 daily edge function: PASS')
