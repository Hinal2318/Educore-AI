import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/DE")
# The actual database name could be parsed from the URI or hardcoded.
# If MONGO_URI is mongodb://localhost:27017/DE, we can get the default database.
client = MongoClient(MONGO_URI)
db = client.get_default_database(default="DE")

def get_db():
    return db
