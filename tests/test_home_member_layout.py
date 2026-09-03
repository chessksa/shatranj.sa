from pathlib import Path

index = Path('index.html').read_text(encoding='utf-8')
theme = Path('home-theme.css').read_text(encoding='utf-8')
invite = Path('home-invite.js').read_text(encoding='utf-8')

assert 'id="homeBoardPreview"' in index, 'member board preview must exist below the member box'
assert 'id="homeBoardActions"' in index, 'play/invite actions container must exist below the board'
assert 'class="mobile-play protected-play"' not in index, 'legacy floating/board play element must be removed'

assert '.home-board-preview{' in theme, 'new board preview must be styled'
assert '.home-board-actions{' in theme, 'new actions row must be styled below the board'
assert '#ranking::before' not in theme, 'mobile duplicate board preview must be removed'

assert "document.querySelector('#homeBoardActions')" in invite, 'invite button must render under the board'
print('home member layout: PASS')
