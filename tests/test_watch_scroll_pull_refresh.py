from pathlib import Path

watch = Path('watch.html').read_text(encoding='utf-8')

# Internal match-table scrolling must not be intercepted by pull-to-refresh.
assert watch.count('class="table-wrap" data-no-pull-refresh') == 2

print('watch table scrolling stays independent from pull-to-refresh')
