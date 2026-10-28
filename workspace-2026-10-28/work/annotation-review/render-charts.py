"""Render the dashboard's SVG geometry without loading HTML in a browser.
This checks standalone chart geometry only; it is not a live UI screenshot.
"""
import json
from pathlib import Path
from lxml import etree

base = Path(__file__).resolve().parent
data = json.loads((base / 'rendered.json').read_text())
style = '''text{font-family:Arial,sans-serif;fill:#292927;font-size:12px}
.sgrid{stroke:#dddcd6;stroke-width:1}.saxis{stroke:#96968e;stroke-width:1}
.smut{fill:#6e6e68;font-size:11px}.smono{font-variant-numeric:tabular-nums}
.slab-b{font-weight:600}.qhit{fill:transparent;stroke:none}
'''
for beat in range(7):
    raw = data['money'] if beat < 5 else data['investor'] if beat == 5 else data['roce']
    svg = etree.fromstring(raw.encode())
    svg.set('xmlns', 'http://www.w3.org/2000/svg')
    svg.set('width', '900')
    svg.set('height', svg.attrib['viewBox'].split()[3])
    st = etree.Element('style'); st.text = style; svg.insert(0, st)
    for node in svg.xpath('.//g[@class="ly"]'):
        active = str(beat) in node.get('data-show', '').split()
        ghost = str(beat) in node.get('data-ghost', '').split()
        node.set('opacity', '1' if active else '0.16' if ghost else '0')
    # A cash-floor line must be SVG geometry, not an accidental text fragment.
    if beat == 4:
        cash = svg.xpath('.//g[@data-show="4"]')[0]
        assert not (cash.text or '').strip(), cash.text
        assert len(cash.xpath('.//line[@stroke-dasharray]')) == 1
    # Offscreen chart layers can remain in the money SVG for transitions.
    for node in svg.xpath('.//g[@opacity="0"]'):
        node.getparent().remove(node)
    (base / f'chart-{beat + 1}.svg').write_bytes(etree.tostring(svg))
print('All seven SVG charts are well-formed; cash minimum is a real SVG line.')
