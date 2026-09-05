from pathlib import Path

css_path = Path('home-theme.css')
html_path = Path('index.html')
css = css_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')

marker = '/* Mobile header single dashboard entry 20260905 */'
block = r'''

/* Mobile header single dashboard entry 20260905 */
@media(max-width:600px){
  .compact-member-nav .dashboard-link{
    display:none!important;
  }
  .compact-member-nav .header-member-link.header-tile{
    height:auto!important;
    min-height:44px!important;
  }
  .compact-member-nav .header-member-copy strong{
    max-width:none!important;
    white-space:normal!important;
    overflow:visible!important;
    text-overflow:clip!important;
    overflow-wrap:anywhere!important;
    line-height:1.2!important;
  }
}
'''

if marker not in css:
    css = css.rstrip() + block + '\n'

html = html.replace('home-theme.css?v=20260905-2', 'home-theme.css?v=20260905-3')

css_path.write_text(css, encoding='utf-8')
html_path.write_text(html, encoding='utf-8')
