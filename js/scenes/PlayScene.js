// A round: ten fruitcakes flicked at elves popping up around the level.
import * as audio from "../audio.js";
import * as cast from "../cast.js";
import * as store from "../storage.js";
import { Elf } from "../elf.js";
import { aimAssist, readFlick } from "../flick.js";
import { LEVELS, paintLevel } from "../levels.js";
import { H, W, bubble, fingerAt, floatText, setupCamera, snowfall, text } from "../ui.js";

const CAKES = 10;
const PLATE = { x: W / 2, y: 862 };
const ZONE_TOP = 700;     // a flick starts anywhere below this line
const THROW_LINE = 610;   // a finger dragged above this line throws straight away
const CAKE_R = 30;        // the fruitcake's size for hitting things, before it shrinks with distance
const FACE_BONUS = 50;

// Within a round the game gets harder in three steps.
function phaseFor(cake) {
  if (cake < 3) return { kinds: ["pop"], maxUp: 2, stay: 3.2, wind: 0, assist: 10 };
  if (cake < 7) return { kinds: ["pop"], maxUp: 3, stay: 2.4, wind: 110, assist: 7 };
  return { kinds: ["pop", "walk", "fly"], maxUp: 3, stay: 1.9, wind: 170, assist: 5 };
}

export class PlayScene extends Phaser.Scene {
  constructor() {
    super("Play");
  }

  create(data) {
    setupCamera(this);
    this.levelIndex = data.level ?? 0;
    this.level = LEVELS[this.levelIndex];
    const challenge = store.get("challenge");
    this.challenge = challenge?.level === this.level.id ? challenge : null;
    paintLevel(this, this.level);
    this.snow = this.level.snow === false ? null : snowfall(this, 25);

    this.elves = [];
    this.score = 0;
    this.cake = 0;
    this.hits = {};
    this.bestCombo = 0;
    this.spawnIn = 0.8;
    this.flight = null;
    this.ready = false;
    this.finished = false;
    this.pointerId = null;
    this.path = [];

    this.makeHud();
    this.trail = this.add.graphics().setDepth(60);
    this.add.image(PLATE.x, PLATE.y + 34, "plate").setDepth(40);
    this.cakeImg = this.add.image(PLATE.x, H + 80, "fruitcake").setDepth(45);
    this.hint = text(this, W / 2, 938, "flick the fruitcake at a face", 22, { strokeThickness: 4 }).setDepth(70);
    this.listen();
    this.drawDebug();
    this.newCake();
  }

  // ---------------------------------------------------------------------------------------------
  // Screen

  makeHud() {
    const band = this.add.graphics().setDepth(69);
    band.fillStyle(0x000000, 0.35);
    band.fillRect(0, 0, W, 92);
    this.scoreText = text(this, 20, 32, "0", 36, { originX: 0, color: "#ffe066" }).setDepth(70);
    this.levelText = text(this, 20, 70, this.level.name, 18, { originX: 0, color: "#ffffff", strokeThickness: 3 }).setDepth(70);
    this.cakeText = text(this, W - 20, 32, "", 26, { originX: 1 }).setDepth(70);
    this.windText = text(this, W - 20, 70, "", 18, { originX: 1, color: "#bfe3ff", strokeThickness: 3 }).setDepth(70);
    if (this.challenge) {
      const c = this.challenge;
      this.levelText.setText(`BEAT ${c.initials}'S ${c.score.toLocaleString()}`).setColor("#7CFC9A");
    }
  }

  updateHud() {
    this.scoreText.setText(this.score.toLocaleString());
    this.cakeText.setText(`CAKE ${Math.min(this.cake + 1, CAKES)} / ${CAKES}`);
    const strength = Math.min(3, Math.ceil(Math.abs(this.wind) / 60));
    const arrows = (this.wind < 0 ? "←" : "→").repeat(strength);
    this.windText.setText(strength ? `WIND ${arrows}` : "NO WIND");
  }

  // With ?debug in the address, every spot and prop is outlined, to help line them up with art.
  drawDebug() {
    if (!new URLSearchParams(location.search).has("debug")) return;
    const g = this.add.graphics().setDepth(90);
    for (const s of this.level.spots) {
      g.lineStyle(2, 0x00ff00);
      if (s.kind === "pop") {
        g.lineBetween(s.x - 50, s.sillY, s.x + 50, s.sillY);
        if (s.clip) g.strokeRect(...s.clip);
      } else {
        g.lineBetween(s.x1 ?? 0, s.y, s.x2 ?? W, s.y);
      }
    }
    g.lineStyle(2, 0xff0000);
    for (const p of this.level.props) g.strokeCircle(p.x, p.y, p.r);
    g.lineStyle(2, 0xffff00);
    g.lineBetween(0, ZONE_TOP, W, ZONE_TOP);
  }

  // ---------------------------------------------------------------------------------------------
  // Cakes and flicks

