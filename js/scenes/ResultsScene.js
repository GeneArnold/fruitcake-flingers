// After a game: the score, how far it got, where it landed on the board, a dare's outcome, and the
// elves splatted. Swipe up to play again, down for the high scores, right for the menu; swipe left or tap
// TRASH TALK to text the score to someone. With the family board online, the first swipe up
// posts the score there instead (swipe down skips).
import * as audio from "../audio.js";
import * as cast from "../cast.js";
import * as online from "../online.js";
import * as store from "../storage.js";
import { shareRound, snapshot } from "../share.js";
import { LEVELS } from "../levels.js";
import { listenForGestures } from "../gestures.js";
import { W, face, nightSky, setupCamera, snowfall, text } from "../ui.js";

const SHARE = { x: W / 2 - 130, y: 770, w: 260, h: 64 };

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

    const pill = this.add.graphics();
    pill.fillStyle(0xe63946);
    pill.fillRoundedRect(SHARE.x, SHARE.y, SHARE.w, SHARE.h, 32);
    this.shareText = text(this, W / 2, SHARE.y + SHARE.h / 2, "📣 TRASH TALK", 28);
    this.hintBig = text(this, W / 2, 870, "", 30, { color: "#ffe066" });
    this.hintSmall = text(this, W / 2, 914, "", 17, { color: "#cfd8ff", strokeThickness: 3 });
    this.asking = online.enabled() && score > 0; // offer to post to the family board first
    this.showHints();

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => {
      this.hintBig.setVisible(false);
      this.hintSmall.setVisible(false);
      snapshot(this.game).then((png) => {
        this.picture = png;
        this.hintBig.setVisible(true);
        this.hintSmall.setVisible(true);
      });
    });

    listenForGestures(this, {
      lockMs: 900,
      onSwipe: (dir) => {
        if (this.asking) {
          if (dir === "up") this.post();
          else if (dir === "down") this.skipPost();
          return;
        }
        if (dir === "up") this.scene.start("Play", { level: 0 });
        else if (dir === "down") this.scene.start("Board");
        else if (dir === "left") this.share();
        else this.scene.start("Title");
      },
      onTap: (x, y) => {
        if (x > SHARE.x && x < SHARE.x + SHARE.w && y > SHARE.y && y < SHARE.y + SHARE.h) this.share();
      },
    });
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

  showHints() {
    if (this.asking) {
      this.hintBig.setText("SWIPE UP: POST TO THE FAMILY BOARD").setFontSize(24);
      this.hintSmall.setText("swipe down to skip");
    } else {
      this.hintBig.setText("SWIPE UP TO PLAY AGAIN").setFontSize(30);
      this.hintSmall.setText("↓ high scores   ← trash talk   → menu");
    }
  }

  async post() {
    this.asking = false;
    this.hintBig.setText("Posting...");
    const { score, hits } = this.round;
    await online.postRound(store.GAME_BOARD, score, hits);
    const waiting = store.get("outbox").length > 0;
    audio.play(waiting ? "pop" : "cheer");
    this.showHints();
    this.hintSmall.setText(waiting ? "no signal: it'll post next time you play" : "posted to the family board!");
    this.time.delayedCall(2200, () => this.scene.isActive() && this.showHints());
  }

  skipPost() {
    this.asking = false;
    this.showHints();
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
