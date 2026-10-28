# Page 03 (Capital Utilisation) source

The page 03 code in `outputs/Tejas_Revenue_Dashboard_1041_Updated.html` is built from these files; do not edit that part of the HTML by hand.

- `p03a.js`, `p03b.js`, `p03c.js`, `p03.css`: raise policy, chart toolkit and colour system, layout, tables, takeaways
- `panels-b.*`: right-hand panels for steps 1, 2 and 5; `panels-c.*`: steps 3, 4 and 6

Build (from this folder):

    git show 3db47f7:workspace-2026-10-28/outputs/Tejas_Revenue_Dashboard_1041_Updated.html > orig.html
    python3 build.py

`orig.html` is the dashboard before page 03 work, with the phased-capex layer (commit 3db47f7). `build.py` inserts the CSS and JS into it, sets the round-2 inputs and writes the dashboard; pass a path to write a preview instead.
