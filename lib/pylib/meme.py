import praw
from urllib.parse import unquote
import json
import os
from dotenv import load_dotenv
load_dotenv()
rd = praw.Reddit(client_id=os.getenv("c_id"),
                 client_secret=os.getenv("c_st"),
                 user_agent='CyopnBot by u/Cyopn',
                 check_for_async=False)

r = rd.subreddit('ChingaTuMadreNoko').random()

r2 = rd.submission(r)

d = {
    "title": unquote(str(r2.title)),
    "author": str(r2.author),
    "url": str(r2.url)
}

with open("./temp/praw.json", "w") as w:
    json.dump(d, w)
    
print("ok")