  newCake() {
    if (this.cake >= CAKES) return;
    this.phase = phaseFor(this.cake);
    this.wind = this.phase.wind ? Phaser.Math.Between(-this.phase.wind, this.phase.wind) : 0;
    if (this.snow) this.snow.speedX = this.wind * 0.5;
    this.updateHud();
    this.tweens.killTweensOf(this.cakeImg); // a fade from the last landing must not hide this one
    this.cakeImg.setPosition(PLATE.x, H + 80).setScale(1).setAngle(0).setAlpha(1).setVisible(true);
    this.tweens.add({
      targets: this.cakeImg, y: PLATE.y, duration: 280, ease: "Back.easeOut",
      onComplete: () => (this.ready = true),
    });
  }

  listen() {
    this.input.on("pointerdown", (p) => {
      audio.unlock();
      const at = fingerAt(this, p);
      if (!this.ready || this.pointerId !== null || at.y < ZONE_TOP) return;
      this.pointerId = p.id;
      this.path = [at];
    });
    this.input.on("pointermove", (p) => {
      if (p.id !== this.pointerId) return;
      const at = fingerAt(this, p);
      this.path.push(at);
      if (this.path.length > 40) this.path.shift();
      this.drawTrail();
      this.cakeImg.setPosition(Phaser.Math.Clamp(at.x, 60, W - 60), Math.max(at.y, ZONE_TOP + 30));
      if (at.y < THROW_LINE) this.release();
    });
    const up = (p) => {
      if (p.id !== this.pointerId) return;
      this.path.push(fingerAt(this, p));
      this.release();
    };
    this.input.on("pointerup", up);
    this.input.on("pointerupoutside", up);
  }

  // A glowing trail behind the finger, like Fruit Ninja's blade.
  drawTrail() {
    const pts = this.path.slice(-12);
    this.trail.clear().setAlpha(1);
    for (let i = 1; i < pts.length; i++) {
      const k = i / pts.length;
      this.trail.lineStyle(4 + 12 * k, 0xfff3c4, 0.15 + 0.6 * k);
      this.trail.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
  }

  release() {
    this.pointerId = null;
    const flick = readFlick(this.path);
    this.path = [];
    this.tweens.add({ targets: this.trail, alpha: 0, duration: 220 });
    if (flick.ok) {
      this.launch(flick);
      return;
    }
    // Too gentle or the wrong way: the cake goes back on the plate and costs nothing.
    audio.play("boing");
    const line = cast.randomSaying("gentle");
    const elf = this.elves.find((e) => e.canBeHit());
    if (elf) {
      bubble(this, elf.x, elf.y - 70 * elf.s, line.text, 1200);
      this.say(elf, line);
    } else {
      floatText(this, W / 2, 640, line.text, "#ffffff", 28);
    }
    this.tweens.add({ targets: this.cakeImg, x: PLATE.x, y: PLATE.y, duration: 260, ease: "Back.easeOut" });
  }

  launch(flick) {
    this.ready = false;
    this.hint?.destroy();
    this.hint = null;
    const from = { x: this.cakeImg.x, y: this.cakeImg.y };
    const targets = this.elves.filter((e) => e.canBeHit()).map((e) => ({ x: e.x, y: e.y }));
    const aim = aimAssist(flick.dirX, flick.dirY, from, targets, this.phase.assist);
    const speed = Phaser.Math.Linear(1150, 1800, flick.power);
    let reach = Phaser.Math.Linear(300, 1150, flick.power);
    if (aim.target) {
      // Aim help also forgives a throw that would have dropped just short of the target.
      const need = Math.hypot(aim.target.x - from.x, aim.target.y - from.y) + 40;
      if (reach < need && reach > need * 0.8) reach = need;
    }
    this.flight = {
      x: from.x, y: from.y, dirX: aim.dirX, dirY: aim.dirY,
      v: speed, a: (speed * speed) / (2 * reach), dist: 0, hits: 0, hitElves: new Set(), points: 0,
    };
    audio.play("whoosh");
  }

  // ---------------------------------------------------------------------------------------------
  // The loop

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (!this.finished) this.spawn(dt);
    for (const e of this.elves) e.update(dt);
    this.elves = this.elves.filter((e) => e.alive);
    if (this.flight) this.fly(dt);
  }

  spawn(dt) {
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    this.spawnIn = Phaser.Math.FloatBetween(0.5, 1.1);
    const active = this.elves.filter((e) => e.alive);
    if (active.length >= this.phase.maxUp) return;
    const busySpots = new Set(active.map((e) => e.spot));
    const crossing = active.some((e) => e.spot.kind !== "pop");
    const free = this.level.spots.filter(
      (s) => this.phase.kinds.includes(s.kind) && !busySpots.has(s) && (s.kind === "pop" || !crossing),
    );
    if (free.length === 0) return;
    const spot = Phaser.Utils.Array.GetRandom(free);
    const character = cast.nextElf(new Set(active.map((e) => e.character.id)));
    if (!character) return;
    this.elves.push(new Elf(this, spot, character, { stay: this.phase.stay }));
    audio.play(spot.kind === "fly" ? "bells" : "pop");
  }

