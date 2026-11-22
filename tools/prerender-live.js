#!/usr/bin/env node
// Schreibt die deutschen Texte (TX/TL aus dem Skript) fest in live/index.html,
// damit Suchmaschinen und Vorschauen den Inhalt ohne JavaScript sehen.
// Das Skript der Seite überschreibt sie beim Laden/Umschalten wie bisher.
// Nach jeder Textänderung in TX/TL ausführen:  node tools/prerender-live.js
// Wiederholbar: vorhandene Texte werden ersetzt.
const fs = require('fs'), path = require('path'), vm = require('vm');
const file = path.join(__dirname, '..', 'live', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const a = s.indexOf('const TX'), b = s.indexOf('// ---------------------------------------------------------------- Sprache');
if (a < 0 || b < a) throw new Error('TX-Block nicht gefunden');
const ctx = {};
vm.runInNewContext(s.slice(a, b) + '\n;this.TX = TX; this.TL = TL;', ctx);
const { TX, TL } = ctx;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const head = s.slice(0, a), tail = s.slice(a);       // nur das Markup vor dem Skript anfassen
let nT = 0, nL = 0, miss = [];
let out = head.replace(/(<(\w+)\b[^>]*\sdata-t="(\w+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, k, _old, close) => {
  if (!TX[k]) { miss.push(k); return m; }
  nT++; return open + esc(TX[k][1]) + close;
});
out = out.replace(/(<(ul|ol)\b[^>]*\sdata-li="(\w+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, k, _old, close) => {
  if (!TL[k]) { miss.push(k); return m; }
  nL++; return open + TL[k].map((x) => `<li>${esc(x[1])}</li>`).join('') + close;
});
fs.writeFileSync(file, out + tail);
console.log(`prerender: ${nT} Texte, ${nL} Listen` + (miss.length ? `, fehlend: ${miss.join(', ')}` : ''));
