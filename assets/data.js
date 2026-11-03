// Every number on the site comes from this file (plus data-cases.js).
// Source is the NeurIPS 2026 version of the DDBench paper unless a comment says otherwise.
window.DDBENCH = {
  repo: "https://github.com/USC-NSL/DDBench",
  branch: "main",
  // Set these once the links exist. While null, the buttons show as "soon" and don't link.
  paperUrl: "https://arxiv.org/abs/2608.14863",  // arXiv paper
  datasetUrl: null,  // Hugging Face dataset

  // Every run in the paper uses this agent scaffold.
  agent: { name: "mini-SWE-agent", url: "https://github.com/SWE-agent/mini-swe-agent" },

  models: [
    { id: "opus46",   name: "Claude Opus 4.6",     short: "Opus 4.6",     thinking: "adaptive high", access: "API",                open: false },
    { id: "sonnet46", name: "Claude Sonnet 4.6",   short: "Sonnet 4.6",   thinking: "adaptive high", access: "API",                open: false },
    { id: "gpt54",    name: "GPT 5.4",             short: "GPT 5.4",      thinking: "high",          access: "API",                open: false },
    { id: "mini54",   name: "GPT 5.4 mini",        short: "GPT 5.4 mini", thinking: "high",          access: "API",                open: false },
    { id: "glm51",    name: "GLM 5.1 (FP8)",       short: "GLM 5.1",      thinking: "enabled",       access: "open, self-hosted",  open: true },
    { id: "glm5",     name: "GLM 5",               short: "GLM 5",        thinking: "enabled",       access: "open, API",          open: true },
    { id: "glm47",    name: "GLM 4.7",             short: "GLM 4.7",      thinking: "enabled",       access: "open, API",          open: true },
    { id: "gemma4",   name: "Gemma 4 (31B)",       short: "Gemma 4",      thinking: "enabled",       access: "open, self-hosted",  open: true },
    { id: "kimik25",  name: "Kimi K2.5",           short: "Kimi K2.5",    thinking: "n/a",           access: "open, API",          open: true },
    { id: "gptoss",   name: "GPT OSS (120B BF16)", short: "GPT OSS",      thinking: "enabled",       access: "open, self-hosted",  open: true },
  ],

  // Per-model results. Pass rates in %, total costs in USD over all cases in the tier.
  // sym = symptom-only, ctx = context-augmented.
  tiers: {
    tier1: {
      label: "Tier 1", cases: 31, source: "Table 1", costDigits: 1,
      blurb: "Hardest: bugs that cross nodes and depend on timing.",
      mean: { sym: 31.0, ctx: 50.0, delta: 19.0 },
      rows: {
        opus46:   { sym: 51.6, ctx: 64.5, delta: 12.9, costSym: 72.5, costCtx: 32.6, costDelta: -55.1 },
        sonnet46: { sym: 41.9, ctx: 58.1, delta: 16.1, costSym: 71.8, costCtx: 35.8, costDelta: -50.1 },
        gpt54:    { sym: 41.9, ctx: 67.7, delta: 25.8, costSym: 25.0, costCtx: 21.4, costDelta: -14.3 },
        mini54:   { sym: 45.2, ctx: 61.3, delta: 16.1, costSym: 7.9,  costCtx: 6.1,  costDelta: -23.5 },
        glm51:    { sym: 32.3, ctx: 48.4, delta: 16.1, costSym: 23.1, costCtx: 14.6, costDelta: -36.7 },
        glm5:     { sym: 29.0, ctx: 45.2, delta: 16.1, costSym: 42.3, costCtx: 30.3, costDelta: -28.5 },
        glm47:    { sym: 9.7,  ctx: 48.4, delta: 38.7, costSym: 38.5, costCtx: 18.7, costDelta: -51.5 },
        gemma4:   { sym: 19.4, ctx: 38.7, delta: 19.4, costSym: 4.9,  costCtx: 4.5,  costDelta: -8.6 },
        kimik25:  { sym: 32.3, ctx: 38.7, delta: 6.5,  costSym: 11.2, costCtx: 7.5,  costDelta: -32.6 },
        gptoss:   { sym: 6.5,  ctx: 29.0, delta: 22.6, costSym: 3.7,  costCtx: 3.3,  costDelta: -11.5 },
      },
    },
    tier2: {
      label: "Tier 2", cases: 15, source: "Table 8", costDigits: 2,
      blurb: "Medium: bugs that span multiple processes.",
      mean: { sym: 48.0, ctx: 62.7, delta: 14.7 },
      rows: {
        opus46:   { sym: 66.7, ctx: 73.3, delta: 6.7,  costSym: 32.40, costCtx: 25.29, costDelta: -21.9 },
        sonnet46: { sym: 73.3, ctx: 73.3, delta: 0,    costSym: 29.34, costCtx: 18.53, costDelta: -36.8 },
        gpt54:    { sym: 60.0, ctx: 86.7, delta: 26.7, costSym: 10.75, costCtx: 10.35, costDelta: -3.7 },
        mini54:   { sym: 66.7, ctx: 73.3, delta: 6.7,  costSym: 2.70,  costCtx: 2.25,  costDelta: -16.7 },
        glm51:    { sym: 40.0, ctx: 46.7, delta: 6.7,  costSym: 7.12,  costCtx: 5.33,  costDelta: -25.1 },
        glm5:     { sym: 53.3, ctx: 66.7, delta: 13.3, costSym: 36.68, costCtx: 22.01, costDelta: -40.0 },
        glm47:    { sym: 33.3, ctx: 66.7, delta: 33.3, costSym: 19.88, costCtx: 11.30, costDelta: -43.2 },
        gemma4:   { sym: 26.7, ctx: 53.3, delta: 26.7, costSym: 0.94,  costCtx: 0.77,  costDelta: -18.1 },
        kimik25:  { sym: 33.3, ctx: 60.0, delta: 26.7, costSym: 8.30,  costCtx: 2.39,  costDelta: -71.2 },
        gptoss:   { sym: 26.7, ctx: 26.7, delta: 0,    costSym: 1.95,  costCtx: 1.65,  costDelta: -15.4 },
      },
    },
    tier3: {
      label: "Tier 3", cases: 14, source: "Table 9", costDigits: 2,
      blurb: "Easiest: bugs that stay inside one process.",
      mean: { sym: 67.9, ctx: 77.1, delta: 9.3 },
      rows: {
        opus46:   { sym: 78.57, ctx: 92.86, delta: 14.29, costSym: 38.05, costCtx: 14.61, costDelta: -61.6 },
        sonnet46: { sym: 71.43, ctx: 92.86, delta: 21.43, costSym: 33.82, costCtx: 17.55, costDelta: -48.1 },
        gpt54:    { sym: 78.57, ctx: 92.86, delta: 14.29, costSym: 13.17, costCtx: 9.50,  costDelta: -27.9 },
        mini54:   { sym: 85.71, ctx: 92.86, delta: 7.14,  costSym: 2.37,  costCtx: 1.75,  costDelta: -26.2 },
        glm51:    { sym: 57.14, ctx: 50.00, delta: -7.14, costSym: 9.47,  costCtx: 10.41, costDelta: 9.9 },
        glm5:     { sym: 85.71, ctx: 85.71, delta: 0,     costSym: 32.78, costCtx: 23.70, costDelta: -27.7 },
        glm47:    { sym: 85.71, ctx: 85.71, delta: 0,     costSym: 20.67, costCtx: 15.35, costDelta: -25.7 },
        gemma4:   { sym: 57.14, ctx: 50.00, delta: -7.14, costSym: 1.55,  costCtx: 2.75,  costDelta: 77.4 },
        kimik25:  { sym: 42.86, ctx: 85.71, delta: 42.86, costSym: 12.01, costCtx: 3.87,  costDelta: -67.8 },
        gptoss:   { sym: 35.71, ctx: 42.86, delta: 7.14,  costSym: 1.98,  costCtx: 1.83,  costDelta: -7.6 },
      },
    },
  },

  // Figure 1 / section 3.2. Published SWE-bench Verified scores vs. symptom-only DDBench Tier 1.
  // The GPT 5.4 score is from Epoch AI; the others come from vendor reports.
  crossBenchmark: [
    { id: "opus46",   swe: 80.8, dd: 51.6 },
    { id: "sonnet46", swe: 79.6, dd: 41.9 },
    { id: "gpt54",    swe: 77.0, dd: 41.9 },
    { id: "kimik25",  swe: 76.8, dd: 32.3 },
    { id: "glm5",     swe: 77.8, dd: 29.0 },
    { id: "glm47",    swe: 73.8, dd: 9.7 },
  ],

  // Table 3. Behaviour across the 310 paired Tier 1 runs.
  behaviour: [
    { metric: "Tokens",              sym: "1.79M", ctx: "0.99M", symN: 1.79, ctxN: 0.99 },
    { metric: "Steps",               sym: "57.6",  ctx: "43.1",  symN: 57.6, ctxN: 43.1 },
    { metric: "Steps to first edit", sym: "32.3",  ctx: "20.8",  symN: 32.3, ctxN: 20.8 },
    { metric: "Read actions",        sym: "24.7",  ctx: "17.7",  symN: 24.7, ctxN: 17.7 },
    { metric: "Explore actions",     sym: "10.9",  ctx: "6.8",   symN: 10.9, ctxN: 6.8 },
    { metric: "Edits",               sym: "3.0",   ctx: "3.1",   symN: 3.0,  ctxN: 3.1 },
  ],

  // Table 7.
  comparison: [
    { name: "SWE-bench Verified", crossProcess: false, codeFix: true,  oracle: "unit tests",       context: "",           languages: "1" },
    { name: "Multi-SWE-Bench",    crossProcess: false, codeFix: true,  oracle: "unit tests",       context: "",           languages: "8" },
    { name: "DebugBench",         crossProcess: false, codeFix: true,  oracle: "unit tests",       context: "",           languages: "3" },
    { name: "AIOpsLab",           crossProcess: true,  codeFix: false, oracle: "telemetry",        context: "telemetry",  languages: "\u2014" },
    { name: "CloudOpsBench",      crossProcess: true,  codeFix: false, oracle: "telemetry",        context: "telemetry",  languages: "\u2014" },
    { name: "DDBench",            crossProcess: true,  codeFix: true,  oracle: "E2E + unit tests", context: "controlled", languages: "5", self: true },
  ],

  // Figure 5, confirmed against registry/case_registry.json.
  bugFamilies: [
    { name: "Protocol & recovery",       t1: 13, t2: 6, t3: 0 },
    { name: "Replication & consistency", t1: 9,  t2: 1, t3: 1 },
    { name: "Concurrency hazards",       t1: 4,  t2: 5, t3: 2 },
    { name: "Input-triggered crashes",   t1: 0,  t2: 0, t3: 10 },
    { name: "Resource & delivery",       t1: 5,  t2: 3, t3: 1 },
  ],

  // From registry/case_registry.json. The paper's Table 4 lists NATS as 5/3/1, which makes its
  // tier columns sum to 14 and 15 instead of 15 and 14; the registry's 5/4/0 sums correctly.
  systems: [
    { name: "Dragonfly",      lang: "C++",    t1: 1, t2: 1, t3: 12 },
    { name: "NATS",           lang: "Go",     t1: 5, t2: 4, t3: 0 },
    { name: "Kvrocks",        lang: "C++",    t1: 4, t2: 3, t3: 1 },
    { name: "etcd",           lang: "Go",     t1: 5, t2: 2, t3: 0 },
    { name: "hashicorp/raft", lang: "Go",     t1: 4, t2: 2, t3: 0 },
    { name: "Consul",         lang: "Go",     t1: 2, t2: 1, t3: 0 },
    { name: "Kafka",          lang: "Java",   t1: 3, t2: 0, t3: 0 },
    { name: "ZooKeeper",      lang: "Java",   t1: 3, t2: 0, t3: 0 },
    { name: "BookKeeper",     lang: "Java",   t1: 2, t2: 0, t3: 0 },
    { name: "raft-rs",        lang: "Rust",   t1: 0, t2: 2, t3: 0 },
    { name: "Ra",             lang: "Erlang", t1: 1, t2: 0, t3: 0 },
    { name: "RabbitMQ",       lang: "Erlang", t1: 1, t2: 0, t3: 0 },
    { name: "RocksDB",        lang: "C++",    t1: 0, t2: 0, t3: 1 },
  ],
};
