/* The runtime stays offline: network APIs appear only in the two opt-in features
   (js/ai.js: the user's own Anthropic key; js/tts.js: recitation streaming) and in the service worker
   (refreshing the app's own files). Also checks that the Content-Security-Policy allows no other host.
   node build/tests/test-offline.js */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "../..");
const ALLOWED = new Set(["ai.js", "tts.js"]);
const NET = /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|sendBeacon|EventSource|importScripts\s*\(|navigator\.connection/;
let fail = 0; const bad = m => { fail++; console.log("  ✗ " + m); };
for (const f of fs.readdirSync(path.join(ROOT, "js")).filter(f => f.endsWith(".js"))) {
  if (ALLOWED.has(f)) continue;
  const src = fs.readFileSync(path.join(ROOT, "js", f), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1");   // ignore comments
  const m = src.match(NET); if (m) bad("js/" + f + " uses a network API: " + m[0]);
  const scripts = src.match(/<script[^>]+src=["']https?:/i); if (scripts) bad("js/" + f + " injects a remote script");
}
const sw = fs.readFileSync(path.join(ROOT, "service-worker.js"), "utf8");
if (!/url\.origin === self\.location\.origin/.test(sw)) bad("service-worker.js no longer limits caching to the app's own origin");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const csp = (html.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || "";
if (!csp) bad("index.html has no Content-Security-Policy");
const connect = (csp.match(/connect-src ([^;]+)/) || [])[1] || "";
connect.trim().split(/\s+/).forEach(h => { if (h !== "'self'" && h !== "https://api.anthropic.com") bad("CSP connect-src allows " + h); });
if (/<script[^>]+src=["']https?:/i.test(html) || /<link[^>]+href=["']https?:/i.test(html)) bad("index.html loads a remote script or stylesheet");
if (fail) { console.log(fail + " problem(s)"); process.exit(1); }
console.log("offline: network APIs only in js/ai.js and js/tts.js (both opt-in); CSP connect-src = " + connect.trim() + " · offline tests passed");
