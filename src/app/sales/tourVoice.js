// Pre-rendered narration: every sentence the tour says was rendered once with Kokoro-82M (q8, voice af_heart, speed 1),
// silence trimmed, 24 kHz mono MP3 at 40 kbps, into public/tour-voice. The same voice and format as the Meme'd/Solo simulator artifact.
// A sentence finds its clip by a hash of its exact text, so changing a line in tourCases.js needs that line re-rendered.
export const clipId = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) } return (h >>> 0).toString(36) }
export const clipUrl = (text) => (import.meta.env.BASE_URL || '/') + 'tour-voice/' + clipId(text) + '.mp3'
