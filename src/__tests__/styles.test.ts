import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const css = readFileSync(join(root, 'styles.css'), 'utf8');
const components = readdirSync(join(root, 'components'))
  .map(file => readFileSync(join(root, 'components', file), 'utf8'))
  .join('\n');

/** Rendered for consumers to target; the default theme doesn't need them. */
const HOOK_ONLY = ['dp-clear', 'dp-nav-next', 'dp-nav-prev', 'dp-weekdays'];

const unique = (values: Iterable<string>) => [...new Set(values)].sort();

describe('styles.css', () => {
  it('styles every dp-* class the components render, and nothing else', () => {
    const used = unique([...components.matchAll(/\bdp-[a-z-]+/g)].map(m => m[0]));
    const styled = unique([...css.matchAll(/\.(dp-[a-z-]+)/g)].map(m => m[1]));
    expect(styled.filter(c => !used.includes(c))).toEqual([]);
    expect(used.filter(c => !styled.includes(c))).toEqual(HOOK_ONLY);
  });

  it('keeps every rule at zero specificity so consumer selectors win', () => {
    const rules = css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/@keyframes[\s\S]*?\n}\n/g, '')
      .split('{')
      .map(chunk => chunk.split(/[;}]/).pop()!.trim())
      .filter(sel => sel && !sel.startsWith('@') && !/^(from|to)$/.test(sel));
    const bare = rules.filter(sel => !sel.startsWith(':where('));
    expect(bare).toEqual([]);
  });
});
