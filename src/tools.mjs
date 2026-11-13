// TailHub tool catalogue. Every tool page, sidebar entry and blog post is generated from this file.
const AUDIO_IN = 'audio/*,.amr,.wma,.m4a,.aac,.flac,.ogg,.wav,.opus';
const VIDEO_IN = 'video/*,.mkv,.avi,.mov,.webm,.mp4,.3gp,.flv';
const ANY_IN = AUDIO_IN + '' + VIDEO_IN;

const conv = (slug, title, from, to, accept, icon, extra = {}) => ({
  slug, title, kind: 'ffmpeg', mode: 'convert', out: to, accept, icon, category: 'convert',
  desc: `Convert ${from} to ${to.toUpperCase()} online for free. Runs in your browser, your file is never uploaded.`,
  ...extra,
});
const ai = (slug, title, desc) => ({ slug, title, kind: 'ai', icon: '', category: 'ai', desc });
const u = (slug, title, icon, category, desc) => ({ slug, title, kind: 'util', icon, category, desc });

const LANGS = [
  ['korean', 'Korean', 'ko-KR', '안녕하세요, 음성 테스트입니다.', 'Korean has about 80 million speakers and is written in Hangul, a phonetic alphabet.'],
  ['russian', 'Russian', 'ru-RU', 'Здравствуйте, это тест голоса.', 'Russian has over 250 million speakers and is written in Cyrillic.'],
  ['turkish', 'Turkish', 'tr-TR', 'Merhaba, bu bir ses testidir.', 'Turkish has about 85 million speakers and uses Latin letters with special characters such as ç, ğ, ı and ş.'],
  ['dutch', 'Dutch', 'nl-NL', 'Hallo, dit is een stemtest.', 'Dutch is spoken in the Netherlands and Belgium by roughly 25 million native speakers.'],
  ['polish', 'Polish', 'pl-PL', 'Cześć, to jest test głosu.', 'Polish has about 40 million speakers and relies on diacritics such as ą, ę and ł.'],
  ['indonesian', 'Indonesian', 'id-ID', 'Halo, ini adalah tes suara.', 'Indonesian is the national language of Indonesia and is used by well over 200 million people.'],
  ['malay', 'Malay', 'ms-MY', 'Helo, ini adalah ujian suara.', 'Malay is an official language of Malaysia, Brunei and Singapore.'],
  ['vietnamese', 'Vietnamese', 'vi-VN', 'Xin chào, đây là bài kiểm tra giọng nói.', 'Vietnamese has about 85 million speakers, is tonal, and uses Latin letters with many diacritics.'],
  ['thai', 'Thai', 'th-TH', 'สวัสดี นี่คือการทดสอบเสียง', 'Thai is tonal and written without spaces between words, which makes good voices important.'],
  ['swedish', 'Swedish', 'sv-SE', 'Hej, det här är ett rösttest.', 'Swedish is spoken by about 10 million people, mainly in Sweden and Finland.'],
  ['urdu', 'Urdu', 'ur-PK', 'ہیلو، یہ آواز کا ٹیسٹ ہے۔', 'Urdu is the national language of Pakistan and is written right to left in an Arabic-based script.'],
  ['greek', 'Greek', 'el-GR', 'Γεια σας, αυτή είναι μια δοκιμή φωνής.', 'Greek has its own alphabet and is one of the oldest written languages in the world.'],
  ['ukrainian', 'Ukrainian', 'uk-UA', 'Привіт, це тест голосу.', 'Ukrainian has about 40 million speakers and is written in Cyrillic.'],
  ['hebrew', 'Hebrew', 'he-IL', 'שלום, זוהי בדיקת קול.', 'Hebrew is written right to left and is the official language of Israel.'],
  ['filipino', 'Filipino', 'fil-PH', 'Kumusta, ito ay pagsubok ng boses.', 'Filipino, based on Tagalog, is the national language of the Philippines.'],
];

const WORLD = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'zh-CN', 'hi-IN', 'ar-SA', 'ko-KR', 'ru-RU', 'tr-TR', 'nl-NL', 'pl-PL', 'id-ID', 'ms-MY', 'vi-VN', 'th-TH', 'sv-SE', 'ur-PK', 'el-GR', 'uk-UA', 'he-IL', 'fil-PH'];
const SAMPLES = { 'en-US': 'Hello! This is a voice test.', 'en-GB': 'Hello! This is a British English voice test.', 'es-ES': 'Hola, esto es una prueba de voz.', 'fr-FR': 'Bonjour, ceci est un test de voix.', 'de-DE': 'Hallo, das ist ein Stimmtest.', 'it-IT': 'Ciao, questo è un test vocale.', 'pt-BR': 'Olá, este é um teste de voz.', 'ja-JP': 'こんにちは、これは音声テストです。', 'zh-CN': '你好，这是一个语音测试。', 'hi-IN': 'नमस्ते, यह एक परीक्षण है।', 'ar-SA': 'مرحبا، هذا اختبار للصوت.', ...Object.fromEntries(LANGS.map((l) => [l[2], l[3]])) };

