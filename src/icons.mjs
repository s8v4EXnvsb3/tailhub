// Icons: Lucide (ISC licence, https://lucide.dev), inlined as SVG at build time. No emoji anywhere.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/lucide-static/icons');
const cache = {};
export function ico(name, size = 20) {
  if (!cache[name]) {
    const f = path.join(dir, name + '.svg');
    if (!fs.existsSync(f)) throw new Error('Missing icon: ' + name);
    cache[name] = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  }
  return cache[name].replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`).replace('<svg', '<svg class="i" aria-hidden="true" focusable="false"');
}
export const CAT_ICON = { convert: 'audio-waveform', video: 'clapperboard', audio: 'headphones', ai: 'sparkles', speech: 'languages', text: 'type', dev: 'code-xml', gen: 'wand-sparkles', calc: 'calculator', image: 'image' };
const S = {
  'mp4-to-mp3': 'film', 'mov-to-mp3': 'film', 'webm-to-mp3': 'globe', 'm4a-to-mp3': 'music', 'whatsapp-audio-to-mp3': 'message-circle', 'video-to-mp3': 'video',
  'wav-to-mp3': 'audio-waveform', 'amr-to-mp3': 'smartphone', 'flac-to-mp3': 'disc-3', 'ogg-to-mp3': 'volume-2', 'aac-to-mp3': 'headphones', 'mkv-to-mp3': 'clapperboard',
  'avi-to-mp3': 'video', 'wma-to-mp3': 'music', 'mp3-to-wav': 'repeat', 'extract-voice-from-video': 'mic', 'mov-to-mp4': 'film', 'webm-to-mp4': 'film', 'mkv-to-mp4': 'clapperboard',
  'gif-to-mp4': 'refresh-cw', 'video-to-gif': 'image', 'mute-video': 'volume-x', 'compress-video-to-10mb': 'archive', 'compress-video-to-25mb': 'archive', 'compress-audio': 'trending-down',
  'iphone-ringtone-maker': 'bell', 'mp3-cutter': 'scissors', 'world-languages-text-to-speech': 'earth',
  'word-counter': 'list-ordered', 'case-converter': 'baseline', 'remove-duplicate-lines': 'eraser', 'text-diff': 'file-diff', 'find-and-replace': 'replace', 'text-sorter': 'arrow-down-a-z',
  'reverse-text': 'arrow-left-right', 'slug-generator': 'link', 'morse-code-translator': 'radio', 'binary-text-converter': 'binary',
  'json-formatter': 'braces', 'base64-encoder-decoder': 'lock', 'url-encoder-decoder': 'link', 'hash-generator': 'hash', 'jwt-decoder': 'id-card', 'regex-tester': 'regex',
  'csv-to-json': 'table-2', 'json-to-csv': 'file-spreadsheet', 'timestamp-converter': 'clock', 'markdown-previewer': 'file-text',
  'qr-code-generator': 'qr-code', 'password-generator': 'key-round', 'uuid-generator': 'fingerprint-pattern', 'random-number-generator': 'dices', 'lorem-ipsum-generator': 'scroll-text',
  'unit-converter': 'ruler', 'percentage-calculator': 'percent', 'age-calculator': 'cake', 'bmi-calculator': 'scale', 'loan-calculator': 'landmark', 'tip-calculator': 'utensils',
  'roman-numeral-converter': 'landmark', 'pomodoro-timer': 'timer', 'image-compressor': 'file-image', 'image-to-pdf': 'file-output', 'pdf-merge': 'combine', 'pdf-split': 'split',
  'image-to-base64': 'binary', 'color-converter': 'palette', 'css-gradient-generator': 'blend',
  'ocr-image-to-text': 'scan-text', 'background-remover': 'image-minus', 'speech-to-text': 'captions', 'blur-faces': 'scan-face', 'image-upscaler': 'maximize-2',
};
export const toolIcon = (t) => ico(S[t.slug] || (t.kind === 'tts' ? 'languages' : CAT_ICON[t.category]), 22);
export const catIcon = (c, size = 18) => ico(CAT_ICON[c.id], size);
