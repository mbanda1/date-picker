// End-to-end smoke test: starts `next start`, drives real Chrome over the DevTools
// protocol through the main flows, and fails on any broken flow or console error.
// Usage: pnpm build (library and example), then `pnpm smoke`. Set CHROME_PATH if
// Chrome is not in a standard location. Screenshots are written to .smoke/.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const OUT = join(process.cwd(), '.smoke');
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const CHROME = CHROME_CANDIDATES.find(path => path && existsSync(path));
if (!CHROME) {
  console.error('Chrome not found. Set CHROME_PATH.');
  process.exit(1);
}

const freePort = () =>
  new Promise(resolve => {
    const server = createServer();
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const APP_PORT = await freePort();
const DEBUG_PORT = await freePort();
const BASE = `http://localhost:${APP_PORT}`;
await mkdir(OUT, { recursive: true });

const app = spawn('pnpm', ['exec', 'next', 'start', '-p', String(APP_PORT)], { stdio: 'ignore' });
for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    if (i > 100) throw new Error('next start did not come up; run `pnpm build` first');
  }
  await sleep(100);
}

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${await mkdtemp(join(tmpdir(), 'dp-smoke-'))}`,
  'about:blank',
]);

let ws;
let nextId = 1;
const pending = new Map();
const problems = [];

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async expression => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
};

const waitFor = async (expression, label, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const navigate = async url => {
  await send('Page.navigate', { url });
  await waitFor(`document.readyState === 'complete'`, 'load');
  await sleep(300);
};

const screenshot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${OUT}/${name}.png`, Buffer.from(data, 'base64'));
};

const realClick = async selector => {
  const box = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  if (!box) throw new Error(`No element for ${selector}`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
  }
  await sleep(150);
};

const key = async (key, code = key, keyCode) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
  await sleep(80);
};

