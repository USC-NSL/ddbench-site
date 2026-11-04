#!/usr/bin/env node
// Copies the rendered results and data tables into index.html, so crawlers that don't run
// JavaScript can read them. app.js replaces this copy on load, so visitors see the same page.
// Needs Chrome; set CHROME if it isn't at the macOS default path.
// Usage: node scripts/prerender.js
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGE = path.join(__dirname, "..", "index.html");
const IDS = [
  "tier-tabs", "tier-blurb", "tier-mean", "lb-table", "link-row", "compare", "footer-paper",
  "chart-cross-table", "chart-pareto-table", "chart-lift-table", "behaviour-table",
  "chart-families-table", "chart-languages-table", "chart-systems-table",
];

// Returns where an element's contents start and end, counting nested tags of the same name.
function contentsOf(html, id) {
  const open = html.match(new RegExp(`<(\\w+)[^>]*\\sid="${id}"[^>]*>`));
  if (!open) throw new Error(`No element with id "${id}"`);
  const start = open.index + open[0].length;
  const tag = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, "g");
  tag.lastIndex = start;
  let depth = 1;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return [start, m.index];
  }
  throw new Error(`Element "${id}" is never closed`);
}

function renderedPage() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ddbench-prerender-"));
  try {
    return execFileSync(CHROME, ["--headless=new", "--disable-gpu", `--user-data-dir=${profile}`, "--dump-dom", pathToFileURL(PAGE).href],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

const rendered = renderedPage();
let page = fs.readFileSync(PAGE, "utf8");
for (const id of IDS) {
  const [from, to] = contentsOf(rendered, id);
  if (from === to) throw new Error(`Chrome rendered nothing for "${id}"; index.html is unchanged`);
  const [start, end] = contentsOf(page, id);
  page = page.slice(0, start) + rendered.slice(from, to).replace(/<\/tr>/g, "</tr>\n") + page.slice(end);
}
fs.writeFileSync(PAGE, page);
console.log(`Updated ${IDS.length} elements in index.html`);
