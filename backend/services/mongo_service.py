import json
import re
from bson import ObjectId
from pymongo import MongoClient
from pymongo.server_api import ServerApi

from config import MONGO_URI, DATABASE_NAME

DB = None


def init_db():
    global DB
    if DB is None:
        client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
        client.admin.command("ping")
        DB = client[DATABASE_NAME]
        print("Đã kết nối MongoDB thành công.")
        print("Database:", DATABASE_NAME)
        print("Collections:", DB.list_collection_names())
    return DB


def serialize_doc(doc):
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        else:
            out[k] = v
    return out


def print_context_json(context):
    print("\n===== CONTEXT_JSON FROM MONGODB =====")
    print(json.dumps(context, ensure_ascii=False, indent=2))
    print("===== END CONTEXT_JSON =====\n")


def fetch_context(user_message: str, intent: str):
    db = init_db()
    msg = user_message
    context = {}

    emp_match = re.search(r"\b(EMP\d+)\b", msg, re.IGNORECASE)
    elv_match = re.search(r"\b(ELV\d+)\b", msg, re.IGNORECASE)

    if intent == "personnel":
        if emp_match:
            emp = emp_match.group(1).upper()
            docs = list(db["Personnel"].find({"employee_id": emp}).limit(5))
        else:
            docs = list(db["Personnel"].find({}).limit(5))
        context["Personnel"] = [serialize_doc(d) for d in docs]

    elif intent == "behavior":
        query = {}
        if emp_match:
            query["employee_id"] = emp_match.group(1).upper()
        if elv_match:
            query["elevator_id"] = elv_match.group(1).upper()
        docs = list(db["Behavior"].find(query).limit(5))
        context["Behavior"] = [serialize_doc(d) for d in docs]

    elif intent == "elevator":
        if elv_match:
            elv = elv_match.group(1).upper()
            docs = list(db["Elevator"].find({"elevator_id": elv}).limit(5))
        else:
            docs = list(db["Elevator"].find({}).limit(5))
        context["Elevator"] = [serialize_doc(d) for d in docs]

    elif intent == "strange_objects":
        query = {}
        if elv_match:
            query["elevator_id"] = elv_match.group(1).upper()
        docs = list(db["Strange_objects"].find(query).limit(5))
        context["Strange_objects"] = [serialize_doc(d) for d in docs]

    elif intent == "alert":
        query = {}
        if emp_match:
            query["employee_id"] = emp_match.group(1).upper()
        if elv_match:
            query["elevator_id"] = elv_match.group(1).upper()
        docs = list(db["Alert"].find(query).limit(5))
        context["Alert"] = [serialize_doc(d) for d in docs]

    return context