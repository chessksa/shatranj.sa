from pathlib import Path

path = Path('home-theme.css')
theme = path.read_text(encoding='utf-8')

old_marker = '/* HOME PLAY ACTION STACK 20260906 */'
new_marker = '/* HOME PLAY ACTION GRID 20260906 */'

block = r'''/* HOME PLAY ACTION GRID 20260906 */
.home-hero .home-board-actions{
  width:100%!important;
  max-width:760px!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  grid-template-rows:repeat(2,88px)!important;
  gap:12px!important;
  align-items:stretch!important;
  direction:rtl!important;
}
.home-hero .home-board-actions>.btn,
.home-hero .home-invite-wrap,
.home-hero .home-invite-wrap>.btn{
  width:100%!important;
  min-width:0!important;
  height:88px!important;
  min-height:88px!important;
}
.home-hero .home-invite-wrap{
  display:flex!important;
  position:relative!important;
}
.home-hero .home-board-actions>.btn,
.home-hero .home-invite-wrap>.btn{
  border-radius:16px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:6px!important;
  padding:8px 12px!important;
  font-size:15px!important;
  line-height:1.15!important;
  font-weight:900!important;
}
.home-hero .home-board-actions>.btn::before,
.home-hero .home-invite-wrap>.btn::before{
  display:block;
  font-size:24px;
  line-height:1;
  font-weight:900;
  color:var(--hero-gold-2);
}
.home-hero .hero-play-btn::before{content:"▶"}
.home-hero .home-invite-wrap>.btn::before{content:"♙＋"}
.home-hero .hero-computer-btn::before{content:"▣"}
.home-hero .hero-tournaments-btn::before{content:"♛"}
.home-hero .hero-play-btn{
  background:linear-gradient(135deg,var(--hero-gold-2),#d5aa4d)!important;
  border-color:#eed284!important;
  color:#173536!important;
  box-shadow:0 12px 26px rgba(0,0,0,.16)!important;
}
.home-hero .hero-play-btn::before{color:#173536}
.home-hero .home-invite-wrap>.btn{
  background:linear-gradient(145deg,rgba(9,68,70,.96),rgba(6,47,49,.96))!important;
  border-color:rgba(216,182,101,.62)!important;
  color:var(--hero-cream)!important;
}
.home-hero .hero-computer-btn{
  background:linear-gradient(145deg,var(--hero-panel),var(--hero-panel-2))!important;
  border-color:var(--hero-cyan-line)!important;
  color:var(--hero-cream)!important;
}
.home-hero .hero-tournaments-btn{
  background:linear-gradient(145deg,rgba(216,182,101,.11),rgba(7,52,54,.92))!important;
  border-color:rgba(216,182,101,.42)!important;
  color:var(--hero-cream)!important;
}
.home-hero .home-board-actions>.btn:hover,
.home-hero .home-invite-wrap>.btn:hover{
  transform:translateY(-1px)!important;
  border-color:rgba(239,207,124,.78)!important;
}
@media(max-width:700px){
  .home-hero .home-board-actions{
    max-width:100%!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    grid-template-rows:repeat(2,66px)!important;
    gap:8px!important;
  }
  .home-hero .home-board-actions>.btn,
  .home-hero .home-invite-wrap,
  .home-hero .home-invite-wrap>.btn{
    height:66px!important;
    min-height:66px!important;
  }
  .home-hero .home-board-actions>.btn,
  .home-hero .home-invite-wrap>.btn{
    border-radius:13px!important;
    gap:4px!important;
    padding:5px 6px!important;
    font-size:12px!important;
  }
  .home-hero .home-board-actions>.btn::before,
  .home-hero .home-invite-wrap>.btn::before{font-size:19px}
}
'''

if new_marker in theme:
    theme = theme[:theme.index(new_marker)].rstrip()
elif old_marker in theme:
    theme = theme[:theme.index(old_marker)].rstrip()

path.write_text(theme + '\n\n' + block, encoding='utf-8')
