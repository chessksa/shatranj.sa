from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_desktop_header_and_tickers_use_four_rows():
    css = read("v2/site/shell.css")
    assert "body.v2-shell-active.home-signed-in>.home-header" not in css
    assert "grid-template-rows:64px 34px 34px minmax(0,1fr)!important" in css
    assert "body.v2-shell-active.home-signed-in .home-header{grid-row:1!important}" in css
    assert "body.v2-shell-active.home-signed-in .welcome-ticker{grid-row:2!important}" in css
    assert "body.v2-shell-active.home-signed-in #tournamentResultsTicker{grid-row:3!important}" in css
    assert "body.v2-shell-active.home-signed-in .home-hero,body.v2-shell-active.home-signed-in #ranking{grid-row:4!important}" in css


def test_desktop_sidebar_text_is_larger():
    css = read("v2/site/shell.css")
    match = re.search(r"\.v2-global-link\{[^}]*font-size:(\d+)px", css)
    assert match, "sidebar link font size must be explicit"
    assert int(match.group(1)) >= 14


def test_dashboard_identity_moves_out_of_desktop_card():
    js = read("v2/home/dashboard.mjs")
    assert "const desktop=window.matchMedia('(min-width:901px)').matches;" in js
    assert "if(!desktop) content.push(head);" in js
    assert "host.replaceChildren(...content);" in js


def test_ranking_uses_scoped_public_rpc():
    html = read("index-app.html")
    start = html.index("async function loadPlayers(){")
    end = html.index("async function loadCurrentMatchesCount(){", start)
    block = html[start:end]
    assert "supabase.rpc('get_public_ranked_players',{p_gender:null})" in block
    assert ".from('public_players')" not in block
    assert "get_public_usernames" not in block


def test_tournament_ticker_stays_below_latest_members_and_latest_members_is_faster():
    dashboard = read("v2/home/dashboard.mjs")
    index_app = read("index-app.html")
    assert "welcome.insertAdjacentElement('afterend',ticker);" in dashboard
    assert "animation:welcomeTickerInlineMove 52s linear infinite" in index_app
