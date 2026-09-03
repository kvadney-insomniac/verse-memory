# Verse Mastery, AssemblyAI Voice Agent Challenge: state of play

Written 2026-09-03. Everything below is verified unless it says otherwise.

## Live

**https://verse-mastery.verse-mastery.workers.dev**

Cloudflare Workers free tier, Kentaro's own account (`kentarovadney@berkeley.edu`,
account `12278462f7fbd1f84fcd356483424960`). Worker name is `verse-mastery`,
deliberately not `verse-memory`, which is the church's app upstream.

Branch is `public-kjv`, committed but **not pushed**, in three commits:

```
HEAD     Give the app a real voice, and stop asking a stranger for their gender
5dcc2e7  Add AssemblyAI as a third transcription provider
82fad9f  Replace every em-dash, and guard against the next one
```

Node 22 is required for wrangler and is not the default on this machine:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
```

Build and deploy:

```bash
ALLOW_LOCAL_ONLY_BUILD=1 npm run build && npx wrangler deploy
```

`ALLOW_LOCAL_ONLY_BUILD=1` is required and deliberate: the public edition sets
`window.__FIREBASE_CONFIG__ = null`, and `scripts/build.mjs` refuses that
configuration unless it is stated on purpose. Without it a judge would meet a
Google sign-in gate restricted to church domains.

## The one thing blocking the submission

**The AssemblyAI key is set as a Worker secret and returns 401.**

`wrangler secret put ASSEMBLYAI_API_KEY` succeeded (secret id
`430b0f795fbd4865ac882f536fa706bd`). Flipping the provider gives:

```
POST /api/transcribe  ->  502   worker log: "transcribe assemblyai: upload 401"
```

That is the **first** authenticated call, `POST https://api.assemblyai.com/v2/upload`,
before any transcription parameter is involved. So this is the auth boundary and
not the request shape. AssemblyAI's own error table gives three causes for a 401:

1. **Insufficient balance or no payment method on the account.** Most likely on
   a new account, and the one to check first.
2. **Wrong region.** An EU account must use `api.eu.assemblyai.com`. The code
   uses the US host. If the account is EU, change `ASSEMBLYAI_UPLOAD_URL` and
   `ASSEMBLYAI_TRANSCRIPT_URL` in `worker/transcribe.js`.
3. **A malformed key**, for instance a stray character pasted with it. Re-run
   `wrangler secret put` to rule this out.

The header format is already correct: a bare `authorization` whose whole value
is the key, no `Bearer`. That is checked against the current docs.

Once the 401 is resolved:

```bash
npx wrangler deploy --var TRANSCRIBE_PROVIDER:assemblyai
curl -s --max-time 120 -X POST -H "Content-Type: audio/wav" \
  --data-binary @sample.wav \
  https://verse-mastery.verse-mastery.workers.dev/api/transcribe
```

A transcript coming back is the pass condition for the whole submission.
**Nothing goes to lablab before that.** Until then the live URL transcribes
through Workers AI (Whisper), which works and is verified, but is not what the
challenge is judging.

Do not generate the test WAV with `say`. See "Never make sound on this machine"
below.

## What is verified working

- `/api/transcribe` returns `{"text":"the Lord is my shepherd, I shall not want,
he maketh me to lie down in green pastures."}` for a real WAV, via Workers AI.
- `/api/speak` returns real MP3 from `@cf/deepgram/aura-2-en`, 24 kHz mono.
- 405 on GET, 415 on a non-audio content type, 400 on an empty speak body.
- 1,040 unit tests, 102 browser tests, lint, format and the prose guard all pass.

## What is NOT verified

- **The AssemblyAI provider has never successfully run.** See above.
- **How the new voice sounds inside a live Speak session.** The route returns
  valid audio and the fallback path is byte-for-byte the old one, and all 34
  pre-existing speaker tests pass, but no one has run a hands-free session end
  to end. The thing to watch for is a line finishing and the microphone not
  reopening; that would be the `onDone` path in `src/tts.js`.
- Which of the four sampled voices is wanted. Samples were sent for
  `asteria`, `athena`, `orion`, `zeus`. The default is `asteria`
  (`SPEAK_VOICE_DEFAULT` in `worker/transcribe.js`); override per deploy with
  `--var SPEAK_VOICE:<name>`, or set `SPEAK_VOICE` in `wrangler.jsonc`.
  There are 39 voices; `@cf/deepgram/aura-2-en` on Workers AI.

## Never make sound on this machine

On 2026-09-02 something started reading text aloud on Kentaro's machine during
this work and he had to shut Claude down to stop it. **The cause was never
identified.** `say` was not running, the browser tab reported
`speechSynthesis` idle, and the tab was closed, yet it continued.

So, regardless of cause: no `say`, no `afplay`, no TTS, and never drive the app
into Speak mode or Run mode in a browser. `playwright.config.mjs` now launches
with `--mute-audio`. To test audio, synthesize a WAV in code or ask him for one.
Verify shipped behaviour by curling the deployed source, not by clicking through
a talking app.

## What changed

`82fad9f`, **the em-dash sweep and the prose guard**, 152 files. 2,151
occurrences replaced, three kept as codepoints or an en-dash because they are
functional rather than prose. `scripts/check-prose.mjs` is wired in as
`npm run lint:prose` and as a CI step so it cannot come back. The generic
`ministryGroups` default rides along, since it is the same kind of change.

`5dcc2e7`, **the AssemblyAI provider**, 3 files. The current API:
`speech_models: ["universal-3-5-pro", "universal-2"]` and `keyterms_prompt`,
replacing the legacy `word_boost` / `boost_param`. `prompt` is deliberately
never set: vocabulary biasing is permitted, sequence biasing is a validity bug
in a scoring app.

**The voice, the profile and the queue** (HEAD), 19 files. `src/tts.js` and
`test/tts.test.mjs` are new; `src/speaker.js`, `src/beat.js`, `src/config.js`,
`src/App.js`, `src/profile.js`, `src/viewmodel/speak.js` and
`playwright.config.mjs` change.

Each commit passes lint, format, the prose guard, 1,040 unit tests and 102
browser tests on its own.

## Submission assets

In `submission/`: `SUBMISSION.md` (the long description),
`verse-mastery-cover.png` (1920x1080), `deck.html` and `verse-mastery-deck.pdf`
(9 slides). Slide 9 is a marked placeholder for a demo screenshot and is the
only one that needs the deploy.

Judging is four criteria: Application of Technology, Presentation, Business
Value, Originality. The deck is mapped to them explicitly.

## Standing rules that bit during this work

- **No em-dashes anywhere**, including code comments. Enforced now by
  `npm run lint:prose`.
- **Never sign work as Claude.** No trailers, no bylines.
- **Never merge to prod.** Stop at the PR.
- Claude cannot create accounts or handle API keys. The AssemblyAI key and the
  Cloudflare login are Kentaro's to do.