export const tools = [
  // ---------- Audio converters
  conv('mp4-to-mp3', 'MP4 to MP3', 'MP4 video', 'mp3', VIDEO_IN, ''),
  conv('mov-to-mp3', 'MOV to MP3', 'MOV video', 'mp3', VIDEO_IN, ''),
  conv('webm-to-mp3', 'WebM to MP3', 'WebM video', 'mp3', VIDEO_IN, ''),
  conv('m4a-to-mp3', 'M4A to MP3', 'M4A audio', 'mp3', AUDIO_IN, ''),
  conv('whatsapp-audio-to-mp3', 'WhatsApp Audio to MP3', 'WhatsApp voice notes (OPUS/OGG)', 'mp3', AUDIO_IN, ''),
  conv('video-to-mp3', 'Video to MP3', 'any video', 'mp3', VIDEO_IN, ''),
  conv('wav-to-mp3', 'WAV to MP3', 'WAV audio', 'mp3', AUDIO_IN, ''),
  conv('amr-to-mp3', 'AMR to MP3', 'AMR audio', 'mp3', AUDIO_IN, ''),
  conv('flac-to-mp3', 'FLAC to MP3', 'FLAC audio', 'mp3', AUDIO_IN, ''),
  conv('ogg-to-mp3', 'OGG to MP3', 'OGG audio', 'mp3', AUDIO_IN, ''),
  conv('aac-to-mp3', 'AAC to MP3', 'AAC audio', 'mp3', AUDIO_IN, ''),
  conv('mkv-to-mp3', 'MKV to MP3', 'MKV video', 'mp3', VIDEO_IN, ''),
  conv('avi-to-mp3', 'AVI to MP3', 'AVI video', 'mp3', VIDEO_IN, ''),
  conv('wma-to-mp3', 'WMA to MP3', 'WMA audio', 'mp3', AUDIO_IN, ''),
  conv('mp3-to-wav', 'MP3 to WAV', 'MP3 audio', 'wav', AUDIO_IN, ''),
  conv('extract-voice-from-video', 'Extract Voice from Video', 'a video (keeps the audio track)', 'mp3', VIDEO_IN, '', { desc: 'Pull the voice / audio track out of any video as an MP3. Free, private, runs in your browser.' }),

  // ---------- Video
  conv('mov-to-mp4', 'MOV to MP4', 'MOV video', 'mp4', VIDEO_IN, '', { category: 'video' }),
  conv('webm-to-mp4', 'WebM to MP4', 'WebM video', 'mp4', VIDEO_IN, '', { category: 'video' }),
  conv('mkv-to-mp4', 'MKV to MP4', 'MKV video', 'mp4', VIDEO_IN, '', { category: 'video' }),
  conv('gif-to-mp4', 'GIF to MP4', 'an animated GIF', 'mp4', 'image/gif,.gif', '', { category: 'video' }),
  conv('video-to-gif', 'Video to GIF', 'a video clip (first 15 seconds)', 'gif', VIDEO_IN, '', { category: 'video' }),
  { slug: 'mute-video', title: 'Remove Audio from Video', kind: 'ffmpeg', mode: 'mute', out: 'mp4', accept: VIDEO_IN, icon: '', category: 'video', btn: 'Remove audio', desc: 'Strip the sound from any video and download a silent MP4. Private, runs in your browser.' },
  { slug: 'compress-video-to-10mb', title: 'Compress Video to 10 MB', kind: 'ffmpeg', mode: 'compress-video', targetMB: 10, accept: VIDEO_IN, icon: '', category: 'video', desc: 'Shrink any video to about 10 MB (great for email and chat apps). Runs locally in your browser.' },
  { slug: 'compress-video-to-25mb', title: 'Compress Video to 25 MB', kind: 'ffmpeg', mode: 'compress-video', targetMB: 25, accept: VIDEO_IN, icon: '', category: 'video', desc: 'Shrink any video to about 25 MB (Gmail attachment limit). Runs locally in your browser.' },

  // ---------- Audio utilities
  { slug: 'compress-audio', title: 'Compress Audio', kind: 'ffmpeg', mode: 'compress-audio', accept: AUDIO_IN, icon: '', category: 'audio', desc: 'Reduce audio file size by lowering the bitrate. Output is MP3. Free and private.' },
  { slug: 'iphone-ringtone-maker', title: 'iPhone Ringtone Maker', kind: 'ffmpeg', mode: 'ringtone', accept: ANY_IN, icon: '', category: 'audio', btn: 'Create ringtone', desc: 'Trim any song or clip to 30 seconds or less and download an iPhone-ready .m4r ringtone.' },
  { slug: 'mp3-cutter', title: 'MP3 Cutter / Audio Trimmer', kind: 'ffmpeg', mode: 'trim', out: 'mp3', accept: ANY_IN, icon: '', category: 'audio', btn: 'Cut audio', desc: 'Cut a section out of any audio or video file and save it as MP3. Choose a start time and length.' },

  // ---------- Text to speech (popular languages)
  ...LANGS.map(([k, name, lang, sample, fact]) => ({
    slug: `${k}-text-to-speech`, title: `${name} Text to Speech`, kind: 'tts', lang, sample, fact, langName: name, icon: '', category: 'speech',
    desc: `Turn ${name} text into natural-sounding speech. Uses your device's built-in voices: free, instant, private.`,
  })),
  { slug: 'world-languages-text-to-speech', title: 'World Languages Text to Speech', kind: 'tts', lang: 'en-US', multi: WORLD, samples: SAMPLES, sample: SAMPLES['en-US'], langName: 'many languages', icon: '', category: 'speech',
    desc: 'One page for 26 languages: English, Spanish, French, German, Japanese, Chinese, Hindi, Arabic, Korean, Russian, Turkish and more.' },

  // ---------- Text
  u('word-counter', 'Word & Character Counter', '', 'text', 'Count words, characters, sentences, paragraphs and reading time as you type.'),
  u('case-converter', 'Case Converter', '', 'text', 'Convert text to UPPER, lower, Title, Sentence, camelCase, snake_case and kebab-case.'),
  u('remove-duplicate-lines', 'Remove Duplicate Lines', '', 'text', 'Remove repeated lines from a list, with sort, trim and case-insensitive options.'),
  u('text-diff', 'Text Diff Checker', '', 'text', 'Compare two texts and see what was added or removed, word by word.'),
  u('find-and-replace', 'Find and Replace Text', '', 'text', 'Find and replace text in bulk, with case-sensitive and regular-expression options.'),
  u('text-sorter', 'Sort Lines Alphabetically', '', 'text', 'Sort lines A to Z, Z to A, by length or number, or shuffle them at random.'),
  u('reverse-text', 'Reverse Text', '', 'text', 'Reverse the characters, words or lines of any text.'),
  u('slug-generator', 'URL Slug Generator', '', 'text', 'Turn any title into a clean, SEO-friendly URL slug.'),
  u('morse-code-translator', 'Morse Code Translator', '', 'text', 'Translate text to Morse code and back, and play it as audio beeps.'),
  u('binary-text-converter', 'Text to Binary Converter', '', 'text', 'Convert text to binary, octal, decimal or hex, and decode it back.'),

  // ---------- Developer
  u('json-formatter', 'JSON Formatter & Validator', '', 'dev', 'Pretty-print, minify and validate JSON with clear error messages.'),
  u('base64-encoder-decoder', 'Base64 Encoder / Decoder', '', 'dev', 'Encode or decode Base64, with full Unicode support.'),
  u('url-encoder-decoder', 'URL Encoder / Decoder', '', 'dev', 'Percent-encode or decode URLs and query-string values.'),
  u('hash-generator', 'Hash Generator (SHA-256)', '', 'dev', 'Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes of any text, live.'),
  u('jwt-decoder', 'JWT Decoder', '', 'dev', 'Decode a JSON Web Token and read its header, payload and expiry. Nothing is sent anywhere.'),
  u('regex-tester', 'Regex Tester', '', 'dev', 'Test JavaScript regular expressions with live match highlighting.'),
  u('csv-to-json', 'CSV to JSON Converter', '', 'dev', 'Convert CSV or TSV data into a JSON array in one click.'),
  u('json-to-csv', 'JSON to CSV Converter', '', 'dev', 'Turn a JSON array of objects into CSV for Excel or Google Sheets.'),
  u('timestamp-converter', 'Unix Timestamp Converter', '', 'dev', 'Convert Unix epoch timestamps to readable dates and back.'),
  u('markdown-previewer', 'Markdown Previewer', '', 'dev', 'Write Markdown on the left and see the formatted result on the right.'),

  // ---------- AI tools (models run in the browser)
  ai('ocr-image-to-text', 'Image to Text (OCR)', 'Read the text in a photo, screenshot or scan and copy it. 16 languages, runs in your browser.'),
  ai('background-remover', 'Background Remover', 'Cut the background out of a portrait photo and save a transparent PNG. No upload.'),
  ai('speech-to-text', 'Speech to Text & Subtitles', 'Transcribe audio or video to text, SRT or VTT subtitles using Whisper, running on your device.'),
  ai('blur-faces', 'Blur Faces in Photos', 'Find faces in a photo and blur, pixelate or black them out before you share it.'),
  ai('image-upscaler', 'AI Image Upscaler', 'Enlarge a small image to twice its size with a super-resolution model that runs in your browser.'),

  // ---------- Generators
  u('qr-code-generator', 'QR Code Generator', '', 'gen', 'Make a QR code for any link or text. Download as PNG or SVG.'),
  u('password-generator', 'Password Generator', '', 'gen', 'Create strong random passwords using your browser\'s secure random generator.'),
  u('uuid-generator', 'UUID Generator', '', 'gen', 'Generate random version-4 UUIDs, one or hundreds at a time.'),
  u('random-number-generator', 'Random Number Generator', '', 'gen', 'Pick random numbers in any range, with or without repeats.'),
  u('lorem-ipsum-generator', 'Lorem Ipsum Generator', '', 'gen', 'Generate placeholder paragraphs, sentences or words.'),

  // ---------- Calculators
  u('unit-converter', 'Unit Converter', '', 'calc', 'Convert length, weight, temperature, volume, speed, area and data size.'),
  u('percentage-calculator', 'Percentage Calculator', '', 'calc', 'Work out percentages, percentage change and "what percent is X of Y".'),
  u('age-calculator', 'Age Calculator', '', 'calc', 'Find an exact age in years, months and days, plus days until the next birthday.'),
  u('bmi-calculator', 'BMI Calculator', '', 'calc', 'Calculate body mass index in metric or imperial units.'),
  u('loan-calculator', 'Loan Calculator', '', 'calc', 'Estimate monthly payments and total interest for a loan or mortgage.'),
  u('tip-calculator', 'Tip Calculator', '', 'calc', 'Split a bill between friends and work out the tip per person. Choose a tip percentage and see each share instantly.'),
  u('roman-numeral-converter', 'Roman Numeral Converter', '', 'calc', 'Convert numbers to Roman numerals and back (1 to 3999).'),
  u('pomodoro-timer', 'Pomodoro Timer', '', 'calc', 'A focus timer with 25-minute work sessions and short breaks.'),

  // ---------- Image, PDF & design
  u('image-compressor', 'Image Compressor & Converter', '', 'image', 'Compress, resize and convert images to JPG, PNG or WebP. Nothing leaves your device.'),
  u('image-to-pdf', 'Image to PDF', '', 'image', 'Combine JPG, PNG and WebP images into a single PDF.'),
  u('pdf-merge', 'Merge PDF Files', '', 'image', 'Combine multiple PDFs into one, in the order you choose. Private, in your browser.'),
  u('pdf-split', 'Split PDF / Extract Pages', '', 'image', 'Pull selected pages or page ranges out of a PDF into a new file.'),
  u('image-to-base64', 'Image to Base64', '', 'image', 'Turn an image into a Base64 data URI for use in HTML, CSS or JSON.'),
  u('color-converter', 'Color Picker & Converter', '', 'image', 'Convert colors between HEX, RGB and HSL with a live picker.'),
  u('css-gradient-generator', 'CSS Gradient Generator', '', 'image', 'Design linear and radial gradients and copy the CSS.'),
];

