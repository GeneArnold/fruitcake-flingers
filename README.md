# Fruitcake Flingers

A phone game for the family: elves pop up around a level and you flick a fruitcake at them.
Plain HTML and JavaScript with [Phaser 3.90](https://phaser.io) saved in `vendor/`. There is no
build step, it installs on phones as an app, and it plays offline.

The design doc: https://claude.ai/artifact/NgsJZ2k9yr79xoKTZctyNy

## Run it on a computer

```
python3 tools/serve.py
```

Open http://127.0.0.1:8791 (or this computer's address from a phone on the home network) and drag with the mouse to flick. Add `?debug` to the address to outline
every elf spot and don't-hit item, which helps when lining spots up with new art.
On localhost the offline cache is switched off, so edits show up on a plain reload.

## How to play

- **First time:** swipe in your three initials, arcade style (↑ ↓ change a letter, → next).
- **Title:** swipe up to play, sideways to change level, down for the high scores.
  Tap your initials (top right) to change them.
  QUIT (top left) closes the installed game on Android; on an iPhone it says to swipe it away,
  and in a browser tab it goes to thefunshed.com.
- **Play:** touch the bottom of the screen and flick the fruitcake at an elf. A slow or sideways
  flick does not count and does not use up a cake. A round is 10 fruitcakes.
  The pause button (top middle) stops the round, with KEEP PLAYING or QUIT; quitting doesn't
  count the round. Switching to another app pauses it too.
- Hit two elves with one fruitcake for a combo (double points), right in the face for +50.
  Don't land a short throw on Grandma's good china.
- **After a round:** swipe up to go again, down for the high scores, left (or tap TRASH TALK) to
  text your score with a dare link, right for the menu.
- **High scores:** a top 10 per level, then MOST WANTED, the elves hit most. Swipe sideways.
- **Dares:** a shared link like `…/?beat=GEN-4250-mall` opens that level with
  "GEN DARES YOU: BEAT 4,250", and the results say who won.

## Releasing

The game is at **https://fruitcake.thefunshed.com**. `thefunshed.com` is the home for all of Gene's fun
projects, games and otherwise, one subdomain each, registered in Route 53 in the same account.

Everything online (Amplify and the score service) lives in the **Entertainment** AWS account, a
member of the Gene Arnold Consulting organization, so it stays separate from Ask Bento and other products.

The game is hosted on Amplify, connected to the GitHub repo: **every push to `main` is a release.**
`amplify.yml` copies the game's files and stamps the release into `sw.js`, `js/version.js` and
`version.json`. Nothing to bump by hand.

Installed phones: the bottom of the title screen shows the version (the release's date and time).
The game asks the site for `version.json` when the title screen opens and whenever the game comes
back to the front; if a newer release is out, an orange **NEW VERSION! TAP TO UPDATE** button
appears, which throws away the stored copy and reloads. Tapping the version checks on demand.

## The family score board

The online high scores and the everyone-wide MOST WANTED count live in the **Shed service** at
`https://api.thefunshed.com`, shared by every Fun Shed app. Its code is in the private `shed` repo
(GitHub: GeneArnold/shed). This game is the `fruitcake` app there, and its address is `scoresUrl` in
`js/config.js`; set it to `null` to keep every board on the phone.

- A round posts its score and its elf hits in one request (`POST /v1/fruitcake/scores`).
- Rounds played with no signal wait on the phone and post the next time the game opens.

## Files

| File | What it does |
|---|---|
| `elves/elves.json` | The cast: id, name, voice number, face pictures |
| `elves/faces/` | Face pictures: the head with its hat, `<id>.png`, `-dazed` and `-splat`, all 256 px squares |
| `img/` | The cartoon art: a background per level (`bg-<level>.jpg`), the don't-hit props (`prop-*.png`), elf bodies, the fruitcake, the splat, the sleigh, the balloons |
| `sayings/sayings.json` | Lines: `hit`, `miss`, `gentle` (spoken) and `trash` (for texting a score) |
| `sayings/voices/v<n>/` | Recorded lines, one folder per elf voice |
| `js/levels.js` | The levels: a background picture, elf spots, don't-hit props. Add a level here |
| `js/flick.js` | Turns a swipe into a throw (tested by `node tools/test-flick.mjs`) |
| `js/elf.js` | One elf: pops up, walks or flies, gets splatted |
| `js/cast.js` | The elves and sayings, who appears next, which voice clip to play |
| `js/storage.js` | What the phone remembers: initials, its top 10 per level, hits, unsent rounds |
| `js/online.js` | Talks to the Shed service; queues rounds while offline |
| `js/update.js`, `js/version.js` | The version on the title screen, the check for a newer release, the update button |
| `js/install.js` | The title screen's "install me" hint, for phones playing in a browser tab |
| `js/share.js` | Trash talk: the share sheet (or a text message), the score picture, dare links |
| `js/config.js` | Where the game lives (for dare links) and the Shed service's address |
| `js/textures.js` | The little things drawn in code (crumbs, stars, snow, the plate), and stand-ins for any missing picture |
| `js/audio.js` | Placeholder sound effects, and the voice clips |
| `js/scenes/` | Boot, Name (initials), Title, Play, Results, Board (high scores) |
| `sw.js`, `manifest.webmanifest` | Offline play and installing as an app |
| `amplify.yml` | How Amplify publishes a push |
| `tools/` | Makes the art, the voices and the icons; serves the game for testing; the flick test |

## Changing things

- **The art** is cartoon pictures made on cerebro's SwarmUI (Z-Image Turbo), the same way as Feed the
  Chickens and Lights Out. Every prompt is in `tools/art-prompts.py`:
  `python3 tools/art-prompts.py elves|things|levels [names] [--n 3]` saves the tries to
  `art/source/gen/` (git ignores `art/source/`), and `python3 tools/contact.py <prefix> --out x.png`
  lays them side by side for choosing.
  - An elf is one "expression sheet": three heads, normal, dazed and splatted.
    `python3 tools/faces.py art/source/gen/elf-<id>-<n>.png <id>` cuts the chosen one into
    `elves/faces/`.
  - Everything else is cut out with `python3 tools/cutout.py <picture> <names…>`, which saves
    `img/<name>.png`.
  - The icons come from `python3 tools/make-icons.py <big cut-out fruitcake>`.
  - New pictures in `img/` also go in the `FILES` list in `sw.js`, so they work offline.
- **An elf:** add an entry to `elves/elves.json` with its face pictures and `outfit`: 0 green,
  1 red, 2 teal or 3 purple, matching the hat. Add its look to `ELVES` in `tools/art-prompts.py` to
  draw it.
- **A saying:** add it to `sayings/sayings.json` with a short `id`, then
  `node tools/make-voices.mjs` records just the new lines. The voices, and how squeaky each one is,
  are set at the top of that script; Chatterbox runs on cerebro (http://192.168.40.110:8004).
  `--force` re-records everything.
- **A level:** add an entry to `LEVELS` in `js/levels.js` and its background, `img/bg-<id>.jpg`
  (768 x 1344, from `tools/art-prompts.py levels`). Nudge the spots and props with `?debug` on.
