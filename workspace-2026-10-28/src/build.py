"""Build the dashboard from its sources.

    python3 src/build.py            # writes outputs/Tejas_Revenue_Dashboard_1041_Updated.html
    python3 src/build.py out.html   # writes a preview somewhere else

Sources (all in this folder; see WORKING-ON-THE-DASHBOARD.md):
  base/dashboard-base.html  every page, styles, inputs and fonts; holds an empty capex-layer slot
  capex/step-capex-layer.js the capex phasing layer, inserted into that slot
  page03/*.css, page03/*.js page 03 (Funding & returns), appended after the base so it overrides it
  guide/guide.css, guide/guide.js the page directory and connection diagram on How to read
"""
import base64,os,sys
d=os.path.dirname(os.path.abspath(__file__))
src=lambda *p:open(os.path.join(d,*p),encoding='utf-8').read()
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(d,'..','outputs','Tejas_Revenue_Dashboard_1041_Updated.html')

def put(html,anchor,new):
    assert html.count(anchor)==1,('anchor must occur exactly once',anchor[:60],html.count(anchor))
    return html.replace(anchor,new)

PAGE03_JS=['p03a.js','p03b.js','p03c.js','panel-kit.js','panels-b.js','panels-c.js']   # load order matters: later code overrides earlier
PAGE03_CSS=['p03.css','panels-b.css','panels-c.css','panel-kit.css']                  # the panel kit loads last so its card anatomy wins
OPEN,CLOSE='/* >>> step capex layer */','/* <<< step capex layer */'

h=src('base','dashboard-base.html')
logo=src('brand','tejas-logo.svg')
uri=lambda svg:'data:image/svg+xml;base64,'+base64.b64encode(svg.encode('utf-8')).decode('ascii')
# Square, white-backed official logo for browser tabs; the header uses the original artwork.
icon=logo.replace('width="84" height="46" viewBox="0 0 84 46"','width="96" height="96" viewBox="-6 -25 96 96"')
icon=icon.replace('\n<path','\n<rect x="-6" y="-25" width="96" height="96" rx="12" fill="white"/>\n<path',1)
h=put(h,'__TEJAS_LOGO_DATA_URI__',uri(logo))
h=put(h,'__TEJAS_ICON_DATA_URI__',uri(icon))
h=put(h,OPEN+'\n'+CLOSE,OPEN+'\n'+src('capex','step-capex-layer.js').rstrip('\n')+'\n'+CLOSE)
css=''.join(src('page03',f)+'\n' for f in PAGE03_CSS)+src('guide','guide.css')+'\n'
js=''.join(src('page03',f)+'\n' for f in PAGE03_JS)+src('guide','guide.js')+'\n'
h=put(h,'</style>\n</head><body>','</style>\n<style id="page03-review">\n'+css+'</style>\n</head><body>')
h=put(h,'\nrouteApp();\n</script>','\n'+js+'\nrouteApp();\n</script>')
open(out,'w',encoding='utf-8').write(h)
print('ok',len(h),out)