const results = [];
const check = async (label, fn) => {
  try {
    await fn();
    results.push(`PASS ${label}`);
  } catch (error) {
    results.push(`FAIL ${label}: ${error.message}`);
  }
};

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      target = list.find(t => t.type === 'page');
    } catch {
      await sleep(100);
    }
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve));
  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      problems.push(`exception: ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
    } else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
      problems.push(`console.${msg.params.type}: ${msg.params.args.map(a => a.value ?? a.description).join(' ')}`);
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      problems.push(`log: ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(BASE);

  await check('server-rendered fields hydrate', async () => {
    const count = await evaluate(`document.querySelectorAll('.dp-input').length`);
    if (count < 8) throw new Error(`expected >= 8 pickers, found ${count}`);
  });

  await check('single picker opens and focuses a day', async () => {
    await realClick('#due');
    await waitFor(`document.querySelector('[role=dialog]')`, 'dialog');
    await waitFor(`document.activeElement?.matches('[role=grid] button[tabindex="0"]')`, 'focused day');
  });

  await check('keyboard navigation and Enter select a weekday', async () => {
    await key('ArrowDown', 'ArrowDown', 40);
    let weekend = await evaluate(`document.activeElement.hasAttribute('data-unavailable')`);
    if (weekend) await key('ArrowRight', 'ArrowRight', 39);
    weekend = await evaluate(`document.activeElement.hasAttribute('data-unavailable')`);
    if (weekend) await key('ArrowRight', 'ArrowRight', 39);
    await key('Enter', 'Enter', 13);
    await waitFor(`!document.querySelector('[role=dialog]')`, 'dialog closed');
    const value = await evaluate(`document.querySelector('#due').value`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`input value "${value}"`);
    if ((await evaluate(`document.activeElement.id`)) !== 'due') throw new Error('focus not returned to input');
  });

  await check('range picker with presets applies a range', async () => {
    await realClick('#report');
    await waitFor(`document.querySelectorAll('[role=grid]').length === 2`, 'two months');
    await screenshot('desktop-range');
    const preset = await evaluate(`[...document.querySelectorAll('.dp-preset')].findIndex(b => b.textContent === 'Last 7 Days')`);
    await realClick(`.dp-preset:nth-child(${preset + 1})`);
    await realClick('.dp-button-primary');
    await waitFor(`!document.querySelector('[role=dialog]')`, 'dialog closed');
    const value = await evaluate(`document.querySelector('#report').value`);
    if (!value.includes(' - ')) throw new Error(`input value "${value}"`);
  });

  await check('calendar icon closes an open picker', async () => {
    await realClick('#meeting');
    await waitFor(`document.querySelector('[role=dialog]')`, 'dialog');
    await realClick('#meeting ~ .dp-trigger');
    await sleep(200);
    if (await evaluate(`Boolean(document.querySelector('[role=dialog]'))`)) throw new Error('still open');
  });

  await check('React Hook Form focuses the empty required picker', async () => {
    await realClick('form[novalidate] button[type=submit]');
    await waitFor(`document.querySelector('#event-error')`, 'error message');
    const focused = await evaluate(`document.activeElement.id`);
    if (focused !== 'event') throw new Error(`focused #${focused}`);
    const invalid = await evaluate(`document.querySelector('#event').getAttribute('aria-invalid')`);
    if (invalid !== 'true') throw new Error('aria-invalid not set');
  });

  await check('RTL picker renders its popover right-to-left', async () => {
    await realClick('#ar');
    await waitFor(`document.querySelector('[role=dialog]')`, 'dialog');
    const dir = await evaluate(`getComputedStyle(document.querySelector('[role=dialog]')).direction`);
    if (dir !== 'rtl') throw new Error(`direction ${dir}`);
    await screenshot('desktop-rtl');
    await key('Escape', 'Escape', 27);
  });

  await check('headless hook picker works with custom markup', async () => {
    await realClick('#headless');
    await waitFor(`document.querySelector('.hl-popover [role=grid]')`, 'headless grid');
    await screenshot('desktop-headless');
    await key('Enter', 'Enter', 13);
    await waitFor(`!document.querySelector('.hl-popover')`, 'closed');
    const value = await evaluate(`document.querySelector('#headless').value`);
    if (!/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(value)) throw new Error(`value "${value}"`);
  });

  await check('Server Component picker posts an ISO date to a Server Action', async () => {
    await realClick('#booking');
    await waitFor(`document.querySelector('[role=dialog]')`, 'dialog');
    await realClick('[role=dialog] .dp-today');
    await realClick('form:not([novalidate]) button[type=submit]');
    await waitFor(`location.search.includes('saved=')`, 'redirect after action', 8000);
    await waitFor(`document.querySelector('[role=status]')`, 'status');
    const saved = await evaluate(`new URLSearchParams(location.search).get('saved')`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(saved)) throw new Error(`saved "${saved}"`);
  });

  await check('dark theme toggles', async () => {
    await realClick('.page-header .button');
    await realClick('#themed');
    await waitFor(`document.querySelector('[role=dialog]')`, 'dialog');
    await screenshot('desktop-dark-themed');
    await key('Escape', 'Escape', 27);
  });

  await check('props playground drives both pickers', async () => {
    await navigate(`${BASE}/playground`);
    await realClick('#pg-picker');
    await waitFor(`document.querySelector('[role=dialog]')`, 'dialog');
    await realClick('[role=dialog] .dp-today');
    await waitFor(`!document.querySelector('[role=dialog]')`, 'dialog closed');
    const value = await evaluate(`document.querySelector('.pg-value').textContent`);
    if (value.includes('null')) throw new Error(`output "${value}"`);

    await realClick('input[name=pg-mode][value=range]');
    await realClick('#pg-presets');
    const code = await evaluate(`document.querySelector('.pg-preview pre').textContent`);
    if (!code.startsWith('<DateRangePicker') || !code.includes('presets')) throw new Error(`snippet "${code}"`);
    await realClick('#pg-picker');
    await waitFor(`document.querySelectorAll('[role=dialog] [role=grid]').length === 2`, 'two months');
    await waitFor(`document.querySelector('[role=dialog] .dp-preset')`, 'presets');
    await screenshot('desktop-playground');
    await key('Escape', 'Escape', 27);

    await realClick('#pg-format');
    await send('Input.insertText', { text: 'j' });
    await waitFor(`document.querySelector('#pg-format-error')`, 'format error');
    if (!(await evaluate(`Boolean(document.querySelector('#pg-picker'))`))) throw new Error('picker unmounted');
  });

  await check('phone width uses the bottom sheet and locks scroll', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await navigate(BASE);
    await realClick('#report');
    await waitFor(`document.querySelector('[role=dialog][data-layout=sheet]')`, 'sheet');
    const grids = await evaluate(`document.querySelectorAll('[role=grid]').length`);
    if (grids !== 1) throw new Error(`${grids} months`);
    const overflow = await evaluate(`document.documentElement.style.overflow`);
    if (overflow !== 'hidden') throw new Error('scroll not locked');
    const fits = await evaluate(`document.querySelector('[role=dialog]').scrollWidth <= window.innerWidth`);
    if (!fits) throw new Error('sheet wider than viewport');
    await sleep(300);
    await screenshot('phone-range-sheet');
    await realClick('.dp-backdrop');
    await waitFor(`!document.querySelector('[role=dialog]')`, 'closed');
    if ((await evaluate(`document.documentElement.style.overflow`)) !== '') throw new Error('scroll not restored');
  });
} catch (error) {
  results.push(`FAIL harness: ${error.stack}`);
} finally {
  console.log(results.join('\n'));
  console.log(problems.length ? `\nBrowser problems:\n${problems.join('\n')}` : '\nNo console errors, warnings or exceptions.');
  ws?.close();
  chrome.kill();
  app.kill();
  const failed = results.some(line => line.startsWith('FAIL')) || problems.length > 0;
  process.exit(failed ? 1 : 0);
}
