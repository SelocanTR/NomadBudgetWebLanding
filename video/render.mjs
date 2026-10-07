// Captures the video page frame by frame and encodes it.
//
//   node video/render.mjs --lang en [--format landscape] [--stills 2,10.5,17] [--mux-only]
//   node video/render.mjs --page cover --lang en [--stills 0,7] [--guides]
//
// Needs `astro dev` running (URL defaults to http://127.0.0.1:4321) and ffmpeg (FFMPEG,
// else on PATH). Chrome drives the page, with the GPU, at 2× the stage's CSS size.
//
// Writes, under video/out/:
//   nomadbudget-<lang>-<format>-silent.mp4   the picture alone (for a platform's own music)
//   nomadbudget-<lang>-<format>.mp4          with the music: faded, at −14 LUFS
//   nomadbudget-cover-<lang>.mp4             the App Store header: 3840 × 1646, silent, a
//                                            seamless loop (checked: the step from the last
//                                            frame back to the first is no bigger than any other)
// or with --stills, one PNG per time given, for looking at.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]] : acc), []),
);
const lang = args.lang ?? 'en';
const cover = args.page === 'cover';
const format = cover ? 'header' : args.format === 'landscape' ? 'landscape' : 'portrait';
const base = args.url ?? process.env.VIDEO_URL ?? 'http://127.0.0.1:4321';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const MUSIC = path.resolve(args.music ?? 'video/music/b.m4a');
const OUT = path.resolve('video/out');
fs.mkdirSync(OUT, { recursive: true });

const stem = path.join(OUT, cover ? `nomadbudget-cover-${lang}` : `nomadbudget-${lang}-${format}`);

// --- the music: faded to the picture's length, then brought to −14 LUFS in two passes ---------
function mux(stem, duration) {
  const silent = `${stem}-silent.mp4`;
  const fades = `afade=t=in:st=0:d=0.05,afade=t=out:st=${(duration - 1.6).toFixed(2)}:d=1.6`;
  const probe = spawnSync(FFMPEG, ['-hide_banner', '-t', String(duration), '-i', MUSIC, '-af', `${fades},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const json = probe.stderr.match(/\{[^{}]*"target_offset"[^{}]*\}/);
  if (!json) throw new Error(`no loudness measurement:
${probe.stderr.slice(-800)}`);
  const m = JSON.parse(json[0]);
  const norm = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const run = spawnSync(FFMPEG, [
    '-y', '-loglevel', 'error', '-i', silent, '-t', String(duration), '-i', MUSIC,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', `${fades},${norm},aresample=48000`,
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', `${stem}.mp4`,
  ], { stdio: 'inherit' });
  if (run.status !== 0) throw new Error('mux failed');
  console.log(`${stem}.mp4  (music measured at ${m.input_i} LUFS)`);
}

// `--mux-only`: the picture is already there; lay the music under it again.
if (args['mux-only']) {
  const probe = spawnSync(FFMPEG.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${stem}-silent.mp4`], { encoding: 'utf8' });
  mux(stem, Number(probe.stdout.trim()));
  process.exit(0);
}

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--hide-scrollbars'],
});
// The cover's stage is 960 × 411.5 at 4× (3840 × 1646); the viewport takes the whole pixel above it.
const size = cover ? { width: 960, height: 412 } : format === 'landscape' ? { width: 960, height: 540 } : { width: 540, height: 960 };
const page = await browser.newPage({ viewport: size, deviceScaleFactor: cover ? 4 : 2 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[page error]', e.message));
page.on('response', (r) => { if (r.status() >= 400) console.log('[page]', r.status(), r.url()); });

const url = cover
  ? `${base}/video/cover/${lang}/${args.guides ? '?guides' : ''}`
  : `${base}/video/${lang}/${format === 'landscape' ? '?f=landscape' : ''}`;
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => document.querySelector('[data-video]')?.getAttribute('data-ready') === '1', null, { timeout: 60000 });
const { fps, frames } = await page.evaluate(() => window.__video);
const renderer = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
});
console.log(`${url}  ${frames} frames at ${fps} fps  (${renderer})`);

const shot = () => page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
/** The cover's frame is the top 1646 of the 1648 px the viewport makes. */
const CROP = cover ? { width: 3840, height: 1646 } : null;

if (args.stills) {
  const times = String(args.stills).split(',').map(Number);
  for (const t of times) {
    await page.evaluate((f) => window.__video.seek(f), Math.round(t * fps));
    const file = path.join(OUT, `still-${lang}-${format}-${t.toFixed(2)}.png`);
    const buf = await shot();
    fs.writeFileSync(file, CROP ? await sharp(buf).extract({ left: 0, top: 0, ...CROP }).png().toBuffer() : buf);
    console.log(file);
  }
  await browser.close();
  process.exit(0);
}

// --- the picture ----------------------------------------------------------------------------
// The cover has no music: its picture is the file.
const silent = cover ? `${stem}.mp4` : `${stem}-silent.mp4`;
const enc = spawn(FFMPEG, [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  ...(CROP ? ['-vf', `crop=${CROP.width}:${CROP.height}:0:0`] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-movflags', '+faststart', silent,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((resolve, reject) => enc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));

// For the cover's seam: each frame small and grey, and how far each is from the one before.
const thumb = (buf) => sharp(buf).extract({ left: 0, top: 0, ...CROP }).resize(480).greyscale().raw().toBuffer();
const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
const steps = [];
let first = null, prev = null;

const started = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate((i) => window.__video.seek(i), f);
  const buf = await shot();
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
  if (cover) {
    const small = await thumb(buf);
    if (prev) steps.push(diff(prev, small));
    first ??= small;
    prev = small;
  }
  if (f % 60 === 0) {
    const per = (Date.now() - started) / (f + 1);
    process.stdout.write(`\r${f}/${frames}  ${Math.round(((frames - f) * per) / 1000)} s left   `);
  }
}
enc.stdin.end();
await done;
await browser.close();
console.log(`\n${silent}`);

if (cover) {
  // The step from the last frame back to the first should be one more step of the motion.
  const seam = diff(prev, first);
  const around = Math.max(steps[0], steps[steps.length - 1]);
  const sorted = [...steps].sort((a, b) => a - b);
  console.log(`seam ${seam.toFixed(3)}  (either side ${steps[steps.length - 1].toFixed(3)} / ${steps[0].toFixed(3)}, median ${sorted[sorted.length >> 1].toFixed(3)}, largest ${sorted[sorted.length - 1].toFixed(3)})`);
  if (seam > 1.5 * around + 0.05) throw new Error('the loop has a seam');
} else {
  mux(stem, frames / fps);
}
