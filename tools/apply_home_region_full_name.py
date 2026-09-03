from pathlib import Path
import re

index_path = Path('index.html')
index = index_path.read_text(encoding='utf-8')
old = "    $('#accountRegion').textContent=currentProfile.region||'—';"
new = """    const accountRegion=$('#accountRegion');
    const accountRegionValue=String(currentProfile.region||'—').trim()||'—';
    accountRegion.textContent=accountRegionValue;
    accountRegion.classList.toggle('account-region-long',accountRegionValue.length>10);"""
if old in index:
    index = index.replace(old, new, 1)
elif "classList.toggle('account-region-long'" not in index:
    raise SystemExit('missing accountRegion render anchor')
index = re.sub(r'home-theme\.css\?v=[^"<]+', 'home-theme.css?v=20260903-13', index, count=1)
index_path.write_text(index, encoding='utf-8')

css_path = Path('home-theme.css')
css = css_path.read_text(encoding='utf-8')
if '#accountRegion{' not in css:
    anchor = """#accountPanel .account-stat strong{
  max-width:100%;
  line-height:1.2;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
"""
    addition = anchor + """
#accountRegion{
  width:100%;
  max-width:100%;
  overflow:visible;
  text-overflow:clip;
  white-space:normal;
  word-break:keep-all;
  overflow-wrap:normal;
  text-align:center;
  line-height:1.15;
}

#accountRegion.account-region-long{
  font-size:13px;
}
"""
    if anchor not in css:
        raise SystemExit('missing account stat strong anchor')
    css = css.replace(anchor, addition, 1)

mobile_anchor = """  #accountPanel .account-stat{
    min-height:58px;
  }
}"""
mobile_addition = """  #accountPanel .account-stat{
    min-height:58px;
  }

  #accountRegion.account-region-long{
    font-size:12px;
  }
}"""
if '  #accountRegion.account-region-long{\n    font-size:12px;' not in css:
    if mobile_anchor not in css:
        raise SystemExit('missing mobile account stat anchor')
    css = css.replace(mobile_anchor, mobile_addition, 1)
css_path.write_text(css, encoding='utf-8')

print('homepage region full-name fix applied')
