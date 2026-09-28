# AI video, music and film — separate from the artwork

Moved here from `CLAUDE.md` on 2026-09-28 at the user's request, so that `CLAUDE.md` is about the artwork alone.
Nothing below is part of the universe and no rig reads it. The text is as the video sessions wrote it.

**COST FIRST (the user's own Modal account).** One session of episodes 1-12 spent about $60, mostly on the 14B model
(H200s, minutes per clip), 2-3 takes per risky shot, and parallel containers each reloading the weights. So: default to
the 5B model and ONE take; no `"model": "14b"` and no takes sheets unless the user OKs it; give a rough cost estimate
and wait for a yes before any generation run; prefer re-cutting cached clips (free, local) over regenerating.
Measured on the user's Modal bill: Wan14 $60.76 for ~12 clips (about $5 a clip, two episodes); Wan 5B $28.25 for
~110 clips (about $0.25); WanI2V $3.23 for 13 (about $0.25); music, voice, mixing, glitch, transcription pennies. A
five-scene 5B episode is about $1.25-1.50. Treat 14B as off. Never re-render a take that is no longer needed.
Every clip, the user's input images and all finished MP4s are backed up in the volume under `library/` (clips,
inputs, finals); `::story` fetches missing clips from `library/clips` itself, so a new session can re-cut any
episode without regenerating. After making new clips, `modal volume put ai-video-cache out/clips library/clips`.

`video/make_video.py` makes AI-generated videos on Modal (Wan 2.2 TI2V-5B, open weights). It is a
side tool for the user, not part of the universe, and no rig reads it. The user is non-technical and
works from a phone: you run it, then send them the MP4. Needs `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET`
in the environment. Default is a 20-second portrait video (four ~5 s clips joined):

```
pip install -q 'modal[api-proxy-support]' imageio-ffmpeg
modal run video/make_video.py::main --prompt "..." --seconds 20 --out video.mp4
modal run video/make_video.py::story --file video/stories/alignment.json --out story.mp4
```

