/* Fromages AOP — appli pédagogique du cours de M. Hermand (lycée Ambroise Croizat) */
(function () {
"use strict";
const $ = id => document.getElementById(id);
const NB = " ";
/* typographie française : espace insécable avant : ; ! ? » et après « */
const typo = s => String(s).replace(/ ([:;!?»])/g, NB + "$1").replace(/« /g, "«" + NB);
const esc = s => typo(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fold = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const store = {
  get(k, d) { try { const v = localStorage.getItem("fromages-" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("fromages-" + k, JSON.stringify(v)); } catch (e) {} }
};

/* ================= DONNÉES ================= */
const PATE = {
  ppc:     { ab: "PPC",  nom: "Pâte pressée cuite",          c: "var(--p-ppc)",     ex: "Abondance, Beaufort, Comté", tip: true },
  ppnc:    { ab: "PPNC", nom: "Pâte pressée non cuite",      c: "var(--p-ppnc)",    ex: "Reblochon, Cantal, Ossau-Iraty…" },
  pers:    { ab: "PP",   nom: "Pâte persillée",              c: "var(--p-pers)",    ex: "Roquefort, Bleu d’Auvergne, Fourme d’Ambert…" },
  lavee:   { ab: "PMCL", nom: "Pâte molle à croûte lavée",   c: "var(--p-lavee)",   ex: "Munster, Maroilles, Époisses…", cr: "Croûte orangée" },
  fleurie: { ab: "PMCF", nom: "Pâte molle à croûte fleurie", c: "var(--p-fleurie)", ex: "Camembert de Normandie, Brie de Meaux, Chaource…", cr: "Croûte blanche" },
  chevre:  { ab: "C",    nom: "Chèvre",                      c: "var(--p-chevre)",  ex: "Crottin de Chavignol, Picodon, Mothais sur feuille…" }
};
const STEPS = [
  ["Caillage", "caillage", "Le lait est ensemencé avec de la présure et des ferments lactiques. Les protéines coagulent et donnent le caillé qui baigne dans un liquide résiduel : le sérum. Le lait peut subir un chauffage.", "Une main verse la présure dans une bassine en cuivre où le lait caille"],
  ["Égouttage", "egouttage", "Cette opération permet de séparer le caillé du sérum soit naturellement, soit par pressage.", "Le caillé égoutte dans une toile suspendue au-dessus d’une jatte"],
  ["Moulage", "moulage", "Le caillé est placé dans un moule perforé pour faciliter l’égouttage. Ce dernier donnera la forme au fromage.", "Des mains remplissent de caillé des moules perforés"],
  ["Salage", "salage", "Les fromages sont régulièrement salés soit à la main à l’aide de gros sel, soit en les plongeant dans un bain de saumure (eau saturée en sel).", "Une main frotte un fromage au gros sel, à côté d’un bac de saumure"],
  ["Affinage", "affinage", "Il consiste à conduire la maturation du fromage. Dans une cave où humidité, température et aération sont spécialement étudiées, les fromages vont mûrir. Le caillé va se transformer en pâte, prendre un goût et acquérir une odeur caractéristique.", "Une cave voûtée remplie de meules sur des planches, éclairée par une lanterne"]
];
const R = AOP.regions;                       // 13 régions, ordre du cours
const RID = {}; R.forEach((r, i) => { r.ord = i + 1; r.slug = slug(r.nom); RID[r.id] = r; });
const F = AOP.fromages;                      // 49 fiches (Chaource et Époisses dans 2 régions)
F.forEach(f => { f.slug = slug(f.nom); f.key = f.region_id + "-" + f.slug; f.kind = "aop"; });
const byName = {}; F.forEach(f => { (byName[f.nom] = byName[f.nom] || []).push(f); });
const U = Object.values(byName).map(l => Object.assign({}, l[0], { regions: l.map(x => x.region) }));   // 47 AOP uniques
R.forEach(r => { r.list = F.filter(f => f.region_id === r.id); r.n = r.list.length; });
const E = window.ETRANGERS; E.forEach(e => { e.slug = slug(e.nom); e.kind = "etr"; e.key = "e-" + e.slug;
  e.pate_code = (Object.entries(PATE).find(([k, p]) => p.nom === e.pate) || ["autre"])[0]; });
const COUNTRIES = [...new Set(E.map(e => e.pays))];
const LAITS = [["Vache", U.filter(f => f.lait === "Vache").length, "#C9A27A"], ["Chèvre", U.filter(f => f.lait === "Chèvre").length, "#E8DCC0"], ["Brebis", U.filter(f => f.lait === "Brebis").length, "#F4EFE6"]];
const fabSrc = (k, w) => `img/fab/fab-${k}-${w}.webp`;
/* le, la ou l’ devant le nom d’un fromage */
const FEM = ["Fourme d’Ambert", "Fourme de Montbrison", "Tome des Bauges", "Rigotte de Condrieu", "Brousse du Rove", "Mozzarella", "Feta"];
const art = n => FEM.includes(n) ? "la " : /^[AEÉÈIOUYH]/i.test(n) ? "l’" : "le ";
const Art = n => { const a = art(n); return a[0].toUpperCase() + a.slice(1); };
const EN = n => ({ "Grand Est": "dans le Grand Est", "Hauts-de-France": "dans les Hauts-de-France", "Pays de la Loire": "dans les Pays de la Loire" }[n] || "en " + n);
const DE_PAYS = { "Royaume-Uni": "du Royaume-Uni", "Suisse": "de Suisse", "Italie": "d’Italie", "Espagne": "d’Espagne", "Pays-Bas": "des Pays-Bas", "Grèce": "de Grèce" };

/* ================= TROPHÉES ================= */
const TROPHIES = [
  ["etapes",  "Du lait au fromage",  "Parcourir les 5 étapes de la fabrication"],
  ["explo",   "Explorateur",          "Ouvrir les 11 régions qui ont des fromages AOP"],
  ["fiches",  "Fin connaisseur",      "Ouvrir les fiches des 47 fromages AOP"],
  ["monde",   "Curieux du monde",     "Ouvrir les fiches des 8 fromages étrangers"],
  ["q-fab",   "Apprenti fromager",    "8 sur 10 au quiz Fabrication"],
  ["q-reg",   "Tour de France",       "8 sur 10 au quiz AOP des régions"],
  ["q-photo", "Œil de l’affineur",    "8 sur 10 au quiz Photos"],
  ["q-pate",  "Maître des pâtes",     "8 sur 10 au quiz Familles de pâtes"],
  ["q-etr",   "Globe-trotteur",       "8 sur 10 au quiz Fromages étrangers"],
  ["c10",     "Contrôle réussi",      "Au moins 10 sur 20 au contrôle blanc"],
  ["c16",     "Mention très bien",    "Au moins 16 sur 20 au contrôle blanc"],
  ["c20",     "Sans faute",           "20 sur 20 au contrôle blanc"]
];
const won = new Set(store.get("trophees", []));
const seen = { steps: new Set(store.get("vu-etapes", [])), regions: new Set(store.get("vu-regions", [])), fiches: new Set(store.get("vu-fiches", [])), etr: new Set(store.get("vu-etrangers", [])) };
function saveSeen() { store.set("vu-etapes", [...seen.steps]); store.set("vu-regions", [...seen.regions]); store.set("vu-fiches", [...seen.fiches]); store.set("vu-etrangers", [...seen.etr]); }
function win(id) {
  if (won.has(id)) return;
  won.add(id); store.set("trophees", [...won]);
  const t = TROPHIES.find(x => x[0] === id); say("Trophée débloqué · " + t[1]);
  updateTroLink();
}
function checkSeen() {
  if (seen.steps.size >= 5) win("etapes");
  if (R.filter(r => r.n).every(r => seen.regions.has(r.id))) win("explo");
  if (U.every(f => seen.fiches.has(f.nom))) win("fiches");
  if (E.every(e => seen.etr.has(e.nom))) win("monde");
}
function updateTroLink() { $("troLink").textContent = `Mes trophées · ${won.size} sur ${TROPHIES.length}`; }

/* ================= PETITS OUTILS ================= */
let tt;
function say(t) { const el = $("toast"); el.textContent = typo(t); el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2600); }

/* glisser du doigt : l'élément suit le doigt, puis se cale en douceur */
function dragger(el, { onMove, onEnd }) {
  let d = null;
  el.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && e.button !== 0) return; d = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, lock: null, id: e.pointerId }; });
  el.addEventListener("pointermove", e => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.lock && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) { d.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y"; if (d.lock === "x") { try { el.setPointerCapture(d.id); } catch (_) {} } }
    if (d.lock === "x") { d.dx = dx; onMove(dx); }
  });
  const end = e => { if (!d || e.pointerId !== d.id) return; const dd = d; d = null; if (dd.lock === "x") onEnd(dd.dx, dd.dx / Math.max(1, performance.now() - dd.t)); };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
}

