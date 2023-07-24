import praw
import json
from urllib.parse import unquote

rd = praw.Reddit(client_id="x2ALPDrIZKg_kTtjb-xpLQ",
                 client_secret="lsoUWZ3jxaihG57P6hizWBbexFZ7hg",
                 user_agent='CyopnBot by u/Cyopn',
                 check_for_async=False)

r = rd.subreddit('ChingaTuMadreNoko').random()

r2 = rd.submission(r)

d = {
    "title": unquote(str(r2.title)),
    "author": str(r2.author),
    "url": str(r2.url)
}

with open("./media/temp/praw.json", "w") as w:
    json.dump(d, w)

print(True)