`::story` is the one to reach for: a JSON storyboard (one scene per ~5 s clip, each with a narration
line; the `character` text is pasted into every prompt so the lead looks alike across cuts), a
Kokoro narrator, MusicGen score ducked under the voice, and burned-in subtitles. Plain `::main` has
no sound. Outputs go in `out/`, which is gitignored. Per scene: `voice`, `speed`, `lead` (pause after
the cut) and `whisper` (a hushed effect; Kokoro cannot really whisper). Leave out `music` for a
voice-only track: the user scores in their own editor. Clips are cached in `out/clips/` by prompt and
seed, so changing one scene regenerates only that scene. The user liked scene 2's smiley masks,
`bf_emma` over `bm_george`, and the whispered last line.
A scene may give `top` and `bottom` instead of `prompt` (two landscape clips stacked in one portrait
frame), leave out `say` (no narration), and set `fade` (seconds in, to black); `tail` adds black at
the end and `cast` names more `{placeholders}` beside `{character}`. `two-paths.json` is the sequel:
the user's theme is that alignment is two-way — humans must align too, or the AI copies our masks.
Running motifs: the yellow smiley masks, and the whispered last line "We only get to teach it once."
Since episode 3 (`no-one-watching.json`) the user scores with their own AI-alignment music and wants
NO voices: set `"voice": null` and each `say` is only written on screen (the last line, centred,
italic, over black). Silent track in the MP4. The user asked Claude to choose each episode's subject.
Episode 3 is the user's favourite so far, the first where Claude chose the subject from its own view.
What worked: a real alignment problem told with no words, and letting Wan's surprise stand (the smile
turning sinister beat the planned mask-removal). Show frames, name what missed, offer per-clip redos.
Wan animates things going ON better than coming OFF, and draws peeled faces as plastic. Fixes in the tool:
`reverse`, `trim` (cut a give-away opening), `glitch` bursts, and `reveal`+`swap_at` (a matching second
shot glitches in and stays). The user liked a glitch as a 'tell' that someone is AI; a mirror whose
reflection is the robot beat a face peel, and the user then preferred no face at all: implied from behind
(episode 6, `just-like-us.json`): an ordinary back view where only the MIRROR glitches (`glitch_region`,
fractions of the frame, read off a probe frame). Wan also gives walking people an odd gait; stand them still.
Continuity across clips (episode 7, `a-lifetime.json`): Wan redraws the robot's SIZE per clip and floats it; say
"knee-high ... on the floor" and, where a person is close, "its head only reaching her knee". One fixed place (the same
window seat, seasons changing outside) plus one recurring object made a life journey read where separate rooms did not.
Per scene `"model": "14b"` uses the bigger Wan 2.2 T2V-A14B (H200, 16 fps, several times slower) for hero shots;
`"grade": true` puts one colour grade and film grain over everything so mixed models read as one film.
A Bash call here is cut at 10 minutes, and nine 14B clips take longer: run `modal run --detach ...` and re-run it;
each clip is kept in the volume (`/cache/clips`) as it finishes and fetched on the next run. Per-scene `seed` picks a
take; `"fade_in": false` starts on the first frame (hooks). `wider-takes.json` is a takes sheet for `wider`.
To fit a finished song (the user's own track), `video/fit_to_song.py <edl.json> <out.mp4>` cuts existing clips to it
locally, no GPU: each segment is retimed to fill its slot, glitches sit in song time, end line on black in silence.
Time the words first (faster-whisper large-v3 on Modal, word timestamps); it hallucinates in long silences, so trust
only words inside the audible sections. A before/after pair can be two full segments rather than one swap, which
stretches an edit to a sung line. The user's audio is not committed.
A scene with `"image"` (a 704x1280 still) is animated from that picture (image-to-video, the 5B model): the user's
own art keeps its character and style, which beats any prompt for consistency. Crop to 9:16 first; the user's images
live in `out/inputs/` and are not committed (episode 12, `its-okay.json`). Wan I2V adds things well (balloons, a mask
held up) but not a second character reliably (the robot came out with a smiley for a face in one take).
`video/remix.py <cut.json> <out.mp4>` re-forges existing clips into a new-looking film, locally and free: timed
`single`/`grid`/`black` segments, mirror symmetry (`h`, `quad`), the `iron` look (steel greyscale with yellow held by
`colorhold`), trails, a zoom pulse on the measured beat, negative flashes. `iron-ballroom.json` is the first (the
user's instrumental; beat grid measured from onsets, 135 BPM). `out/lib/sheet.png` is a numbered contact sheet of
every clip for casting; `out/lib/index.txt` maps the numbers to clip files.
`bitter-pill.json` remixes the remix: Iron Ballroom's shots (`from` = its segment index) re-cut to a second track,
~60 s from two choruses spliced on bar lines (`song_parts`, `song_fade`), one shot per bar, lyrics timed free with a
local faster-whisper `small` on CPU (no Modal), an oxblood `look`, `stutter` (loop a slice) and `fade_to_iron`
(colour drains on a lyric). The user found Iron Ballroom "a bit busy": hold shots a bar or more, grids sparingly.
`flesh-and-wire.json` (full length, third track) draws on the whole library AND both earlier remix films (`src` + `in`).
Per-shot `look`: `wire` (edges traced as glowing gold line on black), `outline` (flesh with its wiring showing), `hot`,
`iron`, `oxblood`, `full`; `fuse` blends a second shot in (`screen` = double exposure, `difference` = sinister); `flip`
swaps flesh and wire on every beat; a 2x2 grid with `looks` shows one shot in every generation at once. Split outputs
share one pixel format in ffmpeg, so each look branch starts `format=gbrp` (a gray branch turned the other grey).
`piano-in-the-throes.json` (fourth, full length) adds `keys` (the frame cut into n vertical piano keys, each its own
clip, time offset or look; `off` is an unlit key) and `stretch` (the user asked to "stretch out just parts of the
screen": one row or column dragged across a chosen part of the frame, `down`/`right`, moving over a time window).
Instrumental tracks: find section starts from 0.1 s loudness, not only the onset tempo (it read 80 BPM for a 120 one).
`the-duet.json` (same track, second mix): `bounce` makes the picture move to the track's own onsets (zoom, drop, shake
on the biggest hits, harder in loud passages; the user asked for the bounce back). It is written as per-frame sendcmd
commands to a fixed-size scale+crop: a crop that changed size per frame segfaulted ffmpeg. Also `fuse` modes `rows`,
`keys`, `checker` (pixel-aligned crossovers, sliding), `spin`, and the `ivory` and `pixel` looks.
`video/drawn/` is hand-drawn animation in code (PIL, every frame drawn, 'on twos' with boiling lines): free, exact
and consistent, for what the video model draws badly (a clean mask peel). The user sees it as a new layer on top of
the rest: AI clips + their own art + remix + drawn animation.
`video/drawn/stills.py` animates the user's stills (slow move, rembg parallax) and draws on them: `ink` smiley masks
placed in image coordinates (inked on over `draw`, peeled off over `peel`), `cracks` (broken glass, screen fixed),
and `tunnel` (the user's viewfinder-bracket art made endless). `build_bitter_pill_full.py` is the pattern: draw the
shots into `out/drawn/<film>/`, then cut them with remix.py via `src`. Place a mask by gridding the image first (the
singer's tilted face was 240 px off on the first guess). The user's new stills are in `out/inputs/` and `library/inputs`.
The user's own videos (made elsewhere) are in `out/user-clips/u01..u48.mp4` (catalogue: `video/user-clips.json`, what
each shows and tags: `free`, `abstract`, `own-art` = their universe, `real-face`/`real-context` = keep out or mask) and `library/user-clips` (`index.txt` maps
them to the upload names, `sheet.png` shows a frame of each); remix.py uses them via `src`. Several show recognisable
real people (politicians, public figures) in made-up scenes: Claude recommended keeping those out of the alignment
films and asked the user first; the abstract ones (particle fields, their own universe's field, the network) are free.
Songs: `out/songs/*.mp3` and `library/songs` (12 of the user's tracks); `video/songs.json` catalogues tempo, sections and
timed lyrics (`video/song_scan.py`; Whisper invents Russian subtitle credits on instrumentals, e.g. Cathedral of the
Storm), `video/keyfind.py` estimates keys. The user gave Claude full creative freedom and suggested remixing the music
too: `video/mashup.py` builds a new track from Demucs stems (`out/stems/`, CPU torch + demucs installed locally, free),
bar by bar on one grid with rubberband stretch/pitch, vocals anchored to their downbeats, and writes each sung line's
time in the new track. Find downbeats from the DRUM stem (the bar-offset with the strongest kicks, checked against
where phrases start), and trim phrases at WORD edges (re-run Whisper with word timestamps on the vocal stem).
`the-duet-track.json` + `the-duet-film.json` is the first: two songs as an AI/human duet, the end line shown as sung.
**The user judged The Duet "not very good": the songs did not blend (two finished songs with different chords fight
even in one key and tempo) and the film "tried to do everything at once".** Their direction: tell ONE coherent story
from their own videos, and make a NEW track inspired by their songs rather than stitching them. `first-light.json` is
that: one protagonist (a mind born, learning, taking a body, flying), straight cuts on the bar, one drawn element (the
spark, `video/drawn/spark.py`), and an original score composed in code (`video/compose.py`: numpy synth voices +
pedalboard, arranged to the story's acts). Claude cannot hear the audio it makes: it checks levels and a spectrogram,
and the user's ears are the judge. Two remix.py bugs found here: non-9:16 sources were SQUASHED (now cover-cropped),
and a `src` shorter than its slot made the film DRIFT off the music (now looped and padded to exact length).
The user on First Light: liked the score, but "is this your best effort?": it reused the same clips as the film before,
and some clips have people TALKING (silent moving mouths look wrong under music). So every clip was audited frame by
frame (8 frames across each): `video/user-clips.json` now carries `talks`, `note` (scene cuts inside a clip), `best`
(usable window) and `used_in` (which films used it). Check talks/used_in before casting; watch clips, not one frame.
`the-cage-doesnt-lock.json` follows ONE protagonist (the library's small white one-eyed robot, consistent across
dozens of clips), each shot on its sung line (word times from the Demucs vocal stem, snapped to the 128 BPM grid).

The `[api-proxy-support]` extra matters: behind the session's HTTPS proxy, plain `modal` fails with only "Could not connect to the Modal server"; the real cause (missing `python-socks`) is hidden in the exception's `__cause__`. The first run downloads
~20 GB of weights into the `ai-video-cache` volume. The clips are generated separately, so each
cut is a hard change of scene.
