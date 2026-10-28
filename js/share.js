// Trash talk: share a round by text, with a picture of the results and a challenge link.
// A challenge link opens the game with "GEN DARES YOU: BEAT 4,250" on the title screen.
import * as cast from "./cast.js";
import * as store from "./storage.js";
import { CONFIG } from "./config.js";

// ?beat=GEN-4250-game  (initials, score, board; older links name a level, which no longer matters)
// Testing on a computer or the home network (plain http) keeps links pointing at that copy.
export function challengeLink(initials, score, board) {
  const home = location.protocol === "https:" && CONFIG.homeUrl ? CONFIG.homeUrl : location.origin + location.pathname;
  return `${home}?beat=${initials}-${score}-${board}`;
}

// Reads a challenge from the address, keeps it until it is played, and tidies the address.
export function readChallenge() {
  const params = new URLSearchParams(location.search);
  const beat = params.get("beat");
  if (!beat) return;
  const m = /^([A-Z]{1,3})-(\d{1,7})-([a-z0-9-]+)$/.exec(beat);
  if (m) store.set("challenge", { initials: m[1], score: Number(m[2]) });
  params.delete("beat");
  const rest = params.toString();
  history.replaceState(history.state, "", location.pathname + (rest ? `?${rest}` : ""));
}

// "{elf}", "{score}" and "{level}" in a trash-talk line are filled in.
function trashTalk(round) {
  return cast
    .randomSaying("trash")
    .text.replaceAll("{elf}", round.elfName || "an elf")
    .replaceAll("{score}", round.score.toLocaleString())
    .replaceAll("{level}", round.levelName);
}

// round: { score, levelName (the level the game got to), elfName, elfHits, picture (a PNG Blob or null) }
// → "shared", "texted" (fell back to a text message), or "cancelled"
export async function shareRound(round) {
  const me = store.get("player");
  const lines = [trashTalk(round), `${me.initials} flung ${round.score.toLocaleString()} and made it to ${round.levelName}.`];
  if (round.elfName && round.elfHits) lines.push(`${round.elfName} got splatted ${round.elfHits}×.`);
  const url = challengeLink(me.initials, round.score, store.GAME_BOARD);
  const text = `${lines.join(" ")}\nBeat that 👉`;

  if (navigator.share) {
    const file = round.picture && new File([round.picture], "fruitcake-flingers.png", { type: "image/png" });
    const withPicture = { text: `${text} ${url}`, files: [file] };
    try {
      if (file && navigator.canShare?.(withPicture)) await navigator.share(withPicture);
      else await navigator.share({ text, url });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled";
    }
  }
  // No share sheet (plain http, or an old browser): open a text message instead.
  location.href = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;
  return "texted";
}

// A PNG of what is on screen right now, for the share picture.
export function snapshot(game) {
  return new Promise((resolve) => {
    game.renderer.snapshot((img) => {
      try {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        c.toBlob((blob) => resolve(blob), "image/png");
      } catch {
        resolve(null);
      }
    });
  });
}
