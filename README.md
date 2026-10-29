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

- **First time:** your three initials, arcade style: tap a letter to pick it, ▲ ▼ to change it, then DONE.
- **Title:** tap ▶ PLAY, or HIGH SCORES. (Swiping up or down does the same, as a shortcut.)
  Tap your initials (top right) to change them.
  There's no quit button: a phone won't let a web game close itself, so you leave it like any app.
- **A game** runs through the six levels in order, from the Front Yard to Christmas Morning. Each
  level gives you 10 fruitcakes and has a **goal** (1,200 points on the first, about five hits
  out of ten, up to 1,800 on the last; `goal` in `js/levels.js`). Make the goal and the next level starts by itself, with the
  score carrying on; miss it and it's GAME OVER. Clear all six to win.
- **Play:** touch the bottom of the screen and flick the fruitcake at an elf. A slow or sideways
  flick does not count and does not use up a cake. The top left shows the score and how close
  you are to the level's goal.
  The pause button (top middle) stops the game, with KEEP PLAYING, QUIT (the game ends and its
  score still counts) and SOUND on or off. Switching to another app pauses it too.
- Hit two elves with one fruitcake for a combo (double points), right in the face for +50.
- **After a game:** the score on a wooden sign, how the game went, then PLAY AGAIN, TRASH TALK (text
  your score with a dare link), HIGH SCORES and MENU.
- **High scores:** this phone's top 10 games, then MOST WANTED, the elves this phone has hit most.
  Scores never leave the phone: to get on its board, you play on it. The blue button flips between them; BACK goes to the title.
- **Dares:** a shared link like `…/?beat=GEN-4250-game` puts "GEN DARES YOU: BEAT 4,250" on the
  title, and the results say who won.

## Releasing

The game is at **https://fruitcake.thefunshed.com**. `thefunshed.com` is the home for all of Gene's fun
projects, games and otherwise, one subdomain each, registered in Route 53 in the same account.

Everything online (Amplify and the domain) lives in the **Entertainment** AWS account, a
member of the Gene Arnold Consulting organization, so it stays separate from Ask Bento and other products.

The game is hosted on Amplify, connected to the GitHub repo: **every push to `main` is a release.**
`amplify.yml` copies the game's files and stamps the release into `sw.js`, `js/version.js` and
`version.json`. Nothing to bump by hand.

Installed phones: the bottom of the title screen shows the version (the release's date and time).
The game asks the site for `version.json` when the title screen opens and whenever the game comes
back to the front; if a newer release is out, an orange **NEW VERSION! TAP TO UPDATE** button
appears, which throws away the stored copy and reloads. Tapping the version checks on demand.

## Scores stay on the phone

There's no online board (Gene, 2026-10-29: the Fun Shed kit's "Scores are phone-only"). The game is
open source, so an online board couldn't be kept free of cheats and rude initials. Each phone keeps
its own top 10 and MOST WANTED; 📣 TRASH TALK is how scores get shared. The only thing the game asks
the internet for is `version.json`, to spot a new release.

## Files

| File | What it does |
|---|---|
| `elves/elves.json` | The cast: id, name, voice number, face pictures |
| `elves/faces/` | Face pictures: the head with its hat, `<id>.png`, `-dazed` and `-splat`, all 256 px squares |
| `img/` | The cartoon art: a background per level (`bg-<level>.jpg`), elf bodies, the fruitcake, the splat, the sleigh, the balloons |
| `sayings/sayings.json` | Lines: `hit`, `miss`, `gentle` (spoken) and `trash` (for texting a score) |
| `sayings/voices/v<n>/` | Recorded lines, one folder per elf voice |
| `js/levels.js` | The levels: a background picture, elf spots, a goal. Add a level here |
| `js/flick.js` | Turns a swipe into a throw (tested by `node tools/test-flick.mjs`) |
| `js/ui.js`, `js/gestures.js`, `js/install.js`, `js/update.js` | The Fun Shed kit's shared files, copied as they are from Turkey Escape (`// Fun Shed kit` marker, now v1.3–v1.4; Fruitcake sets its navy outline with `THEME` in `js/main.js`); the rules are in `~/Workspace/thefunshed/wiki/kit.md` |
| `js/scenery.js` | Fruitcake's own bits of screen: speech bubbles, elf faces, the night sky, falling snow |
| `js/elf.js` | One elf: pops up, walks or flies, gets splatted |
| `js/cast.js` | The elves and sayings, who appears next, which voice clip to play |
| `js/storage.js` | What the phone remembers: initials, its top 10 games, hits |
| `js/update.js`, `js/version.js` | The version on the title screen, the check for a newer release, the update button |
| `js/install.js` | The title screen's install hint: a one-tap install where the browser allows it, otherwise a small "how to install" link to thefunshed.com/install |
| `js/share.js` | Trash talk: the share sheet (or a text message), the score picture, dare links |
| `js/config.js` | Where the game lives (for dare links) |
| `js/textures.js` | The little things drawn in code (crumbs, stars, snow, the plate), and stand-ins for any missing picture |
| `js/audio.js` | Sound effects, the level-start fanfare, the holiday music (public-domain carols played in code: add one to `SONGS`), and the voice clips |
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
  (768 x 1344, from `tools/art-prompts.py levels`). Nudge the spots with `?debug` on.
