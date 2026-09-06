from pathlib import Path

index = Path("index.html")
text = index.read_text(encoding="utf-8")

header_button = """      <a id=\"headerTournaments\" class=\"header-tournaments header-tile\" href=\"#tournaments\">
        <span class=\"header-tile-icon\" aria-hidden=\"true\">♜</span><span>البطولات</span>
      </a>
"""
if header_button not in text:
    raise SystemExit("header tournaments button marker missing")
text = text.replace(header_button, "", 1)

computer = '        <a class="btn light hero-computer-btn" href="play-v10.html?computer=1"><span>اللعب ضد الكمبيوتر</span></a>\n'
tournament = '        <a class="btn light hero-tournaments-btn" href="tournaments.html"><span>البطولات</span></a>\n'
if computer not in text:
    raise SystemExit("computer play button marker missing")
text = text.replace(computer, computer + tournament, 1)
index.write_text(text, encoding="utf-8")

theme = Path("home-theme.css")
css = theme.read_text(encoding="utf-8")
first_old = ".home-hero .home-board-actions{\n  width:100%!important;\n  max-width:620px;\n  margin:0!important;\n  display:grid!important;\n  grid-template-columns:repeat(2,minmax(0,1fr))!important;"
first_new = ".home-hero .home-board-actions{\n  width:100%!important;\n  max-width:760px;\n  margin:0!important;\n  display:grid!important;\n  grid-template-columns:repeat(3,minmax(0,1fr))!important;"
final_old = ".home-hero .home-board-actions{\n  grid-template-columns:repeat(2,minmax(0,1fr))!important;"
final_new = ".home-hero .home-board-actions{\n  grid-template-columns:repeat(3,minmax(0,1fr))!important;"
if first_old not in css or final_old not in css:
    raise SystemExit("home action grid marker missing")
css = css.replace(first_old, first_new, 1).replace(final_old, final_new, 1)
theme.write_text(css, encoding="utf-8")
