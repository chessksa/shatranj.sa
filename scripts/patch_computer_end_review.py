from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: Path, old: str, new: str):
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"marker not found in {path}: {old[:100]!r}")
    if text.count(old) != 1:
        raise SystemExit(f"marker occurs {text.count(old)} times in {path}: {old[:100]!r}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


js_path = ROOT / "play-computer.js"
html_path = ROOT / "play-v10.html"
edge_path = ROOT / "supabase/functions/computer-game/index.ts"

replace_once(
    js_path,
    "let clockAnchorMs = 0;\n",
    """let clockAnchorMs = 0;
let computerGraceDeadline = 0;
let computerGraceTimer = null;
let computerGraceCancelBusy = false;
let computerReviewFens = [];
let computerReviewIndex = -1;
let computerMoveReviewMode = false;
""",
)

replace_once(
    js_path,
    "function ensureCmStyles() {\n",
    """function rememberComputerFen(fen) {
  if (!fen) return;
  if (computerReviewFens[computerReviewFens.length - 1] !== fen) {
    computerReviewFens.push(fen);
    if (computerReviewFens.length > 512) computerReviewFens = computerReviewFens.slice(-512);
  }
  computerReviewIndex = computerReviewFens.length - 1;
  updateComputerMoveReviewControls();
}

function isComputerReviewingPast() {
  return computerMoveReviewMode && computerReviewIndex >= 0 && computerReviewIndex < computerReviewFens.length - 1;
}

function updateComputerMoveReviewControls() {
  if (!computerMoveReviewMode || !endGraceBtn) return;
  const back = endGraceBtn.querySelector('[data-review-direction="-1"]');
  const forward = endGraceBtn.querySelector('[data-review-direction="1"]');
  const backDisabled = computerReviewIndex <= 0;
  const forwardDisabled = computerReviewIndex >= computerReviewFens.length - 1;
  back?.classList.toggle('disabled', backDisabled);
  forward?.classList.toggle('disabled', forwardDisabled);
  back?.setAttribute('aria-disabled', String(backDisabled));
  forward?.setAttribute('aria-disabled', String(forwardDisabled));
}

function showComputerMoveReviewMode() {
  if (!endGraceBtn || finished || gameActions?.classList.contains('game-result-actions')) return;
  computerMoveReviewMode = true;
  endGraceBtn.classList.add('move-review-mode');
  endGraceBtn.disabled = false;
  endGraceBtn.setAttribute('aria-label', 'مراجعة الحركات السابقة');
  endGraceBtn.innerHTML = `<span class="move-review-inline"><span class="move-review-arrow" data-review-direction="-1" aria-label="رجوع">‹</span><span class="move-review-label">الحركة السابقة</span><span class="move-review-arrow" data-review-direction="1" aria-label="تقدم">›</span></span>`;
  updateComputerMoveReviewControls();
}

function renderComputerReviewedFen(index) {
  if (index < 0 || index >= computerReviewFens.length) return;
  computerReviewIndex = index;
  clearMoveHints();
  ensureBoard().setPosition(computerReviewFens[index], false);
  forceBoardSquareColors();
  updateComputerMoveReviewControls();
}

function stepComputerMoveReview(direction) {
  if (!computerMoveReviewMode || !computerReviewFens.length) return;
  const step = Number(direction) < 0 ? -1 : 1;
  if (step < 0 && computerReviewIndex <= 0) return;
  if (step > 0 && computerReviewIndex >= computerReviewFens.length - 1) return;
  renderComputerReviewedFen(computerReviewIndex + step);
}

function updateComputerGraceEndUI() {
  if (!endGraceBtn || computerMoveReviewMode || finished) return;
  const remaining = Math.max(0, computerGraceDeadline - performance.now());
  if (remaining <= 0) {
    clearInterval(computerGraceTimer);
    computerGraceTimer = null;
    computerGraceDeadline = 0;
    showComputerMoveReviewMode();
    return;
  }
  endGraceBtn.disabled = computerGraceCancelBusy;
  if (endGraceCountdownEl) {
    endGraceCountdownEl.hidden = false;
    endGraceCountdownEl.textContent = String(Math.ceil(remaining / 1000));
  }
}

function startComputerGraceWindow() {
  if (!endGraceBtn) return;
  clearInterval(computerGraceTimer);
  computerReviewFens = [];
  computerReviewIndex = -1;
  computerMoveReviewMode = false;
  computerGraceCancelBusy = false;
  endGraceBtn.classList.remove('move-review-mode');
  endGraceBtn.disabled = false;
  endGraceBtn.removeAttribute('aria-label');
  if (endGraceCountdownEl) endGraceCountdownEl.hidden = false;
  const note = endGraceBtn.querySelector('.grace-note');
  if (note) note.hidden = false;
  computerGraceDeadline = performance.now() + 5000;
  updateComputerGraceEndUI();
  computerGraceTimer = setInterval(updateComputerGraceEndUI, 100);
}

function ensureCmStyles() {
""",
)

replace_once(
    js_path,
    "function renderBoard(animated = true) {\n  ensureBoard().setPosition(game.fen(), animated);\n",
    "function renderBoard(animated = true) {\n  if (selectedLevel && selectedMinutes) rememberComputerFen(game.fen());\n  ensureBoard().setPosition(game.fen(), animated);\n",
)

replace_once(
    js_path,
    "  clearInterval(clockTimer);\n  clockTimer = null;\n  clockActiveSide = null;\n",
    "  clearInterval(clockTimer);\n  clockTimer = null;\n  clearInterval(computerGraceTimer);\n  computerGraceTimer = null;\n  computerGraceDeadline = 0;\n  clockActiveSide = null;\n",
)

replace_once(
    js_path,
    "  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {\n    if (!selectedLevel || !selectedMinutes || finished || thinking || game.turn() !== 'w') return false;\n",
    "  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {\n    if (isComputerReviewingPast()) return false;\n    if (!selectedLevel || !selectedMinutes || finished || thinking || game.turn() !== 'w') return false;\n",
)

replace_once(
    js_path,
    "  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {\n    if (!selectedLevel || !selectedMinutes || finished || thinking || game.turn() !== 'w') return false;\n",
    "  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {\n    if (isComputerReviewingPast()) return false;\n    if (!selectedLevel || !selectedMinutes || finished || thinking || game.turn() !== 'w') return false;\n",
)

replace_once(
    js_path,
    "  if (resignBtn) resignBtn.disabled = false;\n  if (drawOfferBtn) drawOfferBtn.disabled = false;\n  if (endGraceBtn) endGraceBtn.disabled = true;\n  if (endGraceCountdownEl) endGraceCountdownEl.hidden = true;\n  const note = endGraceBtn?.querySelector('.grace-note');\n  if (note) note.hidden = true;\n  setComputerStatus('جاهز');\n",
    "  if (resignBtn) resignBtn.disabled = false;\n  if (drawOfferBtn) drawOfferBtn.disabled = false;\n  startComputerGraceWindow();\n  setComputerStatus('جاهز');\n",
)

replace_once(
    js_path,
    "resignBtn?.addEventListener('click', () => resignComputerGame({ ask: true }));\n",
    """endGraceBtn?.addEventListener('click', async (event) => {
  updateComputerGraceEndUI();
  if (computerMoveReviewMode) {
    const directionTarget = event.target.closest?.('[data-review-direction]');
    const direction = directionTarget ? Number(directionTarget.dataset.reviewDirection) : -1;
    stepComputerMoveReview(direction);
    return;
  }
  if (endGraceBtn.disabled || computerGraceCancelBusy || finished || performance.now() >= computerGraceDeadline) return;

  computerGraceCancelBusy = true;
  endGraceBtn.disabled = true;
  try {
    if (ratedMode && ratedGameId) {
      const payload = await invokeComputer({ action: 'cancel', game_id: ratedGameId });
      if (!payload?.cancelled || payload?.status !== 'abandoned') throw new Error('computer grace cancellation rejected');
    }
    finished = true;
    thinking = false;
    if (engine) engine.postMessage('stop');
    clearInterval(clockTimer);
    clockTimer = null;
    clearInterval(computerGraceTimer);
    computerGraceTimer = null;
    computerGraceDeadline = 0;
    location.replace('play-v10.html?computer=1');
  } catch (error) {
    console.error(error);
    toast('تعذر إنهاء المباراة ضمن المهلة.');
  } finally {
    computerGraceCancelBusy = false;
    if (!finished) updateComputerGraceEndUI();
  }
});

resignBtn?.addEventListener('click', () => resignComputerGame({ ask: true }));
""",
)

replace_once(
    html_path,
    "play-computer.js?v=20260907-25",
    "play-computer.js?v=20260907-26",
)

replace_once(
    edge_path,
    "const gameSelect = 'id,level,fen,moves,status,result,time_control_minutes,player_time_ms,computer_time_ms,turn_started_at';",
    "const gameSelect = 'id,level,fen,moves,status,result,time_control_minutes,player_time_ms,computer_time_ms,turn_started_at,created_at';",
)

replace_once(
    edge_path,
    "    if (action === 'state') {\n",
    """    if (action === 'cancel') {
      const gameId = String(body.game_id ?? '');
      if (!gameId) return reply({ error: 'Game id required' }, 400);
      const row = await getGame(gameId);
      if (!row) return reply({ error: 'Computer game not found' }, 404);

      if (row.status !== 'active') {
        return reply({ ...(await currentGamePayload(row)), cancelled: row.status === 'abandoned' });
      }

      const createdAtMs = Date.parse(String(row.created_at ?? ''));
      const nowMs = Date.now();
      if (!Number.isFinite(createdAtMs) || nowMs >= createdAtMs + 5000) {
        return reply({ error: 'Grace period expired' }, 409);
      }

      const nowIso = new Date(nowMs).toISOString();
      const { data: cancelled, error: cancelError } = await admin
        .from('computer_games')
        .update({
          status: 'abandoned',
          result: null,
          finished_at: nowIso,
          turn_started_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', row.id)
        .eq('player_id', player.id)
        .eq('status', 'active')
        .select(gameSelect)
        .maybeSingle();
      if (cancelError) throw cancelError;
      if (!cancelled) {
        const current = await getGame(row.id);
        if (!current) return reply({ error: 'Computer game not found' }, 404);
        return reply({ ...(await currentGamePayload(current)), cancelled: current.status === 'abandoned' });
      }

      return reply({
        game_id: cancelled.id,
        fen: cancelled.fen,
        status: 'abandoned',
        result: null,
        cancelled: true,
        ...clockPayload(cancelled),
      });
    }

    if (action === 'state') {
""",
)

print("computer End grace/review patch applied")