/* ================= NAVIGATION (le bouton retour du téléphone fonctionne) ================= */
const views = [...document.querySelectorAll(".view")];
const norm = h => (h && h !== "#") ? h : "#accueil";
const stack = [norm(location.hash)];
function go(name) { if (location.hash !== "#" + name) location.hash = name; else route(); }
function backTo(name) { if (stack.length > 1 && stack[stack.length - 2] === "#" + name) history.back(); else go(name); }
let glossFrom = null;
const scrollMemo = {};
window.addEventListener("hashchange", () => {
  const h = norm(location.hash); let back = false;
  if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); back = true; } else if (stack[stack.length - 1] !== h) stack.push(h);
  route(back);
});
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g) { if (g.closest(".tabbar")) glossFrom = null; go(g.dataset.go); return; }
  const q = e.target.closest("[data-quiz]"); if (q) { startQuiz(q.dataset.quiz); return; }
  const gl = e.target.closest("[data-gloss]"); if (gl) { openGloss(gl.dataset.gloss); return; }
});

let lastView = null, curRegion = null;
function route(back) {
  if (lastView && $("sheet").hidden) scrollMemo[lastView] = window.scrollY;
  const h = location.hash.slice(1);
  let v = "home", fiche = null, parent = null, title = "";
  if (["fabrication", "regions", "etrangers", "glossaire", "quiz", "trophees", "credits"].includes(h)) v = h;
  else if (h === "jeu") v = game ? "jeu" : "quiz";
  else if (h.startsWith("fiche-")) { const f = F.find(x => "fiche-" + x.key === h); if (f) { v = "region"; curRegion = RID[f.region_id]; fiche = { ctx: "region", item: f }; } }
  else if (h.startsWith("etranger-")) { const x = E.find(e => "etranger-" + e.slug === h); if (x) { v = "etrangers"; fiche = { ctx: "etr", item: x }; } }
  else if (h.startsWith("gl-")) { const x = GALL.find(g => "gl-" + g.key === h); if (x) { v = "glossaire"; fiche = { ctx: "gl", item: x }; } }
  else { const r = R.find(x => x.slug === h && x.n); if (r) { v = "region"; curRegion = r; } }
  if (v === "region") renderRegion(curRegion);
  if (v === "quiz") renderModes();
  if (v === "trophees") renderTrophies();
  if (v === "regions") renderRegionList();
  if (v === "glossaire" && !fiche) renderGloss();
  const viewId = "v-" + (v === "home" ? "home" : v);
  views.forEach(x => x.hidden = x.id !== viewId);
  const cur = $(viewId), home = v === "home";
  $("bar").hidden = home;
  const dynParent = v === "glossaire" && glossFrom && glossFrom !== "glossaire" ? glossFrom : null;
  $("bar").classList.toggle("top", !cur.dataset.parent && !dynParent);
  const tab = { home: "home", region: "regions", jeu: "quiz", trophees: "home", credits: "home" }[v] || v;
  document.querySelectorAll(".tabbar [data-tab]").forEach(b => b.dataset.tab === tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  title = v === "region" ? curRegion.nom : v === "jeu" ? "Quiz · " + MODES.find(x => x[0] === game.mode)[1] : cur.dataset.title;
  $("barT").textContent = title;
  parent = dynParent || cur.dataset.parent || "accueil";
  const labels = { regions: "Régions", quiz: "Quiz", accueil: "Accueil", fabrication: "Fabrication", etrangers: "Étrangers", glossaire: "Glossaire", trophees: "Trophées", credits: "Crédits" };
  const pr = R.find(r => r.slug === parent);
  $("backLbl").textContent = labels[parent] || (pr ? pr.nom : "Retour");
  $("back").onclick = () => { if (v === "jeu" && game && !game.done && !confirmLeave()) return; backTo(parent); };
  if (fiche) openFiche(fiche); else closeFiche();
  const key = viewId + (v === "region" ? curRegion.id : "");
  if (key !== lastView && !fiche) { const y = back && scrollMemo[key] ? scrollMemo[key] : 0; window.scrollTo(0, y); requestAnimationFrame(() => window.scrollTo(0, y)); }
  lastView = key;
  document.title = home ? "Fromages AOP" : title + " · Fromages AOP";
}
function confirmLeave() { return true; }

/* ================= FABRICATION ================= */
$("laits").innerHTML = LAITS.map(([n, c, col]) => `<button class="chip" type="button" data-gloss="lait=${fold(n)}"><i style="background:${col}"></i>${n} · ${c} AOP <b aria-hidden="true">›</b></button>`).join("");
$("pates").innerHTML = Object.entries(PATE).map(([k, p]) => `<button class="card pate" type="button" data-gloss="pate=${k}"><div class="ab" style="background:color-mix(in srgb, ${p.c} 30%, var(--surface));border-color:${p.c}">${p.ab}</div><div class="nm">${p.nom}</div><div class="ct">${U.filter(f => f.pate_code === k).length} AOP</div><div class="ex">${esc(p.ex)}${p.cr ? "<br>" + p.cr : ""}${p.tip ? '<br><span class="tip">Pour retenir · <b>A B C</b></span>' : ""}<em>Voir les fromages ›</em></div></button>`).join("");
let si = 0; const track = $("track"), view = $("stepView"), LAST = STEPS.length - 1;
track.innerHTML = STEPS.map((st, i) => `<div class="slide" aria-roledescription="étape" aria-label="Étape ${i + 1} sur 5"><div class="step-img"><img src="${fabSrc(st[1], 640)}" srcset="${fabSrc(st[1], 640)} 640w, ${fabSrc(st[1], 1200)} 1200w" sizes="(min-width:900px) 844px, 100vw" alt="${esc(st[3])}" draggable="false" width="1200" height="896" ${i ? 'loading="lazy"' : ""}></div><div class="step-txt"><div class="n">Étape ${i + 1} sur 5</div><h4>${st[0]}</h4><p>${esc(st[2])}</p></div></div>`).join("");
const slides = [...track.children];
$("strip").innerHTML = STEPS.map((st, i) => `<button type="button" role="tab" data-step="${i}">${i + 1}. ${st[0]}</button>`).join("");
$("dots").innerHTML = STEPS.map(() => "<span></span>").join("");
function showStep(i) {
  si = Math.max(0, Math.min(LAST, i));
  track.style.transform = `translateX(${-si * 100}%)`;
  slides.forEach((sl, k) => { sl.setAttribute("aria-hidden", k !== si); sl.inert = k !== si; });
  document.querySelectorAll("#strip button").forEach((b, k) => b.setAttribute("aria-current", k === si ? "step" : "false"));
  document.querySelectorAll("#dots span").forEach((d, k) => d.classList.toggle("on", k === si));
  $("stepPrev").disabled = si === 0; $("stepNext").disabled = si === LAST;
  const b = document.querySelector(`#strip [data-step="${si}"]`), st = $("strip");
  if (b) st.scrollTo({ left: b.offsetLeft - st.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
  if (!$("v-fabrication").hidden) { seen.steps.add(si); saveSeen(); checkSeen(); }
}
$("strip").addEventListener("click", e => { const b = e.target.closest("[data-step]"); b && showStep(+b.dataset.step); });
$("stepPrev").onclick = () => showStep(si - 1); $("stepNext").onclick = () => showStep(si + 1);
dragger(view, {
  onMove(dx) { let x = dx; if ((si === 0 && x > 0) || (si === LAST && x < 0)) x *= .3; track.classList.add("dragging"); view.classList.add("dragging"); track.style.transform = `translateX(calc(${-si * 100}% + ${x}px))`; },
  onEnd(dx, v) { track.classList.remove("dragging"); view.classList.remove("dragging"); const w = view.clientWidth; let n = si; if (dx < -w * .2 || v < -.45) n = si + 1; else if (dx > w * .2 || v > .45) n = si - 1; showStep(n); }
});
showStep(0);
new MutationObserver(() => { if (!$("v-fabrication").hidden) { seen.steps.add(si); saveSeen(); checkSeen(); } }).observe($("v-fabrication"), { attributes: true, attributeFilter: ["hidden"] });

/* ================= CARTE ET LISTE DES RÉGIONS ================= */
const byCode = {}; R.forEach(r => byCode[r.code] = r);
$("map").innerHTML = R.map(r => `<a href="#${r.n ? r.slug : ""}" class="${r.n ? "" : "none"}" data-reg="${r.id}" aria-label="${esc(r.nom)}, ${r.n ? r.n + " AOP" : "aucune AOP"}"><path d="${AOP.map[r.code]}" fill="${r.n ? r.c : "url(#hatch)"}"/></a>`).join("")
  + `<g aria-hidden="true">${AOP.labels.map(([code, x, y, lines]) => { const r = byCode[code];
      return `<text x="${x}" y="${y}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? 9 : 0}">${esc(l)}</tspan>`).join("")}<tspan x="${x}" dy="9" class="${r.n ? "cnt" : "none"}">${r.n ? r.n + " AOP" : "aucune"}</tspan></text>`; }).join("")}</g>`;
$("map").addEventListener("click", e => { const a = e.target.closest("[data-reg]"); if (!a) return; e.preventDefault(); openRegion(a.dataset.reg); });
function renderRegionList() {
  $("rlist").innerHTML = R.map(r => `<li><button class="rrow ${r.n ? "" : "none"}" type="button" data-reg="${r.id}"><span class="no">${r.ord}</span><i style="background:${r.c}"></i><span class="nm">${esc(r.nom)}</span><span class="ct">${r.n ? r.n + " AOP" : "aucune AOP"}</span>${seen.regions.has(r.id) ? '<span class="seen" title="Déjà visitée" aria-label="déjà visitée">✓</span>' : ""}</button></li>`).join("");
}
$("rlist").addEventListener("click", e => { const b = e.target.closest("[data-reg]"); b && openRegion(b.dataset.reg); });
function openRegion(id) { const r = RID[id]; if (!r.n) { say(r.nom + " n’a pas de fromage AOP."); return; } go(r.slug); }

/* ================= UNE RÉGION ================= */
let filt = "all", filtRegion = null;
function renderRegion(r) {
  if (filtRegion !== r.id) { filt = "all"; filtRegion = r.id; }
  seen.regions.add(r.id); saveSeen(); checkSeen();
  $("rImg").src = `img/reg/${r.id}.webp`; $("rImg").alt = "Aquarelle de la région " + r.nom;
  $("rEb").textContent = `Région ${r.ord} sur 13`;
  $("rName").textContent = r.nom;
  const shared = r.list.filter(f => byName[f.nom].length > 1).map(f => f.nom);
  $("rLead").innerHTML = esc(`${r.n} fromage${r.n > 1 ? "s" : ""} AOP` + (shared.length ? `, dont ${shared.join(" et ")}, aussi produit${shared.length > 1 ? "s" : ""} dans une autre région.` : "."));
  const fams = Object.keys(PATE).filter(k => r.list.some(f => f.pate_code === k));
  $("filters").hidden = fams.length < 2;
  $("filters").innerHTML = `<button type="button" data-f="all" aria-pressed="${filt === "all"}">Tous · ${r.n}</button>` + fams.map(k => `<button type="button" data-f="${k}" aria-pressed="${filt === k}"><i style="background:${PATE[k].c}"></i>${PATE[k].ab} · ${r.list.filter(f => f.pate_code === k).length}</button>`).join("");
  drawGrid(r);
  const withAop = R.filter(x => x.n), i = withAop.indexOf(r), prev = withAop[i - 1], next = withAop[i + 1];
  $("rnav").innerHTML = (prev ? `<button class="cta ghost" type="button" data-go="${prev.slug}">‹ ${esc(prev.nom)}</button>` : "<span></span>") + (next ? `<button class="cta ghost" type="button" data-go="${next.slug}">${esc(next.nom)} ›</button>` : "");
}
function visible(r) { return r.list.filter(f => filt === "all" || f.pate_code === filt); }
function drawGrid(r) {
  $("grid").innerHTML = visible(r).map(f => `<button class="fc" type="button" data-fiche="${f.key}"><img src="${f.mini}" alt="" loading="lazy" width="360" height="270"><span class="b"><span class="nm">${esc(f.nom)}</span><span class="mt"><i style="background:${PATE[f.pate_code].c}"></i>${PATE[f.pate_code].ab} · ${esc(f.lait)}</span></span></button>`).join("");
}
$("filters").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; filt = b.dataset.f; document.querySelectorAll("#filters button").forEach(x => x.setAttribute("aria-pressed", x === b)); drawGrid(curRegion); });
$("grid").addEventListener("click", e => { const b = e.target.closest("[data-fiche]"); b && go("fiche-" + b.dataset.fiche); });

/* ================= FROMAGES ÉTRANGERS ================= */
$("etrList").innerHTML = COUNTRIES.map(c => {
  const l = E.filter(e => e.pays === c);
  return `<section class="country"><h3>${esc(c)} <span>${l.length} fromage${l.length > 1 ? "s" : ""}</span></h3><div class="grid">${l.map(e => `<button class="fc" type="button" data-etr="${e.slug}">${e.mini ? `<img src="${e.mini}" alt="" loading="lazy" width="360" height="270">` : `<span class="noimg" aria-hidden="true">${esc(e.nom[0])}</span>`}<span class="b"><span class="nm">${esc(e.nom)}</span><span class="mt">${esc(e.lait)} · ${esc(e.pate)}</span></span></button>`).join("")}</div></section>`;
}).join("");
$("etrList").addEventListener("click", e => { const b = e.target.closest("[data-etr]"); b && go("etranger-" + b.dataset.etr); });

/* ================= GLOSSAIRE ================= */
const GALL = U.map(f => Object.assign(f, { kind: "aop" })).concat(E);   // 47 AOP + 8 étrangers
GALL.forEach(g => { g.hay = fold([g.nom, g.kind === "aop" ? g.regions.join(" ") : g.pays + " " + g.origine, g.lait, g.kind === "aop" ? PATE[g.pate_code].nom + " " + PATE[g.pate_code].ab : g.pate, g.kind === "etr" ? "etranger" : "aop france"].join(" ")); });
const GF = { q: "", ori: "all", lait: "all", pate: "all", reg: "all", sort: "az" };
const laitOf = g => ["vache", "chevre", "brebis"].filter(l => fold(g.lait).includes(l));
function segs(id, key, opts) {
  $(id).innerHTML = opts.map(([v, t, c]) => `<button type="button" data-v="${v}" aria-pressed="${GF[key] === v}">${c ? `<i style="background:${c}"></i>` : ""}${t}</button>`).join("");
}
function drawGlossFilters() {
  segs("gOri", "ori", [["all", "Tous"], ["aop", "AOP de France"], ["etr", "Étrangers"]]);
  segs("gLait", "lait", [["all", "Tous"], ["vache", "Vache"], ["chevre", "Chèvre"], ["brebis", "Brebis"]]);
  segs("gPate", "pate", [["all", "Toutes"]].concat(Object.entries(PATE).map(([k, p]) => [k, p.ab, p.c])).concat(GF.ori === "aop" ? [] : [["autre", "Autres"]]));
  $("gReg").innerHTML = `<option value="all">Toutes</option>` + R.filter(r => r.n).map(r => `<option value="${r.id}">${esc(r.nom)}</option>`).join("");
  $("gReg").value = GF.reg; $("gSort").value = GF.sort; $("gq").value = GF.q;
}
[["gOri", "ori"], ["gLait", "lait"], ["gPate", "pate"]].forEach(([id, key]) => $(id).addEventListener("click", e => {
  const b = e.target.closest("[data-v]"); if (!b) return; GF[key] = b.dataset.v;
  if (key === "ori" && GF.ori === "aop" && GF.pate === "autre") GF.pate = "all";
  if (key === "ori" && GF.ori === "etr") GF.reg = "all";
  drawGlossFilters(); drawGloss();
}));
$("gReg").addEventListener("change", () => { GF.reg = $("gReg").value; if (GF.reg !== "all" && GF.ori === "etr") GF.ori = "all"; drawGlossFilters(); drawGloss(); });
$("gSort").addEventListener("change", () => { GF.sort = $("gSort").value; drawGloss(); });
$("gq").addEventListener("input", () => { GF.q = $("gq").value; drawGloss(); });
$("gReset").addEventListener("click", () => { Object.assign(GF, { q: "", ori: "all", lait: "all", pate: "all", reg: "all" }); drawGlossFilters(); drawGloss(); $("gq").focus(); });
function glResults() {
  const words = fold(GF.q).split(/\s+/).filter(Boolean);
  let l = GALL.filter(g =>
    (GF.ori === "all" || g.kind === GF.ori) &&
    (GF.lait === "all" || laitOf(g).includes(GF.lait)) &&
    (GF.pate === "all" || g.pate_code === GF.pate) &&
    (GF.reg === "all" || (g.kind === "aop" && byName[g.nom].some(x => x.region_id === GF.reg))) &&
    words.every(w => g.hay.includes(w)));
  const az = (a, b) => a.nom.localeCompare(b.nom, "fr");
  const grp = g => {
    if (GF.sort === "az") return [0, fold(g.nom)[0].toUpperCase()];
    if (GF.sort === "reg") return g.kind === "aop" ? [RID[g.region_id].ord, g.region] : [100 + COUNTRIES.indexOf(g.pays), "Étranger · " + g.pays];
    if (GF.sort === "pate") { const ks = Object.keys(PATE); const i = ks.indexOf(g.pate_code); return i < 0 ? [99, "Autres pâtes"] : [i, PATE[g.pate_code].nom]; }
    const ls = laitOf(g);
    if (ls.length > 1) return [3, "Plusieurs laits"];
    return [{ vache: 0, chevre: 1, brebis: 2 }[ls[0]] ?? 4, { vache: "Lait de vache", chevre: "Lait de chèvre", brebis: "Lait de brebis" }[ls[0]] || "Autres laits"];
  };
  l.forEach(g => g._g = grp(g));
  return l.sort((a, b) => GF.sort === "az" ? az(a, b) : (a._g[0] - b._g[0]) || az(a, b));
}
function drawGloss() {
  const l = glResults();
  $("gCount").textContent = l.length + (l.length > 1 ? " fromages" : " fromage");
  if (!l.length) { $("gList").innerHTML = `<p class="gempty"><b>Aucun fromage trouvé</b>Essayez un autre mot ou effacez les filtres.</p>`; return; }
  let html = "", cur = null;
  l.forEach(g => {
    if (g._g[1] !== cur) { if (cur !== null) html += "</ul>"; cur = g._g[1]; html += `<h3 class="ghead">${esc(cur)}</h3><ul class="glist">`; }
    const p = PATE[g.pate_code];
    const where = g.kind === "aop" ? g.regions.join(" et ") : g.pays;
    html += `<li><button class="grow-row" type="button" data-gl="${g.key}">${g.mini ? `<img src="${g.mini}" alt="" loading="lazy" width="64" height="48">` : `<span class="ni" aria-hidden="true">${esc(g.nom[0])}</span>`}<span style="min-width:0"><span class="nm">${esc(g.nom)}</span><span class="mt">${esc(where)} · ${esc(g.lait)}</span></span><span class="pt">${p ? `<i style="background:${p.c}"></i>${p.ab}` : (g.kind === "etr" ? "Étranger" : "")}</span></button></li>`;
  });
  $("gList").innerHTML = html + "</ul>";
}
function renderGloss() { drawGlossFilters(); drawGloss(); }
/* depuis la Fabrication : « lait=vache », « pate=ppc », « reg=nor »… Le retour ramène à la page de départ. */
function openGloss(spec) {
  Object.assign(GF, { q: "", ori: "all", lait: "all", pate: "all", reg: "all" });
  spec.split("&").forEach(kv => { const [k, v] = kv.split("="); GF[k] = v; });
  glossFrom = norm(location.hash).slice(1);
  go("glossaire");
}
$("gList").addEventListener("click", e => { const b = e.target.closest("[data-gl]"); b && go("gl-" + b.dataset.gl); });
/* les AOP uniques prennent la clé de leur première région */
U.forEach(u => { u.key = byName[u.nom][0].key; });

/* ================= FICHE ================= */
let list = [], fi = 0, fctx = "region", busy = false, dragX = 0;
function openFiche(fc) {
  fctx = fc.ctx;
  if (fctx === "region") { list = visible(curRegion); fi = list.indexOf(fc.item); if (fi < 0) { list = curRegion.list; fi = list.indexOf(fc.item); } }
  else if (fctx === "gl") { list = glResults(); fi = list.indexOf(fc.item); if (fi < 0) { list = GALL; fi = GALL.indexOf(fc.item); } }
  else { list = E; fi = E.indexOf(fc.item); }
  fill();
  if ($("sheet").hidden) { $("sheet").hidden = false; document.body.style.overflow = "hidden"; $("fClose").focus({ preventScroll: true }); }
}
function fill() {
  const f = list[fi];
  const img = $("fImg");
  if (f.photo) { img.hidden = false; $("fNoImg").hidden = true; img.src = f.photo; img.alt = "Photo du fromage " + f.nom; }
  else { img.hidden = true; $("fNoImg").hidden = false; img.removeAttribute("src"); }
  $("fName").textContent = f.nom;
  if (f.kind === "aop") {
    const p = PATE[f.pate_code];
    $("fReg").textContent = f.region;
    $("fFacts").innerHTML = `<div><dt>Lait</dt><dd>${esc(f.lait)}</dd></div><div><dt>Pâte</dt><dd title="${p.nom}"><i style="background:${p.c}"></i>${p.ab}</dd></div><div><dt>Signe</dt><dd>AOP</dd></div>`;
    $("fPartH").textContent = "Particularités"; $("fPart").textContent = typo(f.particularites);
    const others = byName[f.nom].filter(x => x.region_id !== f.region_id);
    $("fAlso").hidden = !others.length; $("fAlso").textContent = others.length ? typo(`Aussi produit ${others.map(x => EN(x.region)).join(", ")}.`) : "";
    seen.fiches.add(f.nom);
  } else {
    $("fReg").textContent = f.pays;
    $("fFacts").innerHTML = `<div><dt>Pays</dt><dd>${esc(f.pays)}</dd></div><div><dt>Lait</dt><dd>${esc(f.lait)}</dd></div><div><dt>Pâte</dt><dd>${esc(f.pate)}</dd></div>`;
    $("fPartH").textContent = "À savoir"; $("fPart").textContent = typo(f.description);
    $("fAlso").hidden = false; $("fAlso").textContent = typo("Origine : " + f.origine + ".");
    seen.etr.add(f.nom);
  }
  saveSeen(); checkSeen();
  $("fCount").textContent = (fi + 1) + " / " + list.length;
  $("fPrev").disabled = fi === 0; $("fNext").disabled = fi === list.length - 1;
}
function ficheHash(f) { return fctx === "gl" ? "#gl-" + f.key : fctx === "region" ? "#fiche-" + f.key : "#etranger-" + f.slug; }
function step(dir, from = 0) {
  const img = $("fImg"), fb = document.querySelector(".fb"), w = $("ph").clientWidth, n = fi + dir;
  if (busy) return;
  img.style.transform = "";
  if (dir === 0 || n < 0 || n >= list.length) { if (from) img.animate([{ transform: `translateX(${from}px)` }, { transform: "translateX(0)" }], { duration: 320, easing: "cubic-bezier(.22,.8,.3,1)" }); return; }
  busy = true; fb.style.opacity = 0;
  const out = img.hidden ? Promise.resolve() : img.animate([{ transform: `translateX(${from}px)`, opacity: 1 }, { transform: `translateX(${-dir * w}px)`, opacity: .15 }], { duration: 200, easing: "ease-in" }).finished;
  out.then(() => {
    fi = n; const h = ficheHash(list[n]); history.replaceState(null, "", h); stack[stack.length - 1] = h; fill();
    fb.style.opacity = 1;
    if (img.hidden) { busy = false; return; }
    img.animate([{ transform: `translateX(${dir * w * .6}px)`, opacity: .15 }, { transform: "translateX(0)", opacity: 1 }], { duration: 340, easing: "cubic-bezier(.22,.8,.3,1)" }).finished.then(() => busy = false, () => busy = false);
  }, () => busy = false);
}
function closeFiche() { if ($("sheet").hidden) return; $("sheet").hidden = true; document.body.style.overflow = ""; }
const closeTarget = () => fctx === "gl" ? "glossaire" : fctx === "region" ? curRegion.slug : "etrangers";
$("fPrev").onclick = () => step(-1); $("fNext").onclick = () => step(1);
dragger($("ph"), {
  onMove(dx) { if (busy || $("fImg").hidden) return; let x = dx; if ((fi === 0 && x > 0) || (fi === list.length - 1 && x < 0)) x *= .3; dragX = x; $("fImg").style.transform = `translateX(${x}px)`; },
  onEnd(dx, v) { if (busy) return; const w = $("ph").clientWidth, x = dragX; dragX = 0; if (dx < -w * .2 || v < -.45) step(1, x); else if (dx > w * .2 || v > .45) step(-1, x); else step(0, x); }
});
$("fClose").onclick = () => backTo(closeTarget());
$("sheet").addEventListener("click", e => { if (e.target === $("sheet")) backTo(closeTarget()); });
document.addEventListener("keydown", e => {
  if ($("sheet").hidden) return;
  if (e.key === "Escape") backTo(closeTarget()); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1);
});

/* ================= QUIZ ================= */
const MODES = [
  ["fab",   "Fabrication",          "Les laits, les étapes, l’AOP et les chiffres", "var(--ocre)", "1"],
  ["reg",   "AOP des régions",      "Dans quelle région est produit ce fromage ?", "var(--accent)", "2"],
  ["photo", "Reconnaître à la photo","Quel est ce fromage ?",                        "var(--sauge)", "3"],
  ["pate",  "Familles de pâtes",    "PPC, PPNC, PP, PMCL, PMCF ou C ?",              "var(--p-pers)", "4"],
  ["etr",   "Fromages étrangers",   "Pays, lait et description",                    "var(--bleu)", "5"],
  ["ctrl",  "Contrôle blanc",       "Sur le modèle du contrôle, noté sur 20",       "var(--accent)", "20"]
];
function renderModes() {
  $("modes").innerHTML = MODES.map(([k, t, d, c, n]) => {
    const b = store.get("best-" + k, null);
    return `<button class="mode ${k === "ctrl" ? "big" : ""}" type="button" data-quiz="${k}"><span class="mi" style="background:color-mix(in srgb, ${c} 30%, var(--surface))">${n}</span><span><span class="t">${t}</span><span class="d">${esc(d)}</span>${b !== null ? `<span class="best">Meilleur score · ${b} sur ${k === "ctrl" ? 20 : 10}</span>` : ""}</span></button>`;
  }).join("");
}
/* fabrique une question : bonne réponse + mauvaises réponses */
function Q(q, good, bad, o = {}) { const opts = shuffle([good, ...pick([...new Set(bad)].filter(b => b !== good), 3)]); return Object.assign({ q, good, opts }, o); }
const regionNames = R.filter(r => r.n).map(r => r.nom);
const TRIO_PPC = "Abondance, Beaufort, Comté";

function qFab() {
  const out = [];
  STEPS.forEach(s => out.push(Q("Quelle étape de l’élaboration correspond à cette définition ?", s[0], STEPS.map(x => x[0]), { ctx: s[2], expl: `C’est le ${s[0].toLowerCase()}.` })));
  out.push(Q("Quelle est la première étape de l’élaboration d’un fromage ?", "Le caillage", ["L’égouttage", "Le moulage", "Le salage", "L’affinage"], { expl: "Tout commence par le caillage : le lait coagule et donne le caillé." }));
  for (let i = 0; i < 4; i++) out.push(Q(`Quelle étape vient juste après le ${STEPS[i][0].toLowerCase()} ?`, STEPS[i + 1][0], STEPS.map(x => x[0]).filter(x => x !== STEPS[i][0]), { expl: "Dans l’ordre : caillage, égouttage, moulage, salage, affinage." }));
  out.push(Q("Que veut dire AOP ?", "Appellation d’origine protégée", ["Association des origines paysannes", "Agriculture d’origine préservée", "Appellation officielle de production"], { expl: "AOP = Appellation d’origine protégée, un signe officiel européen." }));
  out.push(Q("Quel animal ne fournit pas de lait pour les fromages AOP français ?", "La bufflonne", ["La vache", "La chèvre", "La brebis"], { expl: "Les fromages AOP français sont faits au lait de vache, de chèvre ou de brebis." }));
  out.push(Q("Combien y a-t-il de fromages AOP en France ?", "47", ["32", "52", "75"], { expl: "47 depuis l’arrivée du Mothais sur feuille en juin 2026." }));
  out.push(Q("Combien de kilos de fromage un Français mange-t-il en moyenne par an ?", "Environ 27 kg", ["Environ 7 kg", "Environ 15 kg", "Environ 45 kg"], { expl: "Environ 27 kg par an et par habitant." }));
  out.push(Q("Quel rang occupe la France pour la consommation de fromage par habitant ?", "1ᵉʳ rang mondial", ["2ᵉ rang mondial", "5ᵉ rang mondial", "10ᵉ rang mondial"], { expl: "La France est le premier pays consommateur de fromage au monde." }));
  out.push(Q("Quelle région produit le plus de fromages au lait de vache ?", "Normandie", ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne"], { expl: "La Normandie est la 1ʳᵉ région productrice de fromages au lait de vache." }));
  out.push(Q("Comment s’appelle le liquide qui se sépare du caillé ?", "Le sérum", ["La saumure", "La présure", "Le ferment"], { expl: "Le caillé baigne dans un liquide résiduel : le sérum." }));
  out.push(Q("Qu’est-ce que la saumure ?", "De l’eau saturée en sel", ["Du lait caillé", "Un ferment lactique", "Une cave d’affinage"], { expl: "Au salage, on peut plonger les fromages dans un bain de saumure." }));
  out.push(Q("Avec quoi ensemence-t-on le lait au moment du caillage ?", "De la présure et des ferments lactiques", ["Du sel et de l’eau", "Du sucre et de la levure", "De la crème et du beurre"], { expl: "La présure et les ferments font coaguler les protéines du lait." }));
  out.push(Q("Où se déroule l’affinage ?", "Dans une cave", ["Dans une cuve en cuivre", "Dans un bain de saumure", "Dans un moule perforé"], { expl: "Dans une cave où humidité, température et aération sont étudiées." }));
  out.push(Q("À quoi sert le moule perforé ?", "À donner sa forme au fromage et à l’égoutter", ["À saler le fromage", "À faire cailler le lait", "À affiner le fromage"], { expl: "Le moule perforé facilite l’égouttage et donne la forme au fromage." }));
  return out;
}
function qRegionOf(f) {   // « Dans quelle région ? »
  const regs = byName[f.nom].map(x => x.region);
  return Q(`Dans quelle région est produit ${art(f.nom)}${f.nom} ?`, regs[0], regionNames.filter(n => !regs.includes(n)), { img: f.mini, expl: `${Art(f.nom)}${f.nom} est produit ${regs.map(EN).join(" et ")}.` });
}
function qReg() {
  const out = U.map(qRegionOf);
  R.filter(r => r.n).forEach(r => {
    const good = pick(r.list, 1)[0];
    const bad = U.filter(f => !byName[f.nom].some(x => x.region_id === r.id)).map(f => f.nom);
    out.push(Q(`Quel fromage AOP est produit ${EN(r.nom)} ?`, good.nom, bad, { expl: `${r.nom} : ${r.list.map(x => x.nom).join(", ")}.` }));
  });
  return out;
}
function qPhoto(f) {
  f = f || pick(U, 1)[0];
  const same = U.filter(x => x.nom !== f.nom && x.pate_code === f.pate_code).map(x => x.nom);
  const bad = same.length >= 3 ? same : same.concat(U.filter(x => x.nom !== f.nom).map(x => x.nom));
  return Q("Quel est ce fromage ?", f.nom, [...new Set(bad)], { img: f.photo, expl: `C’est ${art(f.nom)}${f.nom} (${f.region}).` });
}
function qPate() {
  const out = [];
  const names = Object.values(PATE).map(p => p.nom);
  U.forEach(f => out.push(Q(`À quelle famille de pâte appartient ${art(f.nom)}${f.nom} ?`, PATE[f.pate_code].nom, names, { img: f.mini, expl: `${Art(f.nom)}${f.nom} : ${PATE[f.pate_code].nom.toLowerCase()} (${PATE[f.pate_code].ab}).` })));
  Object.values(PATE).forEach(p => out.push(Q(`Que veut dire « ${p.ab} » ?`, p.nom, names, { expl: `${p.ab} = ${p.nom}.` })));
  Object.entries(PATE).forEach(([k, p]) => {
    const good = pick(U.filter(f => f.pate_code === k), 1)[0];
    const fam = k === "chevre" ? "un fromage de chèvre" : "une " + p.nom.toLowerCase();
    out.push(Q(`Quel fromage est ${fam} ?`, good.nom, U.filter(f => f.pate_code !== k).map(f => f.nom), { expl: `${Art(good.nom)}${good.nom} est ${fam} (${p.ab}).` }));
  });
  out.push(Q("De quelle couleur est la croûte d’une pâte molle à croûte lavée ?", "Orangée", ["Blanche", "Verte", "Jaune pâle"], { expl: "La croûte lavée est orangée, comme celle du Munster ou du Maroilles." }));
  out.push(Q("De quelle couleur est la croûte d’une pâte molle à croûte fleurie ?", "Blanche", ["Orangée", "Rouge", "Verte"], { expl: "La croûte fleurie est blanche, comme celle du Camembert." }));
  out.push(Q("Quels sont les 3 fromages AOP à pâte pressée cuite ?", TRIO_PPC, ["Abondance, Beaufort, Cantal", "Comté, Reblochon, Beaufort", "Abondance, Morbier, Comté"], { expl: "Pour retenir : A, B, C. Abondance, Beaufort, Comté." }));
  return out;
}
function qEtr() {
  const out = [];
  E.forEach(e => {
    out.push(Q(`De quel pays vient ${art(e.nom)}${e.nom} ?`, e.pays, COUNTRIES.concat(["France", "Allemagne", "Belgique"]), { img: e.mini, expl: `${Art(e.nom)}${e.nom} vient ${DE_PAYS[e.pays] || "de " + e.pays}.` }));
    out.push(Q("Quel fromage correspond à cette description ?", e.nom, E.map(x => x.nom), { ctx: e.description, expl: `C’est ${art(e.nom)}${e.nom} (${e.pays}).` }));
    if (e.photo) out.push(Q("Quel est ce fromage étranger ?", e.nom, E.map(x => x.nom), { img: e.photo, expl: `C’est ${art(e.nom)}${e.nom} (${e.pays}).` }));
  });
  out.push(Q("Quel fromage étranger est fait au lait de brebis ?", "Manchego", ["Cheddar", "Emmental", "Edam"], { expl: "Le Manchego est fait avec le lait des brebis de la Manche." }));
  out.push(Q("Quel fromage est conservé dans de la saumure ?", "Feta", ["Parmesan", "Gruyère", "Cheddar"], { expl: "La Feta grecque est conservée en saumure." }));
  out.push(Q("Quel fromage suisse a de grands trous ?", "Emmental", ["Gruyère", "Parmesan", "Manchego"], { expl: "L’Emmental a de grands trous, le Gruyère peu ou pas." }));
  return out;
}
const CTRL_REG = ["Cantal", "Comté", "Époisses", "Munster", "Maroilles", "Livarot", "Valençay", "Roquefort", "Ossau-Iraty", "Pélardon", "Banon", "Brocciu"];
function qCtrl() {
  const out = [];
  const P = (part, pts, q) => Object.assign(q, { part, pts });
  shuffle(STEPS).forEach(s => out.push(P("1ʳᵉ partie · Élaboration", .5, Q("Quelle étape correspond à cette définition ?", s[0], STEPS.map(x => x[0]), { ctx: s[2], expl: `C’est le ${s[0].toLowerCase()}.` }))));
  out.push(P("1ʳᵉ partie · Élaboration", .5, Q("Quels animaux produisent le lait des fromages AOP en France ?", "Vache, chèvre, brebis", ["Vache, bufflonne, chèvre", "Vache, brebis, jument", "Chèvre, brebis, bufflonne"], { expl: "Vache, chèvre et brebis." })));
  const names = Object.values(PATE).map(p => p.nom);
  shuffle(Object.values(PATE)).forEach(p => out.push(P("1ʳᵉ partie · Élaboration", .5, Q(`Donnez le nom complet de « ${p.ab} ».`, p.nom, names, { expl: `${p.ab} = ${p.nom}.` }))));
  pick(qPate().concat(qReg().slice(U.length)), 8).forEach(q => out.push(P("2ᵉ partie · QCM", .5, q)));
  pick(U, 4).forEach(f => out.push(P("2ᵉ partie · Reconnaître à la photo", 1, qPhoto(f))));
  pick(CTRL_REG, 6).forEach(n => out.push(P("3ᵉ partie · Les régions", 1, qRegionOf(U.find(f => f.nom === n)))));
  return out;
}
const GEN = { fab: qFab, reg: qReg, photo: () => pick(U, 10).map(f => qPhoto(f)), pate: qPate, etr: qEtr, ctrl: qCtrl };
let game = null;
function startQuiz(mode) {
  const all = GEN[mode]();
  const qs = mode === "ctrl" ? all : pick(all, 10);
  game = { mode, qs, i: 0, score: 0, answers: [], done: false };
  go("jeu"); renderQ();
}
function renderQ() {
  const g = game, q = g.qs[g.i], m = MODES.find(x => x[0] === g.mode), total = g.qs.length;
  $("jeu").innerHTML = `<div class="qtop"><div class="qbar"><span style="width:${g.i / total * 100}%"></span></div><span class="qnum">${g.i + 1} / ${total}</span></div>
    <p class="qpart">${esc(q.part ? q.part + (q.pts ? ` · ${String(q.pts).replace(".", ",")} pt` : "") : m[1])}</p>
    <h2 class="qq">${esc(q.q)}</h2>
    ${q.ctx ? `<p class="qctx">${esc(q.ctx)}</p>` : ""}
    ${q.img ? `<div class="qimg"><img src="${q.img}" alt="Photo du fromage à reconnaître" width="900" height="675"></div>` : ""}
    <div class="opts" role="group" aria-label="Réponses">${q.opts.map((o, k) => `<button class="opt" type="button" data-o="${k}"><span class="k">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
    <div id="fbk"></div>`;
  $("jeu").querySelector(".opts").addEventListener("click", answer);
  window.scrollTo(0, 0);
}
function answer(e) {
  const b = e.target.closest("[data-o]"); if (!b) return;
  const g = game, q = g.qs[g.i], chosen = q.opts[+b.dataset.o], ok = chosen === q.good;
  g.answers.push({ q, chosen, ok });
  if (ok) g.score += q.pts || 1;
  document.querySelectorAll("#jeu .opt").forEach((x, k) => { x.disabled = true; if (q.opts[k] === q.good) x.classList.add("good"); else if (x === b) x.classList.add("bad"); });
  const last = g.i === g.qs.length - 1;
  $("fbk").innerHTML = `<div class="fbk ${ok ? "good" : "bad"}">${ok ? "Bonne réponse" + NB + "!" : "Raté. La bonne réponse était" + NB + ": " + esc(q.good)}${q.expl ? `<p>${esc(q.expl)}</p>` : ""}</div>
    <button class="cta qnext" type="button" id="qNext">${last ? "Voir mon résultat" : "Question suivante"} <span aria-hidden="true">›</span></button>`;
  $("qNext").onclick = () => { if (last) finish(); else { g.i++; renderQ(); } };
  $("qNext").focus({ preventScroll: true });
  $("fbk").scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function finish() {
  const g = game; g.done = true;
  const max = g.mode === "ctrl" ? 20 : 10, sc = Math.round(g.score * 2) / 2;
  const best = store.get("best-" + g.mode, null); if (best === null || sc > best) store.set("best-" + g.mode, sc);
  if (g.mode === "ctrl") { if (sc >= 10) win("c10"); if (sc >= 16) win("c16"); if (sc >= 20) win("c20"); }
  else if (sc >= 8) win("q-" + g.mode);
  const r = sc / max;
  const msg = r === 1 ? "Parfait, sans aucune faute !" : r >= .8 ? "Excellent travail !" : r >= .5 ? "C’est bien, encore un effort." : "Relisez le cours et retentez votre chance.";
  let parts = "";
  if (g.mode === "ctrl") {
    const P = {}; g.answers.forEach(a => { const k = a.q.part.split(" · ")[0]; P[k] = P[k] || [0, 0]; P[k][1] += a.q.pts; if (a.ok) P[k][0] += a.q.pts; });
    parts = `<ul class="parts">${Object.entries(P).map(([k, [a, b]]) => `<li><span>${esc(k)}</span><b>${String(a).replace(".", ",")} / ${String(b).replace(".", ",")}</b></li>`).join("")}</ul>`;
  }
  const wrong = g.answers.filter(a => !a.ok);
  $("jeu").innerHTML = `<div class="card res"><p class="kicker">${esc(MODES.find(x => x[0] === g.mode)[1])}</p><div class="sc">${String(sc).replace(".", ",")}<small> / ${max}</small></div><p class="msg">${esc(msg)}</p>${parts}
    <div class="acts"><button class="cta" type="button" data-quiz="${g.mode}">Rejouer</button><button class="cta ghost" type="button" id="qMenu">Autre quiz</button></div></div>
    ${wrong.length ? `<div class="review"><h3>À revoir</h3><ol>${wrong.map(a => `<li>${esc(a.q.q)}${a.q.ctx ? ` <em>(${esc(a.q.ctx.slice(0, 60))}…)</em>` : ""}<br><span class="ans">${esc(a.q.good)}</span> · <span class="was">vous aviez répondu ${esc(a.chosen)}</span></li>`).join("")}</ol></div>` : ""}`;
  $("qMenu").onclick = () => backTo("quiz");
  window.scrollTo(0, 0);
}

/* ================= TROPHÉES ================= */
const CUP = (c1, c2) => `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="30" r="22" fill="${c1}" opacity=".35" filter="url(#wc)"/><path d="M22 14h20v10a10 10 0 0 1-20 0z" fill="${c2}" stroke="#2B2420" stroke-width="2" stroke-linejoin="round"/><path d="M22 17h-6a6 6 0 0 0 7 8M42 17h6a6 6 0 0 1-7 8" fill="none" stroke="#2B2420" stroke-width="2" stroke-linecap="round"/><path d="M29 34h6v6h-6zM24 46h16v-6H24z" fill="${c2}" stroke="#2B2420" stroke-width="2" stroke-linejoin="round"/></svg>`;
function renderTrophies() {
  $("troLead").innerHTML = `<span class="trocount">${won.size} sur ${TROPHIES.length}</span> trophées débloqués. Ils restent enregistrés sur ce téléphone.`;
  $("tros").innerHTML = TROPHIES.map(([id, t, d]) => { const ok = won.has(id); return `<div class="card tro ${ok ? "" : "lock"}">${CUP(ok ? "#D9A23A" : "#bbb", ok ? "#F1C75B" : "#ddd")}<span class="t">${esc(t)}</span><span class="d">${esc(d)}</span></div>`; }).join("");
}

/* ================= CRÉDITS ================= */
function licUrl(l) { const m = /CC\s*(BY(?:-SA|-ND|-NC)*)\s*([\d.]+)/i.exec(l || ""); if (m) return `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/deed.fr`; if (/CC0/i.test(l || "")) return "https://creativecommons.org/publicdomain/zero/1.0/deed.fr"; return ""; }
const credLine = (img, nom, c) => { const u = licUrl(c.licence); return `<li><img src="${img}" alt="" loading="lazy"><div><div class="t">${esc(nom)}</div><div class="m">${esc(c.auteur || "")} · ${u ? `<a href="${u}" target="_blank" rel="noopener">${esc(c.licence)}</a>` : esc(c.licence || "")} · <a href="${c.source}" target="_blank" rel="noopener">voir sur Wikimedia Commons</a></div></div></li>`; };
$("crIllu").innerHTML = [["img/fab/fab-laits-640.webp", "Les 3 laits et les 5 étapes de fabrication"], ["img/souris.webp", "La souris de l’accueil et l’icône de l’appli"], ["img/reg/ara.webp", "Les aquarelles des 13 régions"]].map(([s, t]) => `<li><img src="${s}" alt="" loading="lazy"><div><div class="t">${t}</div><div class="m">Aquarelles créées pour les applis de M. Hermand avec Google Flow</div></div></li>`).join("")
  + `<li><img src="img/logo-aop.webp" alt="" loading="lazy" style="object-fit:contain"><div><div class="t">Logo AOP</div><div class="m">Symbole officiel de l’Union européenne pour les appellations d’origine protégées</div></div></li>`;
$("crPhotos").innerHTML = U.filter(f => f.credit_photo).map(f => credLine(f.mini, f.nom, f.credit_photo)).join("");
const etrCred = E.filter(e => e.credit_photo);
$("crEtrH").hidden = !etrCred.length;
$("crEtr").innerHTML = etrCred.map(e => credLine(e.mini, e.nom, e.credit_photo)).join("");

/* ================= REMONTER EN HAUT ================= */
const totop = $("totop");
addEventListener("scroll", () => { if (scrollY > 500) totop.removeAttribute("data-off"); else totop.setAttribute("data-off", ""); }, { passive: true });
totop.onclick = () => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

updateTroLink();
route();

/* ================= LA SOURIS DE L'ACCUEIL ================= */
const stage = $("stage"), oWrap = $("oWrap"), lane = $("lane"), home = $("v-home");
const tiles = [...document.querySelectorAll(".menu .tile")];
const bites = [...oWrap.querySelectorAll(".bite")];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mouse = document.createElement("div"); mouse.className = "mouse"; mouse.setAttribute("aria-hidden", "true");
mouse.innerHTML = '<img alt="" src="img/souris.webp">'; stage.appendChild(mouse);
let MH = 79, MW = 96, SP = 1; const RATIO = 315 / 260, NOSE_X = .90, FEET = .93;
const wait = ms => new Promise(r => setTimeout(r, ms));
const rel = el => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
const place = (x, y) => { mouse.style.transform = `translate(${x}px,${y}px)`; };
function geom() { const o = rel(oWrap), l = rel(lane); MH = Math.round(Math.max(66, Math.min(104, o.h * 1.08))); MW = Math.round(MH * RATIO); mouse.style.width = MW + "px"; mouse.style.height = MH + "px"; return { o, y: l.y + l.h - 6 - MH * FEET, stop: o.x + o.w * .06 - MW * NOSE_X, w: stage.clientWidth }; }
if (reduce) { const g0 = geom(); place(g0.stop, g0.y); bites[0].style.transform = "scale(1)"; return; }
async function run(from, to, ms) {
  ms *= SP; mouse.classList.add("run"); const y = geom().y;
  const a = mouse.animate([{ transform: `translate(${from}px,${y}px)` }, { transform: `translate(${to}px,${y}px)` }], { duration: ms, easing: "cubic-bezier(.35,.1,.35,1)", fill: "forwards" });
  await a.finished; place(to, y); a.cancel(); mouse.classList.remove("run");
}
function biteAt(i) { bites[i].animate([{ transform: "scale(0)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 220, fill: "forwards", easing: "ease-out" }); }
const landed = new Map();
function crumbs(i, first) {
  const o = rel(oWrap), b = bites[i];
  const sx = o.x + o.w * (+b.getAttribute("cx") / 100), sy = o.y + o.h * (+b.getAttribute("cy") / 100);
  for (let k = 0; k < 3; k++) {
    const tile = tiles[(i * 3 + k) % tiles.length], t = rel(tile);
    const tx = t.x + 18 + Math.random() * (t.w - 36), ty = t.y - 5;
    const c = document.createElement("span"); c.className = "crumb"; const s = .7 + Math.random() * .7; stage.appendChild(c);
    const dx = tx - sx, dur = first ? 380 + Math.min(420, Math.abs(ty - sy) * .55) + k * 50 : 650 + Math.min(900, Math.abs(ty - sy) * 1.1) + k * 90;
    const a = c.animate([
      { transform: `translate(${sx}px,${sy}px) scale(${s}) rotate(0deg)` },
      { transform: `translate(${sx + dx * .35}px,${sy - 26 - Math.random() * 20}px) scale(${s}) rotate(120deg)`, offset: .25 },
      { transform: `translate(${tx}px,${ty}px) scale(${s}) rotate(300deg)`, offset: .85 },
      { transform: `translate(${tx}px,${ty - 7}px) scale(${s}) rotate(320deg)`, offset: .92 },
      { transform: `translate(${tx}px,${ty}px) scale(${s}) rotate(330deg)` }
    ], { duration: dur, delay: k * (first ? 35 : 70), easing: "linear", fill: "forwards" });
    a.finished.then(() => { onLand(tile, first); c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: first ? 150 : 500, fill: "forwards" }).finished.then(() => c.remove()); });
  }
}
function onLand(tile, first) {
  if (first) { const n = (landed.get(tile) || 0) + 1; landed.set(tile, n); if (n === 3) reveal(tile); }
  else tile.animate([{ transform: "rotate(0)" }, { transform: "rotate(-1deg) translateY(1px)" }, { transform: "rotate(.8deg)" }, { transform: "rotate(0)" }], { duration: 380 });
}
function reveal(tile) {
  if (tile.dataset.shown) return; tile.dataset.shown = 1; tile.style.opacity = "";
  tile.animate([{ opacity: 0, transform: "scale(.82)", filter: "blur(3px)" }, { opacity: 1, transform: "scale(1.03)", filter: "blur(0)", offset: .7 }, { opacity: 1, transform: "scale(1)" }], { duration: 520, easing: "ease-out" });
}
async function cycle(first) {
  while (document.hidden || home.hidden) await wait(500);
  const g0 = geom(); SP = first ? .5 : 1;
  await run(-MW - 30, g0.stop, 1700); SP = 1;
  mouse.classList.add("nibble"); await wait(first ? 120 : 320);
  for (let i = 0; i < bites.length; i++) { biteAt(i); if (!home.hidden) crumbs(i, first); await wait(first ? 300 : 560); }
  mouse.classList.remove("nibble"); await wait(260);
  mouse.classList.add("happy"); await wait(520); mouse.classList.remove("happy");
  await run(geom().stop, geom().w + 30, 1900);
  await wait(500);
  bites.forEach((b, i) => b.animate([{ transform: "scale(1)" }, { transform: "scale(0)" }], { duration: 900, delay: i * 220, fill: "forwards", easing: "ease-in-out" }));
  await wait(2400);
}
async function loop() {
  place(-MW - 30, geom().y);
  if (!home.hidden && !sessionStorageSeen()) { tiles.forEach(t => t.style.opacity = "0"); setTimeout(() => tiles.forEach(reveal), 3200); await wait(100); await cycle(true); }
  for (;;) { await cycle(false); }
}
/* l'apparition des rubriques ne se joue qu'une fois par visite */
function sessionStorageSeen() { try { const s = sessionStorage.getItem("fromages-intro"); sessionStorage.setItem("fromages-intro", "1"); return !!s; } catch (e) { return false; } }
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(loop, loop);
})();
