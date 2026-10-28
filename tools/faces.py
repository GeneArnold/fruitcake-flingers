# Turns a chosen elf expression sheet (three heads: normal, dazed, splatted) into the elf's face
# pictures: elves/faces/<id>.png, <id>-dazed.png and <id>-splat.png, each square, the same size and
# lined up the same, so swapping faces mid-game doesn't make the head jump.
#   python3 tools/faces.py art/source/gen/elf-jingles-2.png jingles
import argparse
import pathlib
import subprocess
import sys

from PIL import Image

SIZE = 256

ap = argparse.ArgumentParser()
ap.add_argument("sheet")
ap.add_argument("id")
ap.add_argument("--min", default="0.03")
a = ap.parse_args()

tmp = pathlib.Path("art/source/cut")
tmp.mkdir(parents=True, exist_ok=True)
# cutout.py writes img/<name>.png; run it in art/source so the pieces land in art/source/img/.
names = [f"{a.id}", f"{a.id}-dazed", f"{a.id}-splat"]
(tmp / "img").mkdir(exist_ok=True)
out = subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name("cutout.py")),
                      str(pathlib.Path(a.sheet).resolve()), *names, "--height", "2000", "--min", a.min],
                     cwd=tmp, capture_output=True, text=True)
print(out.stdout.strip().splitlines()[0] if out.stdout else out.stderr)
pieces = [Image.open(tmp / "img" / f"{n}.png") for n in names]
if len(pieces) != 3:
    sys.exit("expected three heads")
# One scale for all three, from the widest head; each sits on the square's bottom edge, centred.
scale = SIZE / max(max(p.width, p.height) for p in pieces)
for n, p in zip(names, pieces):
    p = p.resize((round(p.width * scale), round(p.height * scale)), Image.LANCZOS)
    square = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    square.paste(p, ((SIZE - p.width) // 2, SIZE - p.height), p)
    square.save(f"elves/faces/{n}.png")
    print(f"elves/faces/{n}.png")
