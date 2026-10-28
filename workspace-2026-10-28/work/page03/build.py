import re,sys,os
d=os.path.dirname(os.path.abspath(__file__))+'/'
import os
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(d,'..','..','outputs','Tejas_Revenue_Dashboard_1041_Updated.html')
# optional right-panel fragments written in parallel: they load after the core files
opt=lambda ext:[f for f in ['panels-b'+ext,'panels-c'+ext] if os.path.exists(d+f)]
h=open(d+'orig.html',encoding='utf-8').read()
js=''.join(open(d+f,encoding='utf-8').read()+'\n' for f in ['p03a.js','p03b.js','p03c.js']+opt('.js'))
css=''.join(open(d+f,encoding='utf-8').read()+'\n' for f in ['p03.css']+opt('.css'))
def rep(s,a,b,count=1):
    assert s.count(a)==count,(a[:60],s.count(a))
    return s.replace(a,b)
# in-place: default inputs
h=rep(h,'  "debtMode": "none",\n  "debtCoverage": 50\n },','  "debtMode": "none",\n  "debtCoverage": 50,\n  "cadenceQ": 2,\n  "round2": 200\n },')
# in-place: guide text (seven -> six steps)
h=rep(h,'One chart built up in seven steps: revenue, margins, growth spending, how far short of cash the business gets, the raises and cash in the bank, what the first investor gets, and return on capital.','One chart built up in six steps: revenue, margins, growth spending and the funding need it creates, the raises and cash in the bank, what the first investor gets, and return on capital.')
h=rep(h,'</style>\n</head><body>','</style>\n<style id="page03-review">\n'+css+'</style>\n</head><body>')
h=rep(h,'\nrouteApp();\n</script>','\n'+js+'\nrouteApp();\n</script>')
open(out,'w',encoding='utf-8').write(h)
print('ok',len(h))
