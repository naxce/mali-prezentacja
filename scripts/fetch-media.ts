import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync, statSync } from 'node:fs';

const WEBP_MAX = 340 * 1024;
const MP4_MAX = 780 * 1024;
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';

interface Entry {
  key: string;
  kind: 'image' | 'video' | 'flag';
  source: 'commons' | 'manual';
  file?: string;
  url?: string;
  widths?: number[];
  start?: number;
  dur?: number;
  sepia?: boolean;
  gray?: boolean;
  author?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
  title?: string;
}

interface Out {
  key: string;
  kind: Entry['kind'];
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  widths?: number[];
  sepia?: boolean;
  gray?: boolean;
  ext?: string;
}

const UA = 'MaliPrezentacja/1.0 (school presentation; https://github.com/naxce/mali-prezentacja)';
const RAW = '.cache/media-raw';
const PUB = 'public/media';
for (const d of [RAW, `${PUB}/img`, `${PUB}/video`, `${PUB}/flag`]) mkdirSync(d, { recursive: true });

const cleanAuthor = (a: string): string => (/see (file history|below)|^unknown|^see /i.test(a) || !a.trim() ? 'Wikimedia Commons (autor w opisie pliku)' : a);

const strip = (s: string): string => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

async function api(params: Record<string, string>): Promise<any> {
  const q = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`api ${r.status}`);
  return r.json();
}

async function download(url: string, dest: string): Promise<void> {
  if (existsSync(dest) && statSync(dest).size > 0) return;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 2000 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`download ${url}: ${r.status}`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    return;
  }
  throw new Error(`download failed after retries: ${url}`);
}

function run(cmd: string, args: string[]): void {
  execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

const manifest = JSON.parse(readFileSync('media/manifest.json', 'utf8')) as Entry[];
const only = process.argv.slice(2);
const prev: Out[] = existsSync('src/content/media.json') ? JSON.parse(readFileSync('src/content/media.json', 'utf8')) : [];
const result = new Map<string, Out>(prev.map((p) => [p.key, p]));
const failures: string[] = [];

for (const e of manifest) {
  if (only.length && only.indexOf(e.key) < 0) continue;
  try {
    let srcUrl = e.url || '';
    let meta: Omit<Out, 'key' | 'kind'> = { title: e.title || e.key, author: e.author || '', license: e.license || '', licenseUrl: e.licenseUrl || '', sourceUrl: e.sourceUrl || e.url || '' };
    if (e.source === 'commons' && e.file) {
      const params: Record<string, string> = { action: 'query', titles: e.file, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size' };
      if (e.kind === 'image') params.iiurlwidth = '2400';
      if (e.kind === 'video') { params.prop = 'videoinfo'; params.viprop = 'url|extmetadata|derivatives|size'; }
      const data = await api(params);
      const page = data.query.pages[0];
      const info = (page.imageinfo || page.videoinfo || [])[0];
      if (!info) throw new Error('missing on Commons');
      const em = info.extmetadata || {};
      meta = {
        title: e.file.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' '),
        author: cleanAuthor(strip(String(em.Artist?.value || e.author || ''))),
        license: strip(String(em.LicenseShortName?.value || e.license || '')),
        licenseUrl: String(em.LicenseUrl?.value || ''),
        sourceUrl: String(info.descriptionurl || '')
      };
      if (!/public domain|cc0|cc[ -]by|pd/i.test(meta.license) || /nc|nd/i.test(meta.license.replace(/cc[ -]by[ -]sa/i, ''))) throw new Error(`license not allowed: ${meta.license}`);
      srcUrl = info.url;
      if (e.kind === 'image' && info.thumburl && info.width > 2400) srcUrl = info.thumburl;
      if (e.kind === 'video' && Array.isArray(info.derivatives)) {
        const ders = info.derivatives.filter((d: any) => /webm|mp4/.test(d.type || '') && d.height && d.height >= 360).sort((a: any, b: any) => a.height - b.height);
        const pick = ders.find((d: any) => d.height >= 480) || ders[ders.length - 1];
        if (pick) srcUrl = pick.src;
      }
    }
    if (!srcUrl) throw new Error('no source url');
    const ext = (extname(new URL(srcUrl).pathname) || '.bin').toLowerCase();
    const raw = join(RAW, e.key + ext);
    await download(srcUrl, raw);
    const out: Out = { key: e.key, kind: e.kind, ...meta };
    if (e.kind === 'image') {
      const widths = e.widths && e.widths.length ? e.widths : [960];
      const jpgW = widths[Math.min(1, widths.length - 1)];
      for (const variant of e.sepia ? ['', '-sepia'] : ['']) {
        const tone = variant ? ['-modulate', '100,25', '-sepia-tone', '78%'] : [];
        for (const w of widths) {
          const out = `${PUB}/img/${e.key}${variant}-${w}.webp`;
          for (const q of ['74', '62', '50']) {
            run('magick', [raw + '[0]', '-auto-orient', '-resize', `${w}x>`, ...tone, '-strip', '-quality', q, out]);
            if (statSync(out).size <= WEBP_MAX) break;
          }
        }
        run('magick', [raw + '[0]', '-auto-orient', '-resize', `${jpgW}x>`, ...tone, '-strip', '-interlace', 'Plane', '-quality', '72', `${PUB}/img/${e.key}${variant}.jpg`]);
      }
      out.widths = widths;
      if (e.sepia) out.sepia = true;
    } else if (e.kind === 'video') {
      const start = String(e.start ?? 2);
      const dur = String(e.dur ?? 4);
      const mp4 = `${PUB}/video/${e.key}.mp4`;
      for (const crf of ['28', '31', '34']) {
        run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', start, '-t', dur, '-i', raw, '-an', '-vf', 'scale=960:-2:flags=lanczos,fps=24', '-c:v', 'libx264', '-profile:v', 'main', '-level', '3.1', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
        if (statSync(mp4).size <= MP4_MAX) break;
      }
      run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', start, '-i', raw, '-frames:v', '1', '-vf', 'scale=960:-2', join(RAW, e.key + '-poster.png')]);
      run('magick', [join(RAW, e.key + '-poster.png'), '-quality', '72', `${PUB}/video/${e.key}.webp`]);
      run('magick', [join(RAW, e.key + '-poster.png'), '-quality', '74', `${PUB}/video/${e.key}.jpg`]);
    } else {
      const fext = ext === '.svg' ? '.svg' : '.png';
      if (fext === '.svg') copyFileSync(raw, `${PUB}/flag/${e.key}.svg`);
      else run('magick', [raw, '-resize', '600x>', `${PUB}/flag/${e.key}.png`]);
      out.ext = fext.slice(1);
      if (e.gray) out.gray = true;
    }
    result.set(e.key, out);
    console.log('ok', e.key);
  } catch (err) {
    failures.push(`${e.key}: ${(err as Error).message}`);
    console.log('FAIL', e.key, (err as Error).message);
  }
}

const order = manifest.map((m) => m.key);
const list = [...result.values()].filter((o) => order.indexOf(o.key) >= 0).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
writeFileSync('src/content/media.json', JSON.stringify(list, null, 1) + '\n');
console.log(`written ${list.length} items, ${failures.length} failures`);
if (failures.length) { console.log(failures.join('\n')); process.exitCode = 1; }
