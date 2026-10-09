from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SHELL=(ROOT/'v2/home/desktop-board-shell.mjs').read_text(encoding='utf-8')
CSS=(ROOT/'v2/home/desktop-board-shell.css').read_text(encoding='utf-8')
ADMIN=(ROOT/'admin.html').read_text(encoding='utf-8')
ADMIN_JS=(ROOT/'admin.js').read_text(encoding='utf-8')
INLINE=(ROOT/'admin-inline-panel.css').read_text(encoding='utf-8')

def test_admin_click_opens_in_existing_middle_column():
    assert "id:'admin',label:'لوحة الإدارة',icon:'admin',href:'#admin'" in SHELL
    assert "showDashboard('admin');" in SHELL
    assert "embeddedPageView(body,'admin.html','لوحة إدارة شطرنج العرب')" in SHELL
    assert "view.classList.toggle('admin-view',id==='admin')" in SHELL
    assert "location.hash.replace(/^#/,'')" in SHELL
    assert "admin'].includes(initialHash)" in SHELL
    assert ".desktop-dashboard-view.admin-view" in CSS

def test_embedded_admin_stays_authenticated_and_is_usable_in_narrow_column():
    assert "get('embed')==='panel'" in ADMIN
    assert 'admin-inline-panel.css' in ADMIN
    assert 'id="adminInlineNav"' in ADMIN
    assert "const embeddedAdmin=new URLSearchParams(location.search).get('embed')==='panel'" in ADMIN_JS
    assert "state.access=first(await rpc('admin_get_access'))" in ADMIN_JS
    assert "mountInlineAdmin();await loadDashboard()" in ADMIN_JS
    assert "if(!embeddedAdmin)setTimeout(()=>location.href='index.html',1400)" in ADMIN_JS
    assert "new MutationObserver(syncEmbeddedTableLabels)" in ADMIN_JS
    assert "table.querySelectorAll('tbody tr')" in ADMIN_JS
    assert "html.admin-embedded .table-wrap tbody" in INLINE
    assert "html.admin-embedded .admin-shell > .sidebar{display:none!important}" in INLINE

def test_standard_admin_page_not_styled_as_embed():
    assert INLINE.count("html.admin-embedded") > 20
    assert '<title>لوحة الإدارة | شطرنج العرب</title>' in ADMIN

def test_admin_menu_uses_text_only_framed_buttons():
    assert "button.textContent=name" in ADMIN_JS
    assert "button.className='nav-btn admin-inline-tab'" in ADMIN_JS
    assert "nav.appendChild(button)" in ADMIN_JS
    assert "grid-template-columns:repeat(2,minmax(0,1fr))" in INLINE
    assert "justify-content:center!important" in INLINE
    assert "border:1px solid rgba(221,174,101,.53)!important" in INLINE

def test_section_title_replaces_navigation_and_uses_full_column():
    assert 'id="adminInlineBack"' in ADMIN
    assert 'id="adminInlineTitle"' in ADMIN
    assert 'id="adminInlineRefresh"' in ADMIN
    assert "document.documentElement.classList.add('admin-inline-menu')" in ADMIN_JS
    assert "document.documentElement.classList.add('admin-inline-detail')" in ADMIN_JS
    assert "$('adminInlineNav').hidden=true" in ADMIN_JS
    assert "$('adminInlineHeader').hidden=false" in ADMIN_JS
    assert "if(embeddedAdmin)showInlineAdminDetail(id)" in ADMIN_JS
    assert "$('adminInlineBack')?.addEventListener('click',showInlineAdminMenu)" in ADMIN_JS
    assert "html.admin-embedded.admin-inline-menu main.content{display:none!important}" in INLINE
    assert "html.admin-embedded .topline{display:none!important}" in INLINE
    assert "if(!state.access)" in ADMIN_JS


def test_navigation_entries_are_cache_busted_and_legacy_desktop_admin_is_redirected():
    index=(ROOT/'index.html').read_text(encoding='utf-8')
    site=(ROOT/'v2/site/shell.mjs').read_text(encoding='utf-8')
    version='20261010-admin-tiles-entry-cachefix-v3'
    assert f'v2/home/dashboard.mjs?v={version}' in index
    assert f'v2/site/shell.mjs?v={version}' in index
    assert index.count(f'name="shatranj-asset-version" content="{version}"')==2
    assert "if(desktop&&!document.querySelector(" in site
    assert "desktop-sidebar-bottom" in site
    assert "location.replace('index.html?entry=admin-20261010#admin')" in ADMIN
    assert f'admin-inline-panel.css?v={version}' in ADMIN
    assert f'admin.js?v={version}' in ADMIN