  fly(dt) {
    const f = this.flight;
    f.v -= f.a * dt;
    const step = Math.max(0, f.v) * dt;
    f.x += f.dirX * step + this.wind * 0.8 * dt;
    f.y += f.dirY * step;
    f.dist += step;
    const scale = Math.max(0.42, 1 - f.dist * 0.00065);
    this.cakeImg.setPosition(f.x, f.y).setScale(scale).setAngle(this.cakeImg.angle + 600 * dt);

    const r = CAKE_R * scale;
    for (const elf of this.elves) {
      if (f.hitElves.has(elf) || !elf.canBeHit()) continue;
      const where = elf.hitTest(f.x, f.y, r);
      if (where) {
        this.hitElf(elf, where);
        if (!this.flight) return;
        break;
      }
    }
    if (f.x < -80 || f.x > W + 80 || f.y < -80) this.endThrow(f.hits === 0);
    else if (f.v <= 0) this.land();
  }

  hitElf(elf, where) {
    const f = this.flight;
    f.hits++;
    f.hitElves.add(elf);
    elf.takeHit();
    const pts = elf.points + (where === "face" ? FACE_BONUS : 0);
    f.points += pts;
    this.score += pts;
    this.hits[elf.character.id] = (this.hits[elf.character.id] || 0) + 1;
    this.bestCombo = Math.max(this.bestCombo, f.hits);

    const label = where === "face" ? `FACE SHOT! +${pts}` : `+${pts}`;
    floatText(this, elf.x, elf.y - 60 * elf.s, label, where === "face" ? "#ff9ec4" : "#ffe066");
    const saying = cast.randomSaying("hit");
    bubble(this, elf.x, elf.y - 90 * elf.s, saying.text);
    audio.play("splat");
    this.say(elf, saying);
    this.crumbs(f.x, f.y);
    navigator.vibrate?.(30);

    if (f.hits === 2) {
      // Two elves with one fruitcake doubles the whole throw.
      this.score += f.points;
      this.time.delayedCall(250, () => floatText(this, W / 2, 420, `COMBO! +${f.points}`, "#7CFC9A", 44));
      audio.play("combo");
      this.cakeImg.setVisible(false);
      this.updateHud();
      this.endThrow(false);
      return;
    }
    // Bounce off to one side, slower, and maybe into a second elf.
    const turn = Phaser.Math.DegToRad(Phaser.Math.Between(35, 70)) * (Math.random() < 0.5 ? -1 : 1);
    const angle = Math.atan2(f.dirY, f.dirX) + turn;
    f.dirX = Math.cos(angle);
    f.dirY = Math.sin(angle);
    f.v = Math.max(f.v, 500) * 0.65;
    f.a = (f.v * f.v) / (2 * 260);
    this.updateHud();
  }

  // The fruitcake ran out of steam. A short throw can land on something it should not.
  land() {
    const f = this.flight;
    const r = CAKE_R * this.cakeImg.scale;
    const prop = this.level.props.find((p) => Math.hypot(p.x - f.x, p.y - f.y) < p.r + r);
    this.crumbs(f.x, f.y);
    if (prop) {
      this.score = Math.max(0, this.score + prop.points);
      floatText(this, prop.x, prop.y - 60, `${prop.name}! ${prop.points}`, "#ff6b6b", 26);
      audio.play("smash");
      navigator.vibrate?.([40, 40, 80]);
      this.cakeImg.setVisible(false);
      this.updateHud();
    } else {
      audio.play("thud");
      this.tweens.add({ targets: this.cakeImg, alpha: 0, delay: 250, duration: 300 });
    }
    this.endThrow(f.hits === 0 && !prop);
  }

  endThrow(missed) {
    this.flight = null;
    if (missed) {
      const elf = this.elves.find((e) => e.canBeHit());
      if (elf) {
        const saying = cast.randomSaying("miss");
        bubble(this, elf.x, elf.y - 90 * elf.s, saying.text, 1200);
        if (!this.say(elf, saying)) audio.play("giggle");
      }
    }
    this.cake++;
    if (this.cake >= CAKES) {
      this.finished = true;
      this.time.delayedCall(1700, () => this.finishRound());
    } else {
      this.time.delayedCall(550, () => this.newCake());
    }
  }

  // The elf says the line out loud in its own voice, if it has been recorded. → whether it spoke
  say(elf, saying) {
    const clip = cast.voiceClip(elf.character, saying);
    if (clip) audio.playVoice(clip);
    return Boolean(clip);
  }

  crumbs(x, y) {
    for (const [key, count] of [["crumb", 16], ["cherry", 4]]) {
      const burst = this.add
        .particles(x, y, key, {
          speed: { min: 120, max: 380 }, angle: { min: 0, max: 360 }, lifespan: 750,
          gravityY: 900, scale: { start: 1, end: 0.3 }, emitting: false,
        })
        .setDepth(50);
      burst.explode(count);
      this.time.delayedCall(1000, () => burst.destroy());
    }
  }

  finishRound() {
    const result = store.recordRound(this.level.id, this.score, this.hits);
    this.scene.start("Results", {
      level: this.levelIndex, score: this.score, hits: this.hits, bestCombo: this.bestCombo,
      challenge: this.challenge, ...result,
    });
  }
}
