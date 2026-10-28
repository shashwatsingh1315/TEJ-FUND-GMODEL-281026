#!/usr/bin/env bash
# Runs every check on the dashboard. Run it before committing or publishing:  ./check-all.sh
# Steps 3-4 rewrite their own check reports and the cash-audit CSV in work/ and outputs/; that is expected.
set -euo pipefail
cd "$(dirname "$0")"
OUT=outputs/Tejas_Revenue_Dashboard_1041_Updated.html
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

echo "1/5  The built dashboard matches its sources"
python3 src/build.py "$tmp/built.html" >/dev/null
cmp -s "$tmp/built.html" "$OUT" || { echo "FAIL: $OUT is out of date. Run: python3 src/build.py"; exit 1; }

echo "2/5  The dashboard's scripts parse"
node -e '
const fs=require("fs"),{execFileSync}=require("child_process");
const html=fs.readFileSync(process.argv[1],"utf8"),blocks=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
blocks.forEach((js,i)=>{const f=process.argv[2]+"/s"+i+".js";fs.writeFileSync(f,js);execFileSync("node",["--check",f]);});
console.log("     "+blocks.length+" script blocks OK");' "$OUT" "$tmp"

echo "3/5  Capex phasing re-derived from the inputs"
node work/verify-step-capex.cjs | tail -1

echo "4/5  Financing and cash audit re-derived independently"
node work/verify-financing.cjs >/dev/null && echo "     verify-financing OK"
node work/audit-review.cjs >/dev/null && echo "     audit-review OK"

echo "5/5  Every page opens in a browser without errors"
node work/smoke-test.cjs

echo "All checks passed."
