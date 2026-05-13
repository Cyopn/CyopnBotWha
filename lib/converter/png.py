from PIL import Image

SCALE = 2

im = Image.open("./temp/w.webp").convert("RGBA")
if SCALE > 1:
    im = im.resize((im.width * SCALE, im.height * SCALE),
                   resample=Image.LANCZOS)
im.save("./temp/w.png", "PNG")
