# Draws placeholder app icons: a fruitcake on a night-blue square.
# Run from the project folder:  python3 tools/make-icons.py
from PIL import Image, ImageDraw


def fruitcake(size, margin):
    img = Image.new("RGBA", (size, size), (11, 21, 48, 255))
    d = ImageDraw.Draw(img)
    s = (size - 2 * margin) / 100  # draw on a 100-unit grid inside the margin

    def box(x0, y0, x1, y1):
        return [margin + x0 * s, margin + y0 * s, margin + x1 * s, margin + y1 * s]

    d.rounded_rectangle(box(8, 34, 92, 82), radius=12 * s, fill=(74, 37, 17))
    d.rounded_rectangle(box(8, 28, 92, 52), radius=12 * s, fill=(107, 58, 28))
    d.rounded_rectangle(box(14, 24, 86, 36), radius=6 * s, fill=(244, 227, 193))
    for x, y, c in [(24, 48, (214, 40, 40)), (44, 66, (42, 157, 58)), (62, 50, (214, 40, 40)),
                    (78, 68, (242, 201, 76)), (34, 72, (214, 40, 40)), (80, 46, (42, 157, 58))]:
        d.ellipse(box(x - 4, y - 4, x + 4, y + 4), fill=c)
    return img


fruitcake(512, 40).save("icons/icon-512.png")
fruitcake(192, 15).save("icons/icon-192.png")
fruitcake(512, 110).save("icons/icon-maskable-512.png")
print("icons written")