export const categories = [
  { id: 'convert', name: 'Audio converters', icon: '', hue: 265, blurb: 'Turn video and audio files into MP3 or WAV.' },
  { id: 'video', name: 'Video tools', icon: '', hue: 330, blurb: 'Convert, make GIFs, mute and shrink for sharing.' },
  { id: 'audio', name: 'Audio tools', icon: '', hue: 25, blurb: 'Compress, cut and make ringtones.' },
  { id: 'ai', name: 'AI tools', icon: '', hue: 20, blurb: 'OCR, background removal, subtitles, face blur and upscaling, all on your device.' },
  { id: 'speech', name: 'Text to Speech', icon: '', hue: 160, blurb: 'Read text aloud in 26 languages.' },
  { id: 'text', name: 'Text tools', icon: '', hue: 200, blurb: 'Count, clean, sort, compare and encode text.' },
  { id: 'dev', name: 'Developer tools', icon: '', hue: 140, blurb: 'JSON, hashes, JWT, regex, CSV and more.' },
  { id: 'gen', name: 'Generators', icon: '', hue: 45, blurb: 'Passwords, UUIDs, QR codes and random numbers.' },
  { id: 'calc', name: 'Calculators', icon: '', hue: 190, blurb: 'Units, percentages, loans, age and focus timer.' },
  { id: 'image', name: 'Image, PDF & design', icon: '', hue: 300, blurb: 'Compress images, work with PDFs, pick colors.' },
];

export const featured = ['mp4-to-mp3', 'compress-video-to-10mb', 'video-to-gif', 'image-compressor', 'pdf-merge', 'qr-code-generator', 'password-generator', 'json-formatter'];
