// Deterministic post-processing of the Mitosis-generated output.
//
// Mitosis' generators cannot express three things its output needs, so after
// every `mitosis build` we apply small, stable, documented transformations so
// every framework target compiles clean (zero warnings) through its official
// toolchain. Each transformation is keyed to a byte-exact source pattern and
// is idempotent, so regenerating always produces the same committed output.
//
//   1. Runtime type imports (all targets).
//      The `.lite.tsx` source imports `type OrbSize/OrbState/OrbTheme` from
//      `./types`, but Mitosis drops the `type` specifier and emits
//      `import { LABELS, OrbSize, OrbState, OrbTheme } from "./types"`. Those
//      three are `export type` in `types.ts` — no runtime value exists — so
//      any strict bundler treats them as missing exports. Re-mark them with
//      inline `type` qualifiers so every target imports them as types only
//      (`LABELS` stays a runtime import).
//
//   2. Svelte a11y role (svelte target).
//      Mitosis emits `role="img"` on the `<canvas>`. Svelte's a11y rule
//      `a11y_no_interactive_element_to_noninteractive_role` rejects that
//      standards-valid ARIA mapping. Preserve the role and accessible name,
//      but add the narrow `svelte-ignore` directive immediately before the
//      canvas so the generated SFC compiles without weakening semantics.
//
//   3. Svelte non-void self-closing tag (svelte target).
//      Mitosis emits a self-closing `<canvas ... />`. Svelte rejects
//      self-closing non-void elements and opens a tag that swallows the rest
//      of the file (`element_invalid_self_closing_tag`). Expand it to
//      `<canvas ...></canvas>`.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const output = path.join(root, 'output');

const TARGETS = ['react', 'vue', 'svelte', 'solid'];
const COMPONENT = {
  react: 'src/ThinkingOrb.tsx',
  vue: 'src/ThinkingOrb.vue',
  svelte: 'src/ThinkingOrb.svelte',
  solid: 'src/ThinkingOrb.tsx',
};

function rewrite(rel, transform) {
  const file = path.join(output, rel);
  const before = readFileSync(file, 'utf8');
  const after = transform(before);
  if (after !== before) writeFileSync(file, after);
}

// 1. Mark OrbSize/OrbState/OrbTheme as type-only in the generated import that
//    Mitosis emits for every target.
function fixTypeImports(text) {
  return text.replace(
    /import \{ LABELS, OrbSize, OrbState, OrbTheme \} from "\.\/types";/g,
    'import { LABELS, type OrbSize, type OrbState, type OrbTheme } from "./types";',
  );
}

// 2. Preserve `role="img"` and silence only Svelte's incompatible rule.
function fixSvelteRole(text) {
  return text.replace(
    /(<canvas\n)/,
    '<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->\n$1',
  );
}

// 3. Expand the Svelte canvas self-closing tag into an explicit close tag.
function fixSvelteSelfClosing(text) {
  return text.replace(/(<canvas[\s\S]*?)\/>(\s*)$/m, '$1></canvas>\n');
}

for (const target of TARGETS) {
  rewrite(path.join(target, COMPONENT[target]), fixTypeImports);
  if (target === 'svelte') {
    const rel = path.join(target, COMPONENT[target]);
    const file = path.join(output, rel);
    let s = readFileSync(file, 'utf8');
    s = fixSvelteRole(s);
    s = fixSvelteSelfClosing(s);
    writeFileSync(file, s);
  }
}

console.log('post-generate: applied deterministic type-import + svelte a11y/self-closing adaptations');
