// One elf from the cast: an elf body and its head (the face picture, hat included). It pops up from behind something,
// walks along a ledge or flies across the sky, depending on the level spot it was given.
import { faceKey } from "./cast.js";
import { ELF_COLOURS } from "./textures.js";

export const HEAD_R = 44;   // radius of the face as drawn
const FACE_SIZE = 150;      // the face picture: a square with the hat on top and the collar at the bottom
const FACE_Y = 0.62;        // where the middle of the face is, down the picture
const UP_OFFSET = 52;       // how far the head centre rises above the sill
const HIDDEN_OFFSET = 120;  // how far below the sill it hides

export class Elf {
  constructor(scene, spot, character, { stay }) {
    this.scene = scene;
    this.spot = spot;
    this.character = character;
    this.points = spot.points;
    this.s = spot.scale ?? 1;
    this.state = "rising"; // rising → up → ducking → gone, or hit → gone
    this.stay = stay;
    this.bob = Math.random() * 6;

    // The body matches the elf's hat; an elf without an outfit gets a random one.
    const colour = character.outfit ?? Math.floor(Math.random() * ELF_COLOURS.length);
    this.body = width(scene.add.image(0, 38, `elf-body-${colour}`).setOrigin(0.5, 0), 112);
    this.faceImg = scene.add.image(0, 0, faceKey(scene, character)).setOrigin(0.5, FACE_Y).setDisplaySize(FACE_SIZE, FACE_SIZE);
    const parts = [this.body, this.faceImg];
    if (spot.vehicle === "sleigh") parts.push(width(scene.add.image(-10, 100, "sleigh"), 250));
    if (spot.vehicle === "balloons") parts.unshift(width(scene.add.image(0, -100, "balloons").setOrigin(0.5, 1), 150));
    this.c = scene.add.container(0, 0, parts).setScale(this.s).setDepth(spot.depth ?? 20);

    if (spot.kind === "pop") this.startPop();
    else this.startCrossing();
  }

  get x() {
    return this.c.x;
  }

  get y() {
    return this.c.y;
  }

  get alive() {
    return this.state !== "gone";
  }

  startPop() {
    const { x, sillY } = this.spot;
    const s = this.s;
    const clip = this.spot.clip || [x - 85 * s, sillY - 300 * s, 170 * s, 300 * s];
    this.maskShape = this.scene.make.graphics({}, false);
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(...clip);
    this.c.setMask(this.maskShape.createGeometryMask());
    this.c.setPosition(x, sillY + HIDDEN_OFFSET * s);
    this.scene.tweens.add({
      targets: this.c, y: sillY - UP_OFFSET * s, duration: 260, ease: "Back.easeOut",
      onComplete: () => {
        if (this.state !== "rising") return;
        this.state = "up";
        this.duckTimer = this.scene.time.delayedCall(this.stay * 1000, () => this.duck());
      },
    });
  }

  duck() {
    if (this.state !== "up") return;
    this.state = "ducking";
    this.scene.tweens.add({
      targets: this.c, y: this.spot.sillY + HIDDEN_OFFSET * this.s, duration: 200, ease: "Quad.easeIn",
      onComplete: () => this.remove(),
    });
  }

  // Walking and flying elves cross from one side to the other.
  startCrossing() {
    const { kind } = this.spot;
    const x1 = this.spot.x1 ?? -110;
    const x2 = this.spot.x2 ?? 650;
    const leftToRight = kind === "walk" ? (this.spot.dir ? this.spot.dir > 0 : Math.random() < 0.5) : false;
    const from = leftToRight ? x1 : x2;
    const to = leftToRight ? x2 : x1;
    this.c.setPosition(from, this.spot.y);
    if (!leftToRight) this.body.setFlipX(true);
    this.state = "up";
    const speed = this.spot.speed ?? (kind === "fly" ? 150 : 85);
    this.crossTween = this.scene.tweens.add({
      targets: this.c, x: to, duration: (Math.abs(to - from) / speed) * 1000,
      onComplete: () => this.remove(),
    });
  }

  update(dt) {
    if (this.state === "up" && this.spot.kind !== "pop") {
      this.bob += dt * (this.spot.kind === "walk" ? 10 : 3);
      this.c.y = this.spot.y + Math.sin(this.bob) * (this.spot.kind === "walk" ? 3 : 8);
    }
  }

  // Can the fruitcake hit this elf right now? A popping elf only counts once its head is up.
  canBeHit() {
    if (this.state === "hit" || this.state === "gone") return false;
    if (this.spot.kind !== "pop") return true;
    return this.c.y <= this.spot.sillY - 4 * this.s;
  }

  // → "face" (right in the face), "body" or null
  hitTest(x, y, r) {
    const s = this.s;
    const d = Math.hypot(x - this.c.x, y - this.c.y);
    if (d < HEAD_R * s * 0.55) return "face";
    if (d < HEAD_R * s + r * 0.7) return "body";
    const bodyBottom = this.spot.kind === "pop" ? Math.min(this.spot.sillY, this.c.y + 150 * s) : this.c.y + 150 * s;
    if (y > this.c.y && y < bodyBottom && Math.abs(x - this.c.x) < 46 * s + r * 0.5) return "body";
    return null;
  }

  takeHit() {
    this.state = "hit";
    this.duckTimer?.remove();
    this.crossTween?.stop();
    this.scene.tweens.killTweensOf(this.c);
    const splatKey = faceKey(this.scene, this.character, "splat");
    if (splatKey.endsWith("-splat")) this.faceImg.setTexture(splatKey);
    else this.c.add(this.scene.add.image(0, 2, "splat").setDisplaySize(118, 118));
    this.scene.tweens.add({ targets: this.c, x: this.c.x + 6, duration: 40, yoyo: true, repeat: 4 });

    this.scene.time.delayedCall(450, () => {
      if (this.state === "gone") return;
      this.faceImg.setTexture(faceKey(this.scene, this.character, "dazed"));
      const stars = (this.stars = this.scene.add.container(0, -60));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        stars.add(this.scene.add.image(Math.cos(a) * 46, Math.sin(a) * 12, "star"));
      }
      this.c.add(stars);
      this.scene.tweens.add({ targets: stars, angle: 360, duration: 900, repeat: -1 });
    });

    const fallDelay = 1150;
    if (this.spot.kind === "pop") {
      this.scene.tweens.add({
        targets: this.c, y: this.spot.sillY + HIDDEN_OFFSET * this.s, delay: fallDelay, duration: 380, ease: "Back.easeIn",
        onComplete: () => this.remove(),
      });
    } else {
      this.scene.tweens.add({
        targets: this.c, y: this.c.y + 500, angle: 220, delay: fallDelay, duration: 900, ease: "Quad.easeIn",
        onComplete: () => this.remove(),
      });
    }
  }

  remove() {
    if (this.state === "gone") return;
    this.state = "gone";
    this.duckTimer?.remove();
    this.scene.tweens.killTweensOf(this.c);
    if (this.stars) this.scene.tweens.killTweensOf(this.stars);
    this.c.destroy();
    this.maskShape?.destroy();
  }
}

// Scales a picture to a width in game pixels, whatever size the picture file is.
function width(img, w) {
  return img.setScale(w / img.width);
}
