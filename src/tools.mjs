// Tool catalogue. Every page on the site is generated from this file.
const AUDIO_IN = 'audio/*,.amr,.wma,.m4a,.aac,.flac,.ogg,.wav,.opus';
const VIDEO_IN = 'video/*,.mkv,.avi,.mov,.webm,.mp4,.3gp,.flv';
const ANY_IN = AUDIO_IN + ',' + VIDEO_IN;

const conv = (slug, title, from, to, accept, icon, extra = {}) => ({
  slug, title, kind: 'ffmpeg', mode: 'convert', out: to, accept, icon, category: 'convert',
  desc: `Convert ${from} to ${to.toUpperCase()} online for free. Runs in your browser — your file is never uploaded.`,
  ...extra,
});

export const tools = [
  // ---- Audio: X to MP3
  conv('mp4-to-mp3', 'MP4 to MP3', 'MP4 video', 'mp3', VIDEO_IN, '🎬'),
  conv('mov-to-mp3', 'MOV to MP3', 'MOV video', 'mp3', VIDEO_IN, '🍎'),
  conv('webm-to-mp3', 'WebM to MP3', 'WebM video', 'mp3', VIDEO_IN, '🌐'),
  conv('m4a-to-mp3', 'M4A to MP3', 'M4A audio', 'mp3', AUDIO_IN, '🎵'),
  conv('whatsapp-audio-to-mp3', 'WhatsApp Audio to MP3', 'WhatsApp voice notes (OPUS/OGG)', 'mp3', AUDIO_IN, '💬'),
  conv('video-to-mp3', 'Video to MP3', 'any video', 'mp3', VIDEO_IN, '📼'),
  conv('wav-to-mp3', 'WAV to MP3', 'WAV audio', 'mp3', AUDIO_IN, '〰️'),
  conv('amr-to-mp3', 'AMR to MP3', 'AMR audio', 'mp3', AUDIO_IN, '📱'),
  conv('flac-to-mp3', 'FLAC to MP3', 'FLAC audio', 'mp3', AUDIO_IN, '💿'),
  conv('ogg-to-mp3', 'OGG to MP3', 'OGG audio', 'mp3', AUDIO_IN, '🔊'),
  conv('aac-to-mp3', 'AAC to MP3', 'AAC audio', 'mp3', AUDIO_IN, '🎧'),
  conv('mkv-to-mp3', 'MKV to MP3', 'MKV video', 'mp3', VIDEO_IN, '🎞️'),
  conv('avi-to-mp3', 'AVI to MP3', 'AVI video', 'mp3', VIDEO_IN, '📹'),
  conv('wma-to-mp3', 'WMA to MP3', 'WMA audio', 'mp3', AUDIO_IN, '🪟'),
  conv('mp3-to-wav', 'MP3 to WAV', 'MP3 audio', 'wav', AUDIO_IN, '🔁'),
  conv('extract-voice-from-video', 'Extract Voice from Video', 'a video (keeps the audio track)', 'mp3', VIDEO_IN, '🎙️', {
    desc: 'Pull the voice / audio track out of any video as an MP3. Free, private, runs in your browser.' }),

  // ---- Video
  conv('mov-to-mp4', 'MOV to MP4', 'MOV video', 'mp4', VIDEO_IN, '🎥', { category: 'video' }),
  conv('webm-to-mp4', 'WebM to MP4', 'WebM video', 'mp4', VIDEO_IN, '🎥', { category: 'video' }),
  conv('mkv-to-mp4', 'MKV to MP4', 'MKV video', 'mp4', VIDEO_IN, '🎥', { category: 'video' }),
  { slug: 'compress-video-to-10mb', title: 'Compress Video to 10 MB', kind: 'ffmpeg', mode: 'compress-video', targetMB: 10, accept: VIDEO_IN, icon: '🗜️', category: 'video',
    desc: 'Shrink any video to about 10 MB (great for email and chat apps). Runs locally in your browser.' },
  { slug: 'compress-video-to-25mb', title: 'Compress Video to 25 MB', kind: 'ffmpeg', mode: 'compress-video', targetMB: 25, accept: VIDEO_IN, icon: '🗜️', category: 'video',
    desc: 'Shrink any video to about 25 MB (Gmail attachment limit). Runs locally in your browser.' },

  // ---- Audio utilities
  { slug: 'compress-audio', title: 'Compress Audio', kind: 'ffmpeg', mode: 'compress-audio', accept: AUDIO_IN, icon: '📉', category: 'audio',
    desc: 'Reduce audio file size by lowering the bitrate. Output is MP3. Free and private.' },
  { slug: 'iphone-ringtone-maker', title: 'iPhone Ringtone Maker', kind: 'ffmpeg', mode: 'ringtone', accept: ANY_IN, icon: '🔔', category: 'audio',
    desc: 'Trim any song or clip to 30 seconds or less and download an iPhone-ready .m4r ringtone.' },

  // ---- Text to speech
  ...[
    ['hindi', 'Hindi', 'hi-IN', 'नमस्ते, यह एक परीक्षण है।'],
    ['british', 'British English', 'en-GB', 'Hello! This is a British English voice test.'],
    ['spanish', 'Spanish', 'es-ES', 'Hola, esto es una prueba de voz.'],
    ['portuguese', 'Portuguese', 'pt-BR', 'Olá, este é um teste de voz.'],
    ['french', 'French', 'fr-FR', 'Bonjour, ceci est un test de voix.'],
    ['german', 'German', 'de-DE', 'Hallo, das ist ein Stimmtest.'],
    ['italian', 'Italian', 'it-IT', 'Ciao, questo è un test vocale.'],
    ['arabic', 'Arabic', 'ar-SA', 'مرحبا، هذا اختبار للصوت.'],
    ['japanese', 'Japanese', 'ja-JP', 'こんにちは、これは音声テストです。'],
    ['chinese', 'Chinese', 'zh-CN', '你好，这是一个语音测试。'],
    ['tamil', 'Tamil', 'ta-IN', 'வணக்கம், இது ஒரு குரல் சோதனை.'],
    ['telugu', 'Telugu', 'te-IN', 'నమస్కారం, ఇది ఒక వాయిస్ పరీక్ష.'],
    ['bengali', 'Bengali', 'bn-IN', 'নমস্কার, এটি একটি ভয়েস পরীক্ষা।'],
    ['marathi', 'Marathi', 'mr-IN', 'नमस्कार, ही एक आवाज चाचणी आहे.'],
  ].map(([k, name, lang, sample]) => ({
    slug: `${k}-text-to-speech`, title: `${name} Text to Speech`, kind: 'tts', lang, sample, icon: '🗣️', category: 'speech',
    desc: `Turn ${name} text into natural-sounding speech. Uses your device's built-in voices — free, instant, private.`,
  })),
  { slug: 'indian-languages-text-to-speech', title: 'Indian Languages Text to Speech', kind: 'tts', lang: 'hi-IN', multi: ['hi-IN', 'en-IN', 'ta-IN', 'te-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN'],
    sample: 'नमस्ते, यह एक परीक्षण है।', icon: '🇮🇳', category: 'speech',
    desc: 'Text to speech for Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi and Indian English.' },

  // ---- Text utilities
  { slug: 'word-counter', title: 'Word & Character Counter', kind: 'util', icon: '🔢', category: 'text', desc: 'Count words, characters, sentences, paragraphs and reading time as you type.' },
  { slug: 'case-converter', title: 'Case Converter', kind: 'util', icon: '🔠', category: 'text', desc: 'Convert text to UPPER, lower, Title, Sentence, camelCase, snake_case and kebab-case.' },
  { slug: 'remove-duplicate-lines', title: 'Remove Duplicate Lines', kind: 'util', icon: '🧹', category: 'text', desc: 'Remove repeated lines from a list, with sort, trim and case-insensitive options.' },
  { slug: 'text-diff', title: 'Text Diff Checker', kind: 'util', icon: '🔍', category: 'text', desc: 'Compare two texts and see what was added or removed, word by word.' },
  { slug: 'lorem-ipsum-generator', title: 'Lorem Ipsum Generator', kind: 'util', icon: '📜', category: 'text', desc: 'Generate placeholder paragraphs, sentences or words.' },
  { slug: 'json-formatter', title: 'JSON Formatter & Validator', kind: 'util', icon: '🧾', category: 'dev', desc: 'Pretty-print, minify and validate JSON with clear error messages.' },
  { slug: 'base64-encoder-decoder', title: 'Base64 Encoder / Decoder', kind: 'util', icon: '🔐', category: 'dev', desc: 'Encode or decode Base64, with full Unicode support.' },
  { slug: 'qr-code-generator', title: 'QR Code Generator', kind: 'util', icon: '▦', category: 'dev', desc: 'Make a QR code for any link or text. Download as PNG or SVG.' },

  // ---- Image & PDF
  { slug: 'image-compressor', title: 'Image Compressor & Converter', kind: 'util', icon: '🖼️', category: 'image', desc: 'Compress, resize and convert images to JPG, PNG or WebP. Nothing leaves your device.' },
  { slug: 'pdf-merge', title: 'Merge PDF Files', kind: 'util', icon: '📚', category: 'image', desc: 'Combine multiple PDFs into one, in the order you choose. Private, in your browser.' },
];

export const categories = [
  { id: 'convert', name: 'Audio converters', blurb: 'Turn video and audio files into MP3 or WAV.' },
  { id: 'video', name: 'Video tools', blurb: 'Convert to MP4 and shrink for sharing.' },
  { id: 'audio', name: 'Audio tools', blurb: 'Compress audio and make ringtones.' },
  { id: 'speech', name: 'Text to Speech', blurb: 'Read text aloud in 15 languages.' },
  { id: 'text', name: 'Text tools', blurb: 'Count, clean, compare and generate text.' },
  { id: 'dev', name: 'Developer tools', blurb: 'JSON, Base64 and QR codes.' },
  { id: 'image', name: 'Image & PDF', blurb: 'Compress images, merge PDFs.' },
];
