from PIL import Image, ImageSequence
from moviepy import ImageSequenceClip
import numpy as np

SCALE = 2


def upscale_even(image):
    if SCALE > 1:
        image = image.resize(
            (image.width * SCALE, image.height * SCALE), resample=Image.LANCZOS)
    width, height = image.size
    width -= width % 2
    height -= height % 2
    if width != image.width or height != image.height:
        image = image.crop((0, 0, width, height))
    return image


im = Image.open("./temp/w.webp")
frames = []
durations = []
for frame in ImageSequence.Iterator(im):
    frame_rgba = frame.convert("RGBA")
    frame_rgba = upscale_even(frame_rgba)
    frame_rgb = frame_rgba.convert("RGB")
    frames.append(frame_rgb)
    duration = frame.info.get("duration", 100)
    durations.append(duration)
avg_duration = sum(durations) / len(durations)
fps = round(1000 / avg_duration, 2)
expanded_frames = []
for frame, dur in zip(frames, durations):
    repeat = max(1, int(round(dur / avg_duration)))
    expanded_frames.extend([np.array(frame)] * repeat)
clip = ImageSequenceClip(expanded_frames, fps=fps)
clip.write_videofile(
    "./temp/w.mp4",
    codec="libx264",
    preset="slow",
    bitrate="2M",
    audio=False,
    ffmpeg_params=["-pix_fmt", "yuv420p"],
)
