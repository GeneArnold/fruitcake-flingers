// After a game: the score, how far it got, where it landed on the board, a dare's outcome, and the
// elves splatted. Two buttons: PLAY AGAIN, and TRASH TALK to text the score to someone; a small
// "menu" goes back to the title. The score goes to the family board by itself.
import * as audio from "../audio.js";
import * as cast from "../cast.js";
import * as online from "../online.js";
import * as store from "../storage.js";
import { shareRound, snapshot } from "../share.js";
import { LEVELS } from "../levels.js";
import { inside, listenForGestures } from "../gestures.js";
import { W, face, nightSky, setupCamera, snowfall, text } from "../ui.js";

const PLAY = { x: W / 2 - 160, y: 752, w: 320, h: 72 };
const SHARE = { x: W / 2 - 160, y: 840, w: 320, h: 64 };
const MENU = { x: W / 2 - 80, y: 912, w: 160, h: 44 };

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create({ level, allClear, score, hits, bestCombo, rank, previousTop, challenge }) {
    setupCamera(this);
    nightSky(this);
    snowfall(this, 1);
    this.level = LEVELS[level];
    this.round = { score, hits };
    const me = store.get("player");

    text(this, W / 2, 70, allClear ? "ALL LEVELS CLEAR!" : "GAME OVER", 48, { color: allClear ? "#7CFC9A" : "#ffe066" });
    const reached = allClear ? "beat all " + LEVELS.length + " levels" : `made it to level ${level + 1}: ${this.level.name}`;
    text(this, W / 2, 116, `${me.initials} ${reached}`, 22, { color: "#cfd8ff", strokeThickness: 3 });
    const scoreText = text(this, W / 2, 200, "0", 92, { color: "#ffffff" });
    const countUp = Math.min(1200, 200 + score / 4);
    this.tweens.addCounter({
      from: 0, to: score, duration: countUp, ease: "Cubic.easeOut",
      onUpdate: (t) => scoreText.setText(Math.round(t.getValue()).toLocaleString()),
    });

    // The headline: a dare's outcome first, then a new high score, then the board.
    let headline;
    let colour = "#ffe066";
    let cheer = score > 0;
    if (challenge) {
      const won = score > challenge.score;
      headline = won ? `YOU BEAT ${challenge.initials}!` : `${challenge.initials} STILL RULES (${challenge.score.toLocaleString()})`;
      colour = won ? "#7CFC9A" : "#ff9e9e";
      cheer = won;
      store.set("challenge", null);
    } else if (score > previousTop && score > 0) {
      headline = "NEW HIGH SCORE!";
      colour = "#7CFC9A";
    } else if (rank) {
      headline = `#${rank} ON THIS PHONE`;
    } else {
      headline = `YOUR BEST ${previousTop.toLocaleString()}`;
      cheer = false;
    }
    const head = text(this, W / 2, 282, headline, 36, { color: colour });
    if (colour === "#7CFC9A") this.tweens.add({ targets: head, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    audio.play(cheer ? "cheer" : score > 0 ? "combo" : "groan");

    this.showSplatted(hits, bestCombo);

    const buttons = this.add.graphics();
    buttons.fillStyle(0x2e9e5b);
    buttons.fillRoundedRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h, 36);
    buttons.fillStyle(0xe63946);
    buttons.fillRoundedRect(SHARE.x, SHARE.y, SHARE.w, SHARE.h, 32);
    text(this, W / 2, PLAY.y + PLAY.h / 2, "▶ PLAY AGAIN", 34);
    this.shareText = text(this, W / 2, SHARE.y + SHARE.h / 2, "📣 TRASH TALK", 28);
    text(this, W / 2, MENU.y + MENU.h / 2, "menu", 20, { color: "#cfd8ff", strokeThickness: 3 });
    this.posted = text(this, W / 2, 316, "", 16, { color: "#cfd8ff", strokeThickness: 3 });
    if (online.enabled() && score > 0) this.post();

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => snapshot(this.game).then((png) => (this.picture = png)));

    listenForGestures(this, {
      lockMs: 900,
      onSwipe: (dir) => {
        if (dir === "up") this.playAgain();
      },
      onTap: (x, y) => {
        if (inside(x, y, PLAY)) this.playAgain();
        else if (inside(x, y, SHARE)) this.share();
        else if (inside(x, y, MENU)) this.scene.start("Title");
      },
    });
  }

  playAgain() {
    audio.play("whoosh");
    this.scene.start("Play", { level: 0 });
  }

  showSplatted(hits, bestCombo) {
    const list = Object.entries(hits)
      .map(([id, n]) => ({ e: cast.elf(id), n }))
      .filter((h) => h.e)
      .sort((a, b) => b.n - a.n);
    this.mostHit = list[0];
    if (list.length === 0) {
      text(this, W / 2, 500, "You hit nobody!\nThe fruitcakes survived.", 30);
      return;
    }
    text(this, W / 2, 344, "YOU SPLATTED", 24);
    const cols = 5;
    const cell = W / cols;
    list.slice(0, 10).forEach(({ e, n }, i) => {
      const cx = cell * ((i % cols) + 0.5);
      const cy = 420 + Math.floor(i / cols) * 140;
      face(this, cx, cy, cast.faceKey(this, e, "dazed"), 88);
      text(this, cx, cy + 56, e.name, 13, { strokeThickness: 3, wrap: cell - 4 });
      text(this, cx + 30, cy + 30, `×${n}`, 22, { color: "#ffe066" });
    });
    if (bestCombo > 1) text(this, W / 2, 724, "Two in one throw: COMBO!", 22, { color: "#7CFC9A", strokeThickness: 4 });
  }

  // Sends the score to the family board; with no signal it waits on the phone for next time.
  async post() {
    const { score, hits } = this.round;
    await online.postRound(store.GAME_BOARD, score, hits);
    if (!this.scene.isActive()) return;
    const waiting = store.get("outbox").length > 0;
    this.posted.setText(waiting ? "no signal: it'll go on the family board next time" : "on the family board ✓");
  }

  async share() {
    audio.play("pop");
    const { score } = this.round;
    const outcome = await shareRound({
      score, levelName: this.level.name,
      elfName: this.mostHit?.e.name, elfHits: this.mostHit?.n, picture: this.picture || null,
    });
    if (outcome !== "cancelled") this.shareText.setText("📣 SENT! AGAIN?");
  }
}
