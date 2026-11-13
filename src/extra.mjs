// Extra depth for the posts people are most likely to search for. Every claim must match the tool's real behaviour.
export const EXTRA = {
  'compress-video-to-25mb': {
    notes: [
      ['Why 25 MB is not always 25 MB', 'Email sends attachments in an encoded form that makes them larger than the file on your disk. A video that is 24 MB on your computer can still be refused by a 25 MB limit. If the limit is strict, run the 10 MB tool instead, or share a link rather than an attachment.'],
      ['What decides the quality', 'File size is bitrate multiplied by length. A 25 MB budget is generous for a 1-minute clip and tight for a 20-minute one. Lowering the maximum height is the quickest way to give each remaining pixel more bitrate.'],
    ],
    faq: [
      ['Does the video get uploaded?', 'No. Compression runs in your browser using ffmpeg compiled to WebAssembly. The file stays on your device.'],
      ['Why is my result slightly above or below 25 MB?', 'The tool picks a bitrate to land near the target, and the encoder does not hit it exactly. Treat the target as approximate.'],
      ['What format is the output?', 'An MP4 with H.264 video and AAC audio, which plays on nearly every phone, computer and TV.'],
    ],
  },
  'compress-video-to-10mb': {
    notes: [
      ['Pick the height before anything else', 'For a 10 MB limit, 720p suits clips up to about a minute. For longer clips choose 480p so the picture does not turn blocky. A sharp 480p video looks better than a blocky 720p one.'],
      ['Screen recordings compress well', 'Screen recordings have large flat areas and little motion, so they shrink much more than camera footage at the same quality.'],
    ],
    faq: [
      ['Can it compress a video that is very long?', 'It can, but the length sets the limit on quality. Past a few minutes, 10 MB leaves very little bitrate and the result will look soft. Consider the 25 MB tool or splitting the video.'],
      ['Does it work on my phone?', 'It runs on phones, but compression is slower and needs free memory. For long videos a laptop is more reliable.'],
      ['Is anything sent to a server?', 'No. The engine downloads once and your video is processed on your device.'],
    ],
  },
  'background-remover': {
    notes: [
      ['What it is built for', 'The model is a portrait matting model, so it is trained to separate a person from the background. It is not a general object cut-out tool. For product photos or pets, expect rougher edges.'],
      ['Getting cleaner edges', 'Use a photo where the person is well lit and clearly separated from the background. Hair against a busy background is the hardest case. If edges look rough, try a photo taken against a plainer wall.'],
    ],
    faq: [
      ['Why does the first run take longer?', 'Your browser downloads the model the first time you use the tool. After that it is cached, so later runs start faster.'],
      ['What file do I get?', 'A PNG with a transparent background, or a PNG with a solid colour if you pick one.'],
      ['Are my photos uploaded?', 'No. The model runs in your browser, and the photo is not sent anywhere. Only the model file is downloaded.'],
    ],
  },
  'speech-to-text': {
    notes: [
      ['Choosing between Tiny and Base', 'Base is more accurate and a larger download. Tiny is faster and smaller. On a phone or an older laptop start with Tiny. If names or technical words come out wrong, switch to Base.'],
      ['Making subtitles', 'Switch the output to SRT for most video editors and players, or WebVTT for websites and HTML video. Check the timing against the video before publishing, because automatic transcripts can drift or misread words.'],
    ],
    faq: [
      ['Can it transcribe a video file?', 'Yes. Choose a video and the tool reads its audio track.'],
      ['Can it translate?', 'It can produce English text from other spoken languages if you tick "Translate to English".'],
      ['Does my recording leave my device?', 'No. Whisper runs in your browser. Only the model file is downloaded.'],
    ],
  },
  'ocr-image-to-text': {
    notes: [
      ['What improves accuracy', 'Straight, sharp, well-lit images with dark text on a plain background read best. Crop away borders and shadows, and make sure the page is not rotated. Choosing the correct language matters as much as image quality.'],
      ['What it cannot do', 'Handwriting, decorative fonts and curved or skewed text are often misread. Always proofread the result, especially numbers and codes.'],
    ],
    faq: [
      ['Which languages are supported?', 'There are 16 languages in the list. English is bundled with the site. Other languages download a small data file the first time you use them.'],
      ['Is the image uploaded?', 'No. The text is read on your device with Tesseract running in WebAssembly.'],
      ['Can I save the result?', 'Yes. Copy the text, or download it as a .txt file.'],
    ],
  },
  'image-upscaler': {
    notes: [
      ['Expect smoother, not magic', 'A super-resolution model redraws edges and fine detail at twice the size. It cannot recover detail that was never captured, so a very blurry photo becomes a larger blurry photo with cleaner edges.'],
      ['Why large images are shrunk first', 'The model runs on your own device, so big images would take very long or run out of memory. Images over 384 px on the long side are reduced before upscaling. It works best on small images such as avatars, logos and icons.'],
    ],
    faq: [
      ['How long does it take?', 'Seconds to a minute or more, depending on your device. It is the slowest tool on the site. The first run also downloads the model.'],
      ['Is the image uploaded?', 'No. The model runs in your browser.'],
      ['What size is the result?', 'Exactly twice the width and height of the image it processed, saved as a PNG.'],
    ],
  },
  'pdf-merge': {
    notes: [
      ['Order matters', 'Files are joined in the order shown, so reorder them before you click Merge. Check the page count in the result message to confirm nothing is missing.'],
      ['Files that fail to merge', 'Password-protected or damaged PDFs can fail to merge. Remove the password in the program that created the file, then try again.'],
    ],
    faq: [
      ['Is there a file limit?', 'There is no set limit, but the files are held in your device memory. Very large PDFs may be slow or fail on a phone.'],
      ['Are my PDFs uploaded?', 'No. The merge happens in your browser using the pdf-lib library.'],
      ['Will bookmarks or form fields be kept?', 'Page content is kept. Bookmarks and some interactive form features can be lost, so check the result if you rely on them.'],
    ],
  },
  'image-compressor': {
    notes: [
      ['Which format to choose', 'Use JPG for photos, PNG for graphics, screenshots and anything with transparency, and WebP for the smallest files on websites. Lowering the maximum width often saves more than lowering quality.'],
      ['If your browser cannot save WebP', 'Some browsers cannot encode WebP. In that case the tool saves a PNG and tells you so, rather than giving a PNG a .webp name.'],
    ],
    faq: [
      ['Does compression lower quality?', 'JPG and WebP are lossy, so some detail is lost. A quality of 70 to 85 is usually hard to tell from the original. PNG is lossless.'],
      ['Are my images uploaded?', 'No. They are redrawn in your browser with the Canvas API.'],
      ['Can I compress many images at once?', 'Yes. Choose or drop several images and download each result.'],
    ],
  },
  'blur-faces': {
    notes: [
      ['Check the result before you share', 'The detector can miss faces that are very small, turned sideways or partly covered. Look over the whole image after processing and run it again if a face was missed.'],
      ['Blur is weaker than a black box', 'Blur and pixelation hide a face from a glance but are weaker than covering it. When privacy really matters, use the black box.'],
    ],
    faq: [
      ['Does it detect every face?', 'No. It works best on faces pointing towards the camera. Always check the output.'],
      ['Is the photo uploaded?', 'No. Detection runs in your browser with MediaPipe, and the photo stays on your device.'],
      ['What file do I get?', 'A new PNG drawn from the image pixels. Your original file is not changed.'],
    ],
  },
  'image-to-pdf': {
    notes: [
      ['A4 or fit to image', 'Choose A4 for documents you may print. Choose fit to image to keep each page the same shape as its picture, which suits screenshots and photos.'],
      ['Keeping the PDF small', 'Large phone photos make large PDFs. Run them through the image compressor first, then combine them.'],
    ],
    faq: [
      ['Which image types work?', 'JPG, PNG and WebP.'],
      ['Can I change the page order?', 'Yes. Use the arrows to move images before creating the PDF.'],
      ['Are my images uploaded?', 'No. The PDF is built in your browser.'],
    ],
  },
};
