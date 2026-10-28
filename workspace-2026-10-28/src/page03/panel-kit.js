/* Page 03 right-hand panel kit: the one card anatomy every right-hand panel uses (see panel-kit.css).
   PK.card({title, sub, hero:[figure, unit], body, note, col, hc}) — col is the card's edge colour (its meaning), hc the hero colour if different.
   Body parts: PK.rows([{name, fig, why, sw}]), PK.led([{l, v, tot}]), PK.vis(html). Loaded before panels-b.js and panels-c.js. */
const PK={
  card:o=>`<section class="pc-card pk-card" style="--c:${o.col}${o.hc?`;--hc:${o.hc}`:''}"><h4 class="pk-title">${o.title}</h4>${o.sub?`<p class="pk-sub">${o.sub}</p>`:''}${o.hero?PK.hero(o.hero[0],o.hero[1]):''}${o.body||''}${o.note?`<p class="pk-note">${o.note}</p>`:''}</section>`,
  hero:(fig,unit='')=>`<div class="pk-hero"><b>${fig}</b>${unit?`<span>${unit}</span>`:''}</div>`,
  rows:a=>`<div class="pk-rows">${a.map(r=>`<div class="pk-row"><div class="pk-rh"><span>${r.sw?PK.sw(r.sw):''}${r.name}</span><b>${r.fig}</b></div>${r.why?`<small class="pk-why">${r.why}</small>`:''}</div>`).join('')}</div>`,
  led:a=>`<div class="pk-led">${a.map(r=>`<div class="pk-li${r.tot?' tot':''}"><span>${r.l}</span><b>${r.v}</b></div>`).join('')}</div>`,
  vis:h=>`<div class="pk-vis">${h}</div>`,
  sw:c=>`<i class="pk-sw" style="background:${c}"></i>`
};
