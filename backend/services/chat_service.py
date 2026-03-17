import json
import re

from config import SYSTEM_PROMPT
from services.llm_service import generate_reply
from services.mongo_service import fetch_context, print_context_json

conversations = {}


def detect_intent(user_message: str):
    msg = user_message.lower()

    if "nhân viên" in msg or "nhân sự" in msg or re.search(r"\bemp\d+\b", msg, re.IGNORECASE):
        return "personnel"
    if "hành vi" in msg or "ngồi" in msg or "nằm" in msg or "đứng" in msg:
        return "behavior"
    if "thang máy" in msg or "elevator" in msg or re.search(r"\belv\d+\b", msg, re.IGNORECASE):
        return "elevator"
    if "vật thể lạ" in msg or "chai nước" in msg or "balo" in msg or "đồ vật" in msg:
        return "strange_objects"
    if "cảnh báo" in msg or "alert" in msg or "warning" in msg:
        return "alert"

    return "general"


def needs_clarification(user_message: str, intent: str):
    msg = user_message.lower()

    if intent == "personnel":
        has_emp = re.search(r"\bemp\d+\b", msg, re.IGNORECASE)
        has_name_hint = any(x in msg for x in ["tên", "phòng ban", "đi đâu", "tầng", "lần nào"])
        if not has_emp and not has_name_hint:
            return "Bạn muốn tra nhân viên theo mã nhân viên, tên, hay lịch sử đi thang máy?"

    if intent == "elevator":
        has_elv = re.search(r"\belv\d+\b", msg, re.IGNORECASE)
        if not has_elv:
            return "Bạn muốn tra thang máy nào? Ví dụ: ELV001, ELV002 hoặc ELV003."

    return None


def build_messages(session_id: str, user_message: str, context=None):
    history = conversations.get(session_id, [])

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-6:])

    if context:
        context_json = json.dumps(context, ensure_ascii=False, indent=2)
        messages.append({
            "role": "user",
            "content": f"Câu hỏi: {user_message}\n\nCONTEXT_JSON:\n{context_json}\n\nHãy trả lời chỉ dựa trên CONTEXT_JSON trên."
        })
    else:
        messages.append({"role": "user", "content": user_message})

    return messages


def trim_history(session_id: str, max_items=12):
    if len(conversations[session_id]) > max_items:
        conversations[session_id] = conversations[session_id][-max_items:]


def clear_history(session_id: str):
    conversations[session_id] = []


def process_chat(user_message: str, session_id: str):
    if session_id not in conversations:
        conversations[session_id] = []

    intent = detect_intent(user_message)

    if intent == "general":
        messages = build_messages(session_id, user_message, context=None)
        assistant_message = generate_reply(messages)
    else:
        clarification = needs_clarification(user_message, intent)
        if clarification:
            assistant_message = clarification
        else:
            context = fetch_context(user_message, intent)
            print_context_json(context)
            messages = build_messages(session_id, user_message, context=context)
            assistant_message = generate_reply(messages)

    conversations[session_id].append({"role": "user", "content": user_message})
    conversations[session_id].append({"role": "assistant", "content": assistant_message})
    trim_history(session_id)

    return assistant_message