"""Build the dashboard from its sources.

    python3 src/build.py            # writes outputs/Tejas_Revenue_Dashboard_1041_Updated.html
    python3 src/build.py out.html   # writes a preview somewhere else

Sources (all in this folder; see WORKING-ON-THE-DASHBOARD.md):
  base/dashboard-base.html  every page, styles, inputs and fonts; holds an empty capex-layer slot
  capex/step-capex-layer.js the capex phasing layer, inserted into that slot
  page03/*.css, page03/*.js page 03 (Funding & returns), appended after the base so it overrides it
"""
import os,sys
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
h=put(h,OPEN+'\n'+CLOSE,OPEN+'\n'+src('capex','step-capex-layer.js').rstrip('\n')+'\n'+CLOSE)
css=''.join(src('page03',f)+'\n' for f in PAGE03_CSS)
js=''.join(src('page03',f)+'\n' for f in PAGE03_JS)
h=put(h,'</style>\n</head><body>','</style>\n<style id="page03-review">\n'+css+'</style>\n</head><body>')
h=put(h,'\nrouteApp();\n</script>','\n'+js+'\nrouteApp();\n</script>')
open(out,'w',encoding='utf-8').write(h)
print('ok',len(h),out)
