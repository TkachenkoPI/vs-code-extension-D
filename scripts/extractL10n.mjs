// Lists every translatable source string in src/ so l10n/bundle.l10n.ru.json
// can be checked for gaps.
//
// Two shapes are picked up:
//   vscode.l10n.t('…')                     — the extension host
//   t('…')                                 — editorPanelHtml's injected translator
//   vscode.l10n.t({ message: '…', comment: […] })  — keyed as "message/comment"
//
// Dynamic calls (a variable instead of a literal) cannot be seen here; those
// keys are listed in DYNAMIC below so the report stays honest.
//
// Usage:
//   node scripts/extractL10n.mjs            # report missing / unused keys
//   node scripts/extractL10n.mjs --list     # print every source string

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'src');
const BUNDLE = path.join(ROOT, 'l10n', 'bundle.l10n.ru.json');

/** Strings reached through a variable, so no regex can find them. */
const DYNAMIC = [
  // previewPanel: the webview's `what` field for the copy-to-clipboard toast
  'SVG markup',
];

const STRING = String.raw`'((?:[^'\\]|\\.)*)'`;
const PATTERNS = [
  new RegExp(String.raw`vscode\.l10n\.t\(\s*${STRING}`, 'g'),
  new RegExp(String.raw`(?<![.\w])t\(\s*${STRING}`, 'g'),
];
const KEYED = new RegExp(
  String.raw`message:\s*${STRING}\s*,\s*comment:\s*\[\s*${STRING}`,
  'g',
);

function unescape(s) {
  return s.replace(/\\(['"\\nt`$])/g, (_, c) =>
    c === 'n' ? '\n' : c === 't' ? '\t' : c,
  );
}

const found = new Set(DYNAMIC);
for (const name of fs.readdirSync(SRC)) {
  if (!name.endsWith('.ts')) continue;
  const text = fs.readFileSync(path.join(SRC, name), 'utf8');
  for (const re of PATTERNS) {
    for (const m of text.matchAll(re)) found.add(unescape(m[1]));
  }
  for (const m of text.matchAll(KEYED)) {
    found.add(`${unescape(m[1])}/${unescape(m[2])}`);
  }
}

// Template labels / descriptions are translated through a variable too.
const templates = fs.readFileSync(path.join(SRC, 'templates.ts'), 'utf8');
for (const m of templates.matchAll(/^\s{4}(?:label|description): '((?:[^'\\]|\\.)*)',$/gm)) {
  found.add(unescape(m[1]));
}

const sources = [...found].sort((a, b) => a.localeCompare(b));

if (process.argv.includes('--list')) {
  for (const s of sources) console.log(s);
  process.exit(0);
}

const bundle = JSON.parse(fs.readFileSync(BUNDLE, 'utf8'));
const translated = new Set(Object.keys(bundle));
const missing = sources.filter((s) => !translated.has(s));
const unused = [...translated].filter((k) => !found.has(k));

console.log(`[extractL10n] ${sources.length} source strings, ${translated.size} translated`);
for (const s of missing) console.log(`  MISSING  ${JSON.stringify(s)}`);
for (const s of unused) console.log(`  UNUSED   ${JSON.stringify(s)}`);
process.exit(missing.length || unused.length ? 1 : 0);
