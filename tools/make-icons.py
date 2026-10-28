# Makes the app icons: the cartoon fruitcake on a night-blue square.
# Run from the project folder:  python3 tools/make-icons.py <big cut-out fruitcake .png>
# (the fruitcake from tools/art-prompts.py, cut out with tools/cutout.py at --height 600)
import sys

from PIL import Image

cake = Image.open(sys.argv[1]).convert("RGBA")


def icon(size, margin):
    img = Image.new("RGBA", (size, size), (11, 21, 48, 255))
    w = size - 2 * margin
    c = cake.resize((w, round(cake.height * w / cake.width)), Image.LANCZOS)
    img.alpha_composite(c, (margin, (size - c.height) // 2))
    return img


icon(512, 40).save("icons/icon-512.png")
icon(192, 15).save("icons/icon-192.png")
icon(512, 110).save("icons/icon-maskable-512.png")
print("icons written")
