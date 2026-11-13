import { FFmpeg } from '/vendor/ffmpeg/index.js';
import { fetchFile } from '/vendor/ffmpeg-util/index.js';

const T = window.TOOL;
const $ = (id) => document.getElementById(id);
const drop = $('drop'), fileIn = $('file'), go = $('go'), prog = $('prog'), fill = $('barfill'), status = $('status'), done = $('done');
let file = null, ffmpeg = null, logTail = [];

const fmtMB = (b) => (b / 1048576).toFixed(2) + ' MB';
const ext = (n) => (n.split('.').pop() || 'bin').toLowerCase();
const base = (n) => n.replace(/\.[^.]+$/, '');

function setFile(f) {
  if (!f) return;
  file = f;
  $('fname').textContent = `${f.name} · ${fmtMB(f.size)}`;
  go.disabled = false; done.hidden = true;
  if (T.mode === 'ringtone' || T.mode === 'trim') { const p = $('preview'); p.src = URL.createObjectURL(f); p.hidden = false; }
}
drop.addEventListener('click', () => fileIn.click());
fileIn.addEventListener('change', () => setFile(fileIn.files[0]));
['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (ev) => setFile(ev.dataTransfer.files[0]));

async function load() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  ffmpeg.on('progress', ({ progress }) => { if (progress >= 0 && progress <= 1) { fill.style.width = (progress * 100).toFixed(0) + '%'; status.textContent = `Processing… ${(progress * 100).toFixed(0)}%`; } });
  ffmpeg.on('log', ({ message }) => { logTail.push(message); if (logTail.length > 30) logTail.shift(); });
  await ffmpeg.load({ coreURL: '/vendor/ffmpeg-core/ffmpeg-core.js', wasmURL: '/vendor/ffmpeg-core/ffmpeg-core.wasm' });
  return ffmpeg;
}

function mediaDuration(f) {
  return new Promise((res) => {
    const el = document.createElement(f.type.startsWith('audio') ? 'audio' : 'video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { res(el.duration); URL.revokeObjectURL(el.src); };
    el.onerror = () => res(NaN);
    el.src = URL.createObjectURL(f);
  });
}

async function buildArgs(inName) {
  switch (T.mode) {
    case 'convert':
      if (T.out === 'mp3') return { out: 'out.mp3', args: ['-i', inName, '-vn', '-c:a', 'libmp3lame', '-q:a', '2'], mime: 'audio/mpeg' };
      if (T.out === 'gif') return { out: 'out.gif', args: ['-t', '15', '-i', inName, '-vf', 'fps=12,scale=480:-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse', '-loop', '0'], mime: 'image/gif', outExt: 'gif' };
      if (T.out === 'wav') return { out: 'out.wav', args: ['-i', inName, '-vn', '-c:a', 'pcm_s16le'], mime: 'audio/wav' };
      return { out: 'out.mp4', args: ['-i', inName, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'], mime: 'video/mp4' };
    case 'compress-audio': {
      const a = ['-i', inName, '-vn', '-c:a', 'libmp3lame', '-b:a', $('bitrate').value];
      if ($('chan').value) a.push('-ac', $('chan').value);
      return { out: 'out.mp3', args: a, mime: 'audio/mpeg', suffix: '-compressed', outExt: 'mp3' };
    }
    case 'compress-video': {
      const dur = await mediaDuration(file);
      if (!dur || !isFinite(dur)) throw new Error('Could not read the video length. Try an MP4 file.');
      const audioK = 96;
      const totalK = (T.targetMB * 8192 * 0.92) / dur; // kbit/s budget incl. audio
      const videoK = Math.max(100, Math.floor(totalK - audioK));
      const h = $('height').value;
      const a = ['-i', inName, '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', videoK + 'k', '-maxrate', Math.floor(videoK * 1.4) + 'k', '-bufsize', videoK * 2 + 'k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', audioK + 'k', '-movflags', '+faststart'];
      if (h) a.push('-vf', `scale=-2:'min(${h},ih)'`);
      return { out: 'out.mp4', args: a, mime: 'video/mp4', suffix: `-${T.targetMB}mb`, outExt: 'mp4' };
    }
    case 'mute':
      return { out: 'out.mp4', args: ['-i', inName, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-movflags', '+faststart'], mime: 'video/mp4', suffix: '-muted', outExt: 'mp4' };
    case 'trim': {
      const s = Math.max(0, parseFloat($('start').value) || 0), l = Math.max(0.5, parseFloat($('len').value) || 30);
      return { out: 'out.mp3', args: ['-ss', String(s), '-t', String(l), '-i', inName, '-vn', '-c:a', 'libmp3lame', '-q:a', '2'], mime: 'audio/mpeg', suffix: '-cut', outExt: 'mp3' };
    }
    case 'ringtone': {
      const s = Math.max(0, parseFloat($('start').value) || 0), l = Math.min(40, Math.max(1, parseFloat($('len').value) || 30));
      return { out: 'out.m4r', args: ['-ss', String(s), '-t', String(l), '-i', inName, '-vn', '-c:a', 'aac', '-b:a', '192k', '-f', 'ipod'], mime: 'audio/x-m4r', outExt: 'm4r' };
    }
  }
}

go.addEventListener('click', async () => {
  if (!file) return;
  go.disabled = true; done.hidden = true; prog.hidden = false; fill.style.width = '0%'; logTail = [];
  status.textContent = 'Loading engine (first time ~30 MB)…';
  try {
    const ff = await load();
    status.textContent = 'Reading file…';
    const inName = 'input.' + ext(file.name);
    await ff.writeFile(inName, await fetchFile(file));
    const { out, args, mime, suffix = '', outExt } = await buildArgs(inName);
    status.textContent = 'Processing… 0%';
    const code = await ff.exec([...args, '-y', out]);
    if (code !== 0) throw new Error(logTail.some((l) => /does not contain any stream|Output file is empty/.test(l)) ? 'This file has no audio track to extract.' : 'Could not process this file. Is it a valid media file?');
    const data = await ff.readFile(out);
    const blob = new Blob([data.buffer], { type: mime });
    const name = base(file.name) + suffix + '.' + (outExt || T.out || 'mp3');
    const url = URL.createObjectURL(blob);
    const isGif = mime === 'image/gif', isVideo = mime.startsWith('video'), isAudio = mime.startsWith('audio') && !mime.includes('m4r');
    const saved = file.size ? Math.round((1 - blob.size / file.size) * 100) : 0;
    done.innerHTML = `<b>✅ Done — ${name} (${fmtMB(blob.size)})</b>${T.mode.startsWith('compress') ? `<span class="note ok">${saved > 0 ? saved + '% smaller than the original (' + fmtMB(file.size) + ')' : 'Result is not smaller than the original — try a lower setting.'}</span>` : ''}${isGif ? `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin-top:10px">` : ''}${isVideo ? `<video controls src="${url}"></video>` : isAudio ? `<audio controls src="${url}"></audio>` : ''}<a class="btn dl" download="${name}" href="${url}">⬇ Download ${name}</a>`;
    done.hidden = false; status.textContent = 'Finished.'; fill.style.width = '100%';
    try { await ff.deleteFile(inName); await ff.deleteFile(out); } catch {}
  } catch (e) {
    status.textContent = '⚠ ' + (e.message || e); status.classList.add('err');
    ffmpeg = null; // force fresh engine after a crash / OOM
  } finally { go.disabled = false; }
});
