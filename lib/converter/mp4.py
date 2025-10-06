from PIL import Image, ImageSequence
from moviepy import ImageSequenceClip
import numpy as np
im = Image.open("./temp/w.webp")
frames = []
durations = []
for frame in ImageSequence.Iterator(im):
    frames.append(frame.convert("RGB"))
    duration = frame.info.get("duration", 100)
    durations.append(duration)
frames_np = [np.array(f) for f in frames]
avg_duration = sum(durations) / len(durations)
fps = round(1000 / avg_duration, 2)
expanded_frames = []
for frame, dur in zip(frames, durations):
    repeat = max(1, int(round(dur / avg_duration)))
    expanded_frames.extend([np.array(frame)] * repeat)
clip = ImageSequenceClip(expanded_frames, fps=fps)
clip.write_videofile("./temp/w.mp4", codec="libx264")
