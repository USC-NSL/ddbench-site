(function () {
  "use strict";

  const D = window.DDBENCH;
  const CASES = window.DDBENCH_CASES;
  const MODELS = Object.fromEntries(D.models.map((m) => [m.id, m]));
  const MINUS = "−";
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---------- DOM helpers ----------
  function setAttrs(node, attrs) {
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "on") {
        for (const [evt, fn] of Object.entries(v)) node.addEventListener(evt, fn);
      } else {
        node.setAttribute(k, v === true ? "" : v);
      }
    }
    return node;
  }
  function append(node, kids) {
    for (const kid of kids.flat(Infinity)) {
      if (kid === null || kid === undefined || kid === false) continue;
      node.append(kid);
    }
    return node;
  }
  const h = (tag, attrs, ...kids) => append(setAttrs(document.createElement(tag), attrs), kids);
  const s = (tag, attrs, ...kids) => append(setAttrs(document.createElementNS(SVG_NS, tag), attrs), kids);
  const byId = (id) => document.getElementById(id);

  const repoUrl = (path) => `${D.repo}/${path}`;

  // ---------- Formatting ----------
  const signed = (v, digits, suffix = "") => {
    if (v === 0) return "—";
    const abs = Math.abs(v).toFixed(digits);
    return (v > 0 ? "+" : MINUS) + abs + suffix;
  };
  const pct1 = (v) => v.toFixed(1);
  const usd = (v, digits) => "$" + v.toFixed(digits);

  // ---------- Tooltip ----------
  const tip = byId("tooltip");
  function fillTip(title, rows, desc) {
    tip.replaceChildren();
    if (title) tip.append(h("div", { class: "tt-title" }, title));
    for (const row of rows || []) {
      const line = h("div", { class: "tt-row" });
      if (row.color) line.append(h("span", { class: "tt-key", style: `background:var(${row.color})` }));
      line.append(h("span", { class: "tt-val" }, row.value));
      if (row.label) line.append(h("span", { class: "tt-lab" }, row.label));
      tip.append(line);
    }
    if (desc) tip.append(h("div", { class: "tt-desc" }, desc));
    tip.hidden = false;
  }
  function placeTip(x, y) {
    const pad = 12;
    const rect = tip.getBoundingClientRect();
    let left = x + pad;
    let top = y + pad;
    if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
    if (top + rect.height > window.innerHeight - 8) top = y - rect.height - pad;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  let tipFromPointer = false;
  window.addEventListener("scroll", () => { if (tipFromPointer) hideTip(); }, { passive: true });

  // Attaches hover and keyboard-focus tooltips to one chart mark.
  function bindTip(node, content, hooks = {}) {
    const show = () => fillTip(content.title, content.rows, content.desc);
    node.addEventListener("pointerenter", () => { tipFromPointer = true; show(); hooks.enter && hooks.enter(); });
    node.addEventListener("pointermove", (e) => placeTip(e.clientX, e.clientY));
    node.addEventListener("pointerleave", () => { hideTip(); hooks.leave && hooks.leave(); });
    node.addEventListener("focus", () => {
      tipFromPointer = false;
      show();
      const r = node.getBoundingClientRect();
      placeTip(r.left + r.width / 2, r.top + r.height / 2);
      hooks.enter && hooks.enter();
    });
    node.addEventListener("blur", () => { hideTip(); hooks.leave && hooks.leave(); });
  }

  // Every chart has a table twin so no value depends on hovering.
  function dataTable(mount, headers, rows, source) {
    mount.replaceChildren(
      h("details", { class: "data-details" },
        h("summary", null, "View data"),
        h("div", { class: "table-wrap" },
          h("table", null,
            h("thead", null, h("tr", null, headers.map((t) => h("th", { scope: "col" }, t)))),
            h("tbody", null, rows.map((r) => h("tr", null, r.map((c) => h("td", null, c))))))),
        source ? h("p", { class: "data-source" }, source) : null));
  }

  function legend(mount, items) {
    mount.replaceChildren(...items.map((it) => {
      const key = h("i", { class: `swatch ${it.round ? "round" : ""} ${it.hollow ? "hollow" : ""}`, style: `background:var(${it.color})` });
      return h("span", null, key, it.label);
    }));
  }

  // ---------- Leaderboard ----------
  const state = { tier: "tier1", sortKey: "sym", sortDir: "desc", openOnly: false };
  const COLS = [
    { key: "sym", label: "Symptom-only", short: "Sym.", dot: "--sym", dir: "desc" },
    { key: "ctx", label: "+ Context", short: "+ Ctx", dot: "--ctx", dir: "desc" },
    { key: "delta", label: "Gain (pp)", short: "Gain", dir: "desc" },
    { key: "costCtx", label: "Total cost", short: "Cost", dir: "asc" },
    { key: "costDelta", label: "Cost change", short: "Change", dir: "asc" },
  ];

  function sortedRows() {
    const tier = D.tiers[state.tier];
    const rows = D.models
      .filter((m) => !state.openOnly || m.open)
      .map((m) => ({ model: m, ...tier.rows[m.id] }));
    const sign = state.sortDir === "desc" ? -1 : 1;
    rows.sort((a, b) =>
      sign * (a[state.sortKey] - b[state.sortKey]) || b.ctx - a.ctx || b.sym - a.sym || a.model.name.localeCompare(b.model.name));
    // Ties share a rank and the next value takes the next number, as in the paper's Figure 6b.
    let rank = 0;
    let last = null;
    for (const r of rows) {
      if (r[state.sortKey] !== last) { rank += 1; last = r[state.sortKey]; }
      r.rank = rank;
    }
    return rows;
  }

  // Rates come from whole pass counts, so averaging over them keeps a filtered mean exact
  // instead of compounding rounded percentages.
  function averageOf(rows, cases) {
    const rate = (key) => rows.reduce((sum, r) => sum + Math.round((r[key] / 100) * cases), 0) / (rows.length * cases) * 100;
    const sym = rate("sym");
    const ctx = rate("ctx");
    return { sym, ctx, delta: ctx - sym };
  }

  function renderTabs() {
    const mount = byId("tier-tabs");
    const keys = Object.keys(D.tiers);
    mount.replaceChildren(...keys.map((key) => {
      const t = D.tiers[key];
      const selected = key === state.tier;
      return h("button", {
        class: "tab", role: "tab", type: "button", id: `tab-${key}`,
        "aria-selected": selected ? "true" : "false",
        "aria-controls": "lb-table",
        tabindex: selected ? "0" : "-1",
        on: {
          click: () => selectTier(key),
          keydown: (e) => {
            const i = keys.indexOf(key);
            let next = null;
            if (e.key === "ArrowRight") next = keys[(i + 1) % keys.length];
            if (e.key === "ArrowLeft") next = keys[(i - 1 + keys.length) % keys.length];
            if (next) { e.preventDefault(); selectTier(next); byId(`tab-${next}`).focus(); }
          },
        },
      }, t.label, h("small", null, h("span", { class: "label-long" }, `${t.cases} cases`), h("span", { class: "label-short" }, String(t.cases))));
    }));
  }

  function selectTier(key) {
    state.tier = key;
    renderTabs();
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const tier = D.tiers[state.tier];
    const rows = sortedRows();
    // All models show the paper's printed means; a filtered view averages only the rows it lists.
    const mean = state.openOnly ? averageOf(rows, tier.cases) : tier.mean;
    byId("tier-blurb").textContent = tier.blurb;
    byId("tier-mean").replaceChildren(
      h("span", { class: "mean-val" }, h("i", { class: "key-dot", style: "background:var(--sym)" }), `${pct1(mean.sym)}%`),
      h("span", { class: "mean-arrow", "aria-hidden": "true" }, "→"),
      h("span", { class: "mean-val" }, h("i", { class: "key-dot", style: "background:var(--ctx)" }), `${pct1(mean.ctx)}%`),
      h("span", { class: `mean-gain ${mean.delta < 0 ? "bad" : "good"}` }, `${signed(mean.delta, 1)} pp`),
      h("span", { class: "mean-label" }, state.openOnly ? "open-weight average" : "average pass rate"));

    const head = h("thead", null,
      h("tr", null,
        h("th", { class: "left sticky-a", scope: "col" }, "#"),
        h("th", { class: "left sticky-b", scope: "col" }, "Model"),
        h("th", { class: "left agent-col", scope: "col" }, "Agent"),
        COLS.map((c) => {
          const active = state.sortKey === c.key;
          return h("th", { scope: "col", "aria-sort": active ? (state.sortDir === "desc" ? "descending" : "ascending") : null },
            h("button", {
              class: "sort-btn", type: "button",
              on: {
                click: () => {
                  if (state.sortKey === c.key) state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
                  else { state.sortKey = c.key; state.sortDir = c.dir; }
                  renderLeaderboard();
                },
              },
            },
              c.dot ? h("i", { class: "key-dot", style: `background:var(${c.dot})` }) : null,
              h("span", { class: "label-long" }, c.label),
              h("span", { class: "label-short" }, c.short),
              h("span", { class: "caret", "aria-hidden": "true" }, active ? (state.sortDir === "desc" ? "▼" : "▲") : "")));
        })));

    const body = h("tbody", null, rows.map((r) => {
      const deltaClass = r.delta > 0 ? "good" : r.delta < 0 ? "bad" : "flat";
      const costClass = r.costDelta < 0 ? "good" : r.costDelta > 0 ? "bad" : "flat";
      const name = h("span", { class: "model-name" }, r.model.name);
      bindTip(name, { title: r.model.name, rows: [{ value: r.model.access, label: "access" }, { value: r.model.thinking, label: "thinking" }] });
      return h("tr", null,
        h("td", { class: "left rank sticky-a" }, String(r.rank)),
        h("th", { class: "left sticky-b model-th", scope: "row" },
          name,
          r.model.open ? h("span", { class: "open-tag" }, "open") : null,
          h("span", { class: "agent-inline" }, D.agent.name),
          h("span", { class: "visually-hidden" }, `${r.model.access}, thinking ${r.model.thinking}`)),
        h("td", { class: "left agent agent-col" }, h("a", { href: D.agent.url }, D.agent.name)),
        h("td", null,
          h("div", { class: "pct-wrap" },
            h("span", { class: "pct" }, pct1(r.sym)),
            h("span", { class: "bar bar-sym" }, h("span", { style: `width:${r.sym}%` })))),
        h("td", null,
          h("div", { class: "pct-wrap" },
            h("span", { class: "pct" }, pct1(r.ctx)),
            h("span", { class: "bar bar-ctx" }, h("span", { style: `width:${r.ctx}%` })))),
        h("td", null, h("span", { class: deltaClass }, signed(r.delta, 1))),
        h("td", null,
          h("span", { class: "cost-from" }, usd(r.costSym, tier.costDigits)),
          h("span", { class: "cost-arrow", "aria-hidden": "true" }, "→"),
          usd(r.costCtx, tier.costDigits)),
        h("td", null, h("span", { class: costClass }, signed(r.costDelta, 1, "%"))));
    }));

    byId("lb-table").replaceChildren(head, body);
  }

  // ---------- Links ----------
  function renderLinks() {
    const links = [
      { title: "GitHub repo", href: D.repo, primary: true },
      { title: "arXiv paper", href: D.paperUrl },
      { title: "Hugging Face dataset", href: D.datasetUrl },
    ];
    byId("link-row").replaceChildren(...links.map((l) => l.href
      ? h("a", { class: `link-btn ${l.primary ? "primary" : ""}`, href: l.href }, l.title)
      : h("span", { class: "link-btn disabled" }, l.title, h("small", null, "soon"))));

    for (const a of document.querySelectorAll("[data-repo-link]")) a.href = D.repo;
    for (const a of document.querySelectorAll("[data-repo-path]")) a.href = repoUrl(a.dataset.repoPath);
    const fp = byId("footer-paper");
    fp.replaceChildren(...[["Paper", D.paperUrl], ["Dataset", D.datasetUrl]]
      .filter(([, url]) => url)
      .map(([title, url]) => h("a", { href: url }, title)));
  }

  // ---------- Benchmark comparison ----------
  function renderCompare() {
    const mark = (yes, word) => {
      const icon = s("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" },
        s("path", { d: yes ? "M5 13l4 4L19 7" : "M7 7l10 10M17 7L7 17" }));
      return h("span", { class: `check ${yes ? "yes" : "no"}` }, icon,
        word || null,
        word ? null : h("span", { class: "visually-hidden" }, yes ? "Yes" : "No"));
    };
    byId("compare").replaceChildren(
      h("thead", null, h("tr", null,
        ["Benchmark", "Cross-process", "Code fix", "Executable oracle", "Debug context", "Languages"].map((t) => h("th", { scope: "col" }, t)))),
      h("tbody", null, D.comparison.map((b) => h("tr", { class: b.self ? "self" : null },
        h("th", { scope: "row" }, b.name),
        h("td", null, mark(b.crossProcess)),
        h("td", null, mark(b.codeFix)),
        h("td", null, mark(true, b.oracle)),
        h("td", null, mark(Boolean(b.context), b.context)),
        h("td", null, b.languages)))));
  }

  // ---------- Chart: cross-benchmark dumbbell ----------
  function renderCross(mount, width) {
    const narrow = width < 440;
    const m = { top: 62, right: 22, bottom: 34, left: narrow ? 86 : 92 };
    const rowH = narrow ? 40 : 52;
    const rows = D.crossBenchmark;
    const innerW = width - m.left - m.right;
    const innerH = rowH * rows.length;
    const x = (v) => m.left + (v / 100) * innerW;
    const y = (i) => m.top + rowH * i + rowH / 2;
    const svg = s("svg", { width, height: m.top + innerH + m.bottom, role: "img" });

    const ddVals = rows.map((r) => r.dd);
    const sweVals = rows.map((r) => r.swe);
    const ddMin = Math.min(...ddVals), ddMax = Math.max(...ddVals);
    const sweMin = Math.min(...sweVals), sweMax = Math.max(...sweVals);
    const ddSpread = Math.round(ddMax - ddMin);
    const sweSpread = Math.round(sweMax - sweMin);
    svg.setAttribute("aria-label", `Six models span ${sweSpread} percentage points on SWE-bench Verified and ${ddSpread} on DDBench Tier 1.`);

    svg.append(s("rect", { class: "band-sym", x: x(ddMin), y: m.top - 6, width: x(ddMax) - x(ddMin), height: innerH + 8, rx: 4 }));
    svg.append(s("rect", { class: "band-ref", x: x(sweMin), y: m.top - 6, width: x(sweMax) - x(sweMin), height: innerH + 8, rx: 4 }));
    const ddLabelX = x(ddMin + (ddMax - ddMin) * (narrow ? 0.3 : 0.5));
    svg.append(s("text", { class: "band-num", x: ddLabelX, y: m.top - 30, "text-anchor": "middle" }, `${ddSpread} pp`));
    svg.append(s("text", { class: "band-sub", x: ddLabelX, y: m.top - 12, "text-anchor": "middle" }, "on DDBench"));
    svg.append(s("text", { class: "band-num", x: x(100), y: m.top - 30, "text-anchor": "end" }, `${sweSpread} pp`));
    svg.append(s("text", { class: "band-sub", x: x(100), y: m.top - 12, "text-anchor": "end" }, "on SWE-bench"));

    for (const t of [0, 20, 40, 60, 80, 100]) {
      svg.append(s("line", { class: "grid-line", x1: x(t), x2: x(t), y1: m.top - 6, y2: m.top + innerH + 2 }));
      svg.append(s("text", { class: "tick", x: x(t), y: m.top + innerH + 20, "text-anchor": "middle" }, t === 100 ? "100%" : String(t)));
    }

    rows.forEach((r, i) => {
      const model = MODELS[r.id];
      const g = s("g", { class: "mark-group", tabindex: "0", role: "img", "aria-label": `${model.short}: ${r.swe}% on SWE-bench Verified, ${r.dd}% on DDBench Tier 1` });
      g.append(s("rect", { class: "hit", x: 0, y: y(i) - rowH / 2, width, height: rowH }));
      g.append(s("text", { class: "row-label", x: m.left - 10, y: y(i) + 5, "text-anchor": "end" }, model.short));
      g.append(s("line", { class: "connector", x1: x(r.dd), x2: x(r.swe), y1: y(i), y2: y(i) }));
      g.append(s("circle", { class: "dot-ref", cx: x(r.swe), cy: y(i), r: 6 }));
      g.append(s("circle", { class: "dot-sym", cx: x(r.dd), cy: y(i), r: 6 }));
      if (r.dd === ddMax || r.dd === ddMin) {
        g.append(s("text", { class: "val-strong", x: x(r.dd) + 6, y: y(i) - 11, "text-anchor": "end" }, `${r.dd}`));
      }
      if (r.swe === sweMax || r.swe === sweMin) {
        g.append(s("text", { class: "val", x: x(r.swe) - 6, y: y(i) - 11 }, `${r.swe}`));
      }
      bindTip(g, {
        title: model.name,
        rows: [
          { color: "--ref", value: `${r.swe}%`, label: "SWE-bench Verified" },
          { color: "--sym", value: `${r.dd}%`, label: "DDBench Tier 1" },
        ],
        desc: r.id === "gpt54" ? "SWE-bench score from Epoch AI." : "SWE-bench score reported by the vendor.",
      });
      svg.append(g);
    });

    svg.append(s("line", { class: "base-line", x1: m.left, x2: width - m.right, y1: m.top + innerH + 2, y2: m.top + innerH + 2 }));
    mount.replaceChildren(svg);
  }

  // ---------- Chart: cost vs pass rate ----------
  function renderPareto(mount, width) {
    const narrow = width < 440;
    const height = narrow ? 390 : 430;
    const m = { top: 28, right: 18, bottom: 48, left: 44 };
    const domain = [0.08, 3.2];
    const yMax = 80;
    const innerW = width - m.left - m.right;
    const innerH = height - m.top - m.bottom;
    const x = (v) => m.left + (Math.log10(v / domain[0]) / Math.log10(domain[1] / domain[0])) * innerW;
    const y = (v) => m.top + innerH - (v / yMax) * innerH;
    const svg = s("svg", { width, height, role: "img", "aria-label": "Each model moves up, left or both when given debug context. Weaker models move mostly up; stronger models mostly left." });
    const tier = D.tiers.tier1;

    for (const t of [0, 20, 40, 60, 80]) {
      svg.append(s("line", { class: t === 0 ? "base-line" : "grid-line", x1: m.left, x2: width - m.right, y1: y(t), y2: y(t) }));
      svg.append(s("text", { class: "tick", x: m.left - 8, y: y(t) + 5, "text-anchor": "end" }, t === 80 ? "80%" : String(t)));
    }
    for (const t of [0.1, 0.3, 1, 3]) {
      svg.append(s("line", { class: "grid-line", x1: x(t), x2: x(t), y1: m.top, y2: y(0) }));
      svg.append(s("text", { class: "tick", x: x(t), y: y(0) + 18, "text-anchor": "middle" }, "$" + (t < 1 ? t.toFixed(2) : t.toFixed(0))));
    }
    svg.append(s("text", { class: "axis-title", x: m.left + innerW / 2, y: height - 8, "text-anchor": "middle" }, "Cost per case (log scale)"));
    svg.append(s("text", { class: "axis-title", x: 0, y: 14 }, "Pass rate"));

    const points = D.models.map((model) => {
      const r = tier.rows[model.id];
      return { model, r, x1: x(r.costSym / tier.cases), y1: y(r.sym), x2: x(r.costCtx / tier.cases), y2: y(r.ctx) };
    });

    // Label placement: each label picks the clearest spot next to its own dot, then every
    // label gets another pick now that the others are known.
    const charW = 7.5;
    const labelH = 16;
    const labelOff = 9;
    const candidatesFor = (p) => {
      const w = p.model.short.length * charW;
      return [
        { x: p.x2 + labelOff, y: p.y2 - labelH / 2, anchor: "start" },
        { x: p.x2 - labelOff - w, y: p.y2 - labelH / 2, anchor: "end" },
        { x: p.x2 - w / 2, y: p.y2 - labelOff - labelH, anchor: "middle" },
        { x: p.x2 - w / 2, y: p.y2 + labelOff, anchor: "middle" },
        { x: p.x2 + labelOff - 2, y: p.y2 - labelH - 6, anchor: "start" },
        { x: p.x2 - labelOff + 2 - w, y: p.y2 - labelH - 6, anchor: "end" },
        { x: p.x2 + labelOff - 2, y: p.y2 + 6, anchor: "start" },
        { x: p.x2 - labelOff + 2 - w, y: p.y2 + 6, anchor: "end" },
      ].map((c) => ({ ...c, w, h: labelH }));
    };
    const distToBox = (px, py, b) => Math.hypot(
      Math.max(b.x - px, 0, px - (b.x + b.w)),
      Math.max(b.y - py, 0, py - (b.y + b.h)));
    const lineHits = (b, p) => {
      for (let t = 0; t <= 1; t += 0.04) {
        const px = p.x1 + (p.x2 - p.x1) * t;
        const py = p.y1 + (p.y2 - p.y1) * t;
        if (px > b.x - 1 && px < b.x + b.w + 1 && py > b.y - 1 && py < b.y + b.h + 1) return true;
      }
      return false;
    };
    const labels = new Map();
    const scoreLabel = (p, b, rank) => {
      let bad = rank * 0.5;
      if (b.x < m.left + 2 || b.x + b.w > width - 2 || b.y < 0 || b.y + b.h > y(0) - 2) bad += 100;
      for (const [id, q] of labels) {
        if (id === p.model.id) continue;
        if (b.x < q.x + q.w + 3 && b.x + b.w > q.x - 3 && b.y < q.y + q.h + 1 && b.y + b.h > q.y - 1) bad += 50;
      }
      for (const o of points) {
        for (const [dx, dy] of [[o.x1, o.y1], [o.x2, o.y2]]) {
          if (distToBox(dx, dy, b) < 6) bad += 20;
        }
        if (lineHits(b, o)) bad += 8;
        // A label closer to another model's dot than its own reads as that model's label.
        if (o !== p && distToBox(o.x2, o.y2, b) < distToBox(p.x2, p.y2, b) + 2) bad += 16;
      }
      return bad;
    };
    for (let pass = 0; pass < 4; pass += 1) {
      for (const p of [...points].sort((a, b) => a.x2 - b.x2)) {
        let best = null;
        let bestScore = Infinity;
        candidatesFor(p).forEach((c, rank) => {
          const sc = scoreLabel(p, c, rank);
          if (sc < bestScore) { best = c; bestScore = sc; }
        });
        labels.set(p.model.id, best);
      }
    }

    const groups = [];
    for (const p of points) {
      const { model, r } = p;
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const tipX = p.x2 - ux * 8;
      const tipY = p.y2 - uy * 8;
      const g = s("g", { class: "mark-group", tabindex: "0", role: "img", "aria-label": `${model.short}: pass rate ${r.sym}% to ${r.ctx}%, cost per case $${(r.costSym / tier.cases).toFixed(2)} to $${(r.costCtx / tier.cases).toFixed(2)}` });
      g.append(s("line", { class: "hit", x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, "stroke-width": 22, style: "stroke:transparent" }));
      g.append(s("circle", { class: "hit", cx: p.x1, cy: p.y1, r: 12 }));
      g.append(s("circle", { class: "hit", cx: p.x2, cy: p.y2, r: 12 }));
      if (len > 16) {
        g.append(s("line", { class: "arrow-line", x1: p.x1, y1: p.y1, x2: tipX - ux * 5, y2: tipY - uy * 5 }));
        const px = -uy, py = ux;
        const a = [tipX, tipY];
        const b = [tipX - ux * 7 + px * 3.5, tipY - uy * 7 + py * 3.5];
        const c = [tipX - ux * 7 - px * 3.5, tipY - uy * 7 - py * 3.5];
        g.append(s("path", { class: "arrow-head", d: `M${a}L${b}L${c}Z` }));
      }
      g.append(s("circle", { class: "dot-hollow", cx: p.x1, cy: p.y1, r: 4.5 }));
      g.append(s("circle", { class: "dot-ctx", cx: p.x2, cy: p.y2, r: 6 }));
      const lab = labels.get(model.id);
      g.append(s("text", {
        class: "pareto-label",
        x: lab.anchor === "start" ? lab.x : lab.anchor === "middle" ? lab.x + lab.w / 2 : lab.x + lab.w,
        y: lab.y + 12,
        "text-anchor": lab.anchor,
      }, model.short));
      bindTip(g, {
        title: model.name,
        rows: [
          { color: "--sym", value: `${pct1(r.sym)}%`, label: `at $${(r.costSym / tier.cases).toFixed(2)} per case, symptom-only` },
          { color: "--ctx", value: `${pct1(r.ctx)}%`, label: `at $${(r.costCtx / tier.cases).toFixed(2)} per case, with context` },
        ],
      }, {
        enter: () => groups.forEach((o) => o !== g && o.classList.add("dimmed")),
        leave: () => groups.forEach((o) => o.classList.remove("dimmed")),
      });
      groups.push(g);
      svg.append(g);
    }
    mount.replaceChildren(svg);
  }

  // A bar with a square baseline and a rounded data end.
  function barPath(x0, top, w, barH) {
    const rad = Math.min(4, w);
    return `M${x0},${top}h${w - rad}a${rad},${rad} 0 0 1 ${rad},${rad}v${barH - 2 * rad}a${rad},${rad} 0 0 1 ${-rad},${rad}h${-(w - rad)}z`;
  }

  // ---------- Chart: pass-rate lift (paired bars) ----------
  function renderLift(mount, width, rows, aria) {
    const narrow = width < 420;
    const m = { top: 2, right: narrow ? 52 : 64, bottom: 2, left: narrow ? 92 : 112 };
    const rowH = narrow ? 72 : 90;
    const barH = narrow ? 22 : 27;
    const innerW = width - m.left - m.right;
    const x = (v) => m.left + (v / 100) * innerW;
    const innerH = rowH * rows.length;
    const svg = s("svg", { width, height: m.top + innerH + m.bottom, role: "img", "aria-label": aria });

    rows.forEach((r, i) => {
      const top = m.top + rowH * i;
      const cy = top + rowH / 2;
      const g = s("g", { class: "mark-group", tabindex: "0", role: "img", "aria-label": `${r.full}: ${r.sym}% symptom-only, ${r.ctx}% with debug context, ${signed(r.delta, 1)} points` });
      g.append(s("rect", { class: "hit", x: 0, y: top, width, height: rowH }));
      g.append(s("text", { class: "row-label", x: 0, y: cy - 2 }, r.label));
      g.append(s("text", { class: "row-sub", x: 0, y: cy + 15 }, `n=${r.cases}`));
      [["sym", cy - barH - 1], ["ctx", cy + 1]].forEach(([key, barTop]) => {
        g.append(s("path", { class: `bar-${key}-fill`, d: barPath(x(0), barTop, x(r[key]) - x(0), barH) }));
        g.append(s("text", { class: "val", x: x(r[key]) + 6, y: barTop + barH / 2 + 5 }, pct1(r[key])));
      });
      g.append(s("text", { class: "gain-val", x: width - 2, y: cy + 6, "text-anchor": "end" }, signed(r.delta, 1)));
      bindTip(g, {
        title: `${r.full} (${r.cases} cases)`,
        rows: [
          { color: "--sym", value: `${pct1(r.sym)}%`, label: "Symptom-only" },
          { color: "--ctx", value: `${pct1(r.ctx)}%`, label: "With debug context" },
        ],
      });
      svg.append(g);
    });
    svg.append(s("line", { class: "base-line", x1: x(0), x2: x(0), y1: m.top, y2: m.top + innerH }));
    mount.replaceChildren(svg);
  }

  // ---------- Behaviour tiles ----------
  function renderBehaviour() {
    byId("behaviour-tiles").replaceChildren(...D.behaviour.map((b) => {
      const max = Math.max(b.symN, b.ctxN);
      return h("div", { class: "tile" },
        h("div", { class: "tile-label" }, b.metric),
        h("div", { class: "tile-value" },
          h("span", { class: "tile-from" }, b.sym),
          h("span", { class: "tile-arrow", "aria-hidden": "true" }, "→"),
          b.ctx),
        h("span", { class: "bar bar-sym" }, h("span", { style: `width:${(b.symN / max) * 100}%` })),
        h("span", { class: "bar bar-ctx" }, h("span", { style: `width:${(b.ctxN / max) * 100}%` })));
    }));
  }

  // ---------- Chart: stacked composition ----------
  function renderStack(mount, width, rows, opts) {
    const stacked = width < (opts.stackBelow || 0);
    const m = { top: 2, right: 28, bottom: 26, left: stacked ? 6 : opts.left };
    const rowH = stacked ? 46 : opts.rowH;
    const barH = Math.min(opts.barH, 24);
    const innerH = rowH * rows.length;
    const innerW = width - m.left - m.right;
    const x = (v) => m.left + (v / opts.max) * innerW;
    const svg = s("svg", { width, height: m.top + innerH + m.bottom, role: "img", "aria-label": opts.aria });

    for (const t of opts.ticks) {
      svg.append(s("line", { class: "grid-line", x1: x(t), x2: x(t), y1: m.top, y2: m.top + innerH }));
      svg.append(s("text", { class: "tick", x: x(t), y: m.top + innerH + 18, "text-anchor": "middle" }, String(t)));
    }

    rows.forEach((r, i) => {
      const total = r.t1 + r.t2 + r.t3;
      const cy = m.top + rowH * i + (stacked ? 31 : rowH / 2);
      const name = r.name;
      const g = s("g", { class: "mark-group", tabindex: "0", role: "img", "aria-label": `${name}: ${total} cases. Tier 1: ${r.t1}, Tier 2: ${r.t2}, Tier 3: ${r.t3}.` });
      g.append(s("rect", { class: "hit", x: 0, y: m.top + rowH * i, width, height: rowH }));
      const label = stacked
        ? s("text", { class: "row-label", x: m.left, y: cy - barH / 2 - 6 }, name)
        : s("text", { class: "row-label", x: m.left - 10, y: cy + 5, "text-anchor": "end" }, name);
      if (r.lang) label.append(s("tspan", { class: "row-sub", dx: 6 }, r.lang));
      g.append(label);

      const segs = [["t1", 1], ["t2", 2], ["t3", 3]].filter(([k]) => r[k] > 0);
      let at = 0;
      segs.forEach(([k, n], idx) => {
        const x0 = x(at);
        const x1 = x(at + r[k]);
        const last = idx === segs.length - 1;
        // A 2px surface gap separates segments; only the data end is rounded.
        const right = last ? x1 : x1 - 2;
        const w = Math.max(right - x0, 1);
        const top = cy - barH / 2;
        const d = last ? barPath(x0, top, w, barH) : `M${x0},${top}h${w}v${barH}h${-w}z`;
        g.append(s("path", { class: `seg seg-${n}`, d }));
        at += r[k];
      });
      g.append(s("text", { class: "val", x: x(total) + 7, y: cy + 5 }, String(total)));
      bindTip(g, {
        title: r.lang ? `${name} (${r.lang}), ${total} cases` : `${name}, ${total} cases`,
        rows: [
          { color: "--tier1", value: String(r.t1), label: "Tier 1" },
          { color: "--tier2", value: String(r.t2), label: "Tier 2" },
          { color: "--tier3", value: String(r.t3), label: "Tier 3" },
        ],
      });
      svg.append(g);
    });
    svg.append(s("line", { class: "base-line", x1: m.left, x2: m.left, y1: m.top, y2: m.top + innerH }));
    mount.replaceChildren(svg);
  }

  // Language totals follow from the per-system rows.
  const LANGUAGES = (() => {
    const totals = new Map();
    for (const sys of D.systems) {
      const row = totals.get(sys.lang) || { name: sys.lang, t1: 0, t2: 0, t3: 0 };
      row.t1 += sys.t1; row.t2 += sys.t2; row.t3 += sys.t3;
      totals.set(sys.lang, row);
    }
    return [...totals.values()].sort((a, b) => (b.t1 + b.t2 + b.t3) - (a.t1 + a.t2 + a.t3));
  })();

  // ---------- Heatmap ----------
  function renderHeatmap() {
    const OUTCOME = {
      G: { text: "FAIL → PASS", glyph: "+", sr: "FAIL to PASS" },
      R: { text: "PASS → FAIL", glyph: MINUS, sr: "PASS to FAIL" },
      B: { text: "PASS → PASS", glyph: "", sr: "PASS to PASS" },
      N: { text: "FAIL → FAIL", glyph: "", sr: "FAIL to FAIL" },
    };
    const cols = CASES.caseOrder;
    const groups = [];
    for (const c of cols) {
      const g = groups[groups.length - 1];
      if (g && g.name === c.group) g.count += 1;
      else groups.push({ name: c.group, count: 1 });
    }
    const groupStart = new Set();
    let idx = 0;
    for (const g of groups) { groupStart.add(idx); idx += g.count; }
    const gapTd = () => h("td", { class: "gap", "aria-hidden": "true" });
    const withGaps = (items, gap) => items.flatMap((item, i) => (i > 0 && groupStart.has(i) ? [gap(), item] : [item]));

    const colgroup = h("colgroup", null,
      h("col", { class: "col-model" }),
      withGaps(cols.map(() => h("col")), () => h("col", { class: "col-gap" })),
      h("col", { class: "col-flips" }));

    const head = h("thead", null,
      h("tr", null,
        h("td"),
        groups.flatMap((g, i) => {
          const th = h("th", { class: "fam", colspan: String(g.count), scope: "colgroup" }, g.name);
          return i ? [gapTd(), th] : [th];
        }),
        h("td")),
      h("tr", null,
        h("th", { class: "model-col", scope: "col" }, h("span", { class: "visually-hidden" }, "Model")),
        withGaps(cols.map((c, i) => h("th", { class: "case-head", scope: "col", "data-col": String(i) },
          h("a", { href: repoUrl(`tree/${D.branch}/cases/${c.folder}`), title: c.desc }, c.short))), gapTd),
        h("th", { class: "flips", scope: "col" }, "Flips")));

    const body = h("tbody", null, CASES.rows.map((row) => {
      const wins = [...row.cells].filter((c) => c === "G").length;
      const losses = [...row.cells].filter((c) => c === "R").length;
      return h("tr", null,
        h("th", { class: "model-col", scope: "row" }, MODELS[row.model].short),
        withGaps([...row.cells].map((code, i) => h("td", {
          class: code,
          "data-col": String(i),
          "data-model": row.model,
          "data-code": code,
        },
          h("span", { "aria-hidden": "true" }, OUTCOME[code].glyph),
          h("span", { class: "visually-hidden" }, OUTCOME[code].sr))), gapTd),
        h("th", { class: "flips", scope: "row" }, `+${wins} ${MINUS}${losses}`));
    }));

    const table = byId("heatmap");
    table.replaceChildren(colgroup, head, body);

    let hoverHead = null;
    table.addEventListener("pointermove", (e) => {
      const cell = e.target.closest("td[data-code]");
      if (!cell) { hideTip(); if (hoverHead) hoverHead.classList.remove("hover"); hoverHead = null; return; }
      const col = cols[Number(cell.dataset.col)];
      const code = cell.dataset.code;
      tipFromPointer = true;
      fillTip(col.short, [{ value: OUTCOME[code].text, label: MODELS[cell.dataset.model].short }], col.desc);
      placeTip(e.clientX, e.clientY);
      const headCell = table.querySelector(`th.case-head[data-col="${cell.dataset.col}"]`);
      if (hoverHead !== headCell) {
        if (hoverHead) hoverHead.classList.remove("hover");
        headCell.classList.add("hover");
        hoverHead = headCell;
      }
    });
    table.addEventListener("pointerleave", () => {
      hideTip();
      if (hoverHead) hoverHead.classList.remove("hover");
      hoverHead = null;
    });

    const count = (code) => CASES.rows.reduce((n, row) => n + [...row.cells].filter((c) => c === code).length, 0);
    const KEY = [
      { code: "G", label: "fixed", glyph: "+", color: "--gain" },
      { code: "R", label: "broken", glyph: MINUS, color: "--loss" },
      { code: "B", label: "still pass", glyph: "", color: "--hold" },
      { code: "N", label: "still fail", glyph: "", color: "--none" },
    ];
    byId("heatmap-legend").replaceChildren(...KEY.map((k) => h("div", { class: "outcome" },
      h("span", { class: "outcome-swatch", style: `background:var(${k.color})` }, k.glyph),
      h("div", null,
        h("span", { class: "outcome-num" }, String(count(k.code))),
        h("span", { class: "outcome-label" }, k.label, h("span", { class: "label-long" }, ` (${OUTCOME[k.code].text})`))))));
  }

  // ---------- Static legends and table twins ----------
  function renderChartExtras() {
    const conditions = [
      { color: "--sym", round: true, label: "Symptom-only" },
      { color: "--ctx", round: true, label: "With debug context" },
    ];
    legend(byId("chart-cross-legend"), [
      { color: "--ref", round: true, label: "SWE-bench Verified" },
      { color: "--sym", round: true, label: "DDBench Tier 1" },
    ]);
    legend(byId("chart-pareto-legend"), [
      { color: "--sym", round: true, hollow: true, label: "Symptom-only" },
      { color: "--ctx", round: true, label: "With debug context" },
    ]);
    legend(byId("chart-lift-legend"), conditions);
    legend(byId("behaviour-legend"), conditions);
    legend(byId("dataset-legend"), [
      { color: "--tier1", label: "Tier 1 (31)" },
      { color: "--tier2", label: "Tier 2 (15)" },
      { color: "--tier3", label: "Tier 3 (14)" },
    ]);

    dataTable(byId("chart-cross-table"), ["Model", "SWE-bench Verified (%)", "DDBench Tier 1 (%)"],
      D.crossBenchmark.map((r) => [MODELS[r.id].name, pct1(r.swe), pct1(r.dd)]),
      "Paper Figure 1. DDBench runs are symptom-only. The GPT 5.4 SWE-bench score is from Epoch AI; the others are vendor-reported.");

    const t1 = D.tiers.tier1;
    dataTable(byId("chart-pareto-table"), ["Model", "Pass rate, symptom-only (%)", "Pass rate, context (%)", "$/case, symptom-only", "$/case, context"],
      D.models.map((m) => {
        const r = t1.rows[m.id];
        return [m.name, pct1(r.sym), pct1(r.ctx), (r.costSym / t1.cases).toFixed(2), (r.costCtx / t1.cases).toFixed(2)];
      }),
      "Paper Table 1 and Figure 6a. Cost per case is total cost divided by 31.");

    dataTable(byId("chart-lift-table"), ["Tier", "Symptom-only (%)", "With context (%)", "Gain (pp)"],
      Object.values(D.tiers).map((t) => [`${t.label} (${t.cases} cases)`, pct1(t.mean.sym), pct1(t.mean.ctx), signed(t.mean.delta, 1)]),
      "Paper section 3.5.");

    dataTable(byId("behaviour-table"), ["Mean per case", "Symptom-only", "With context"],
      D.behaviour.map((b) => [b.metric, b.sym, b.ctx]),
      "Paper Table 3: 310 paired Tier 1 runs.");

    const stackRows = (rows, extra) => rows.map((r) => [extra ? `${r.name} (${r.lang})` : r.name, String(r.t1), String(r.t2), String(r.t3), String(r.t1 + r.t2 + r.t3)]);
    dataTable(byId("chart-families-table"), ["Bug family", "Tier 1", "Tier 2", "Tier 3", "Total"], stackRows(D.bugFamilies), "Paper Figure 5.");
    dataTable(byId("chart-languages-table"), ["Language", "Tier 1", "Tier 2", "Tier 3", "Total"], stackRows(LANGUAGES), "Case registry in the DDBench repository.");
    dataTable(byId("chart-systems-table"), ["System", "Tier 1", "Tier 2", "Tier 3", "Total"], stackRows(D.systems, true), "Case registry in the DDBench repository.");
  }

  // ---------- Responsive chart rendering ----------
  const CHARTS = [
    { id: "chart-cross", draw: renderCross },
    { id: "chart-pareto", draw: renderPareto },
    {
      id: "chart-lift-tier",
      draw: (el, w) => renderLift(el, w,
        Object.values(D.tiers).map((t) => ({ label: t.label, full: t.label, cases: t.cases, sym: t.mean.sym, ctx: t.mean.ctx, delta: t.mean.delta })),
        "Pooled pass rate by tier, with and without debug context."),
    },
    {
      id: "chart-families",
      draw: (el, w) => renderStack(el, w, D.bugFamilies, { left: 188, stackBelow: 450, rowH: 38, barH: 22, max: 20, ticks: [0, 5, 10, 15, 20], aria: "Cases per bug family, split by tier." }),
    },
    {
      id: "chart-languages",
      draw: (el, w) => renderStack(el, w, LANGUAGES, { left: 70, rowH: 34, barH: 20, max: 25, ticks: [0, 5, 10, 15, 20, 25], aria: "Cases per language, split by tier." }),
    },
    {
      id: "chart-systems",
      draw: (el, w) => renderStack(el, w, D.systems, { left: Math.min(166, w * 0.5), rowH: 34, barH: 18, max: 15, ticks: [0, 5, 10, 15], aria: "Cases per system, split by tier." }),
    },
  ];
  function drawChart(chart, width) {
    if (width > 0 && chart.width !== width) {
      chart.width = width;
      chart.draw(byId(chart.id), width);
    }
  }
  function startCharts() {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const chart = CHARTS.find((c) => c.id === entry.target.id);
        drawChart(chart, Math.round(entry.contentRect.width));
      }
    });
    for (const chart of CHARTS) {
      const el = byId(chart.id);
      drawChart(chart, Math.round(el.getBoundingClientRect().width));
      ro.observe(el);
    }
  }

  // ---------- Theme and copy ----------
  function initTheme() {
    byId("theme-toggle").addEventListener("click", () => {
      const root = document.documentElement;
      const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("ddbench-theme", next); } catch (e) { /* the theme just won't persist */ }
    });
  }
  function initCopy() {
    const btn = byId("copy-code");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(byId("quickstart").textContent);
        btn.textContent = "Copied";
      } catch (e) {
        btn.textContent = "Press ⌘C";
      }
      setTimeout(() => { btn.textContent = "Copy"; }, 1500);
    });
  }

  // ---------- Boot ----------
  byId("open-only").addEventListener("change", (e) => {
    state.openOnly = e.target.checked;
    renderLeaderboard();
  });
  renderTabs();
  renderLeaderboard();
  renderLinks();
  renderCompare();
  renderBehaviour();
  renderChartExtras();
  renderHeatmap();
  startCharts();
  initTheme();
  initCopy();
})();
