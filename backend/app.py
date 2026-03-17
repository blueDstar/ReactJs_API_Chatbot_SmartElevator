#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import HOST, PORT, DEBUG
from services.chat_service import process_chat, clear_history

app = Flask(__name__)
CORS(app)


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.json or {}
        user_message = (data.get("message") or "").strip()
        session_id = (data.get("session_id") or "default").strip()

        if not user_message:
            return jsonify({"success": False, "error": "message rỗng"}), 400

        assistant_message = process_chat(user_message, session_id)
        return jsonify({"success": True, "message": assistant_message})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/clear", methods=["POST"])
def api_clear_history():
    data = request.json or {}
    session_id = (data.get("session_id") or "default").strip()
    clear_history(session_id)
    return jsonify({"success": True})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "Backend is running"
    })


if __name__ == "__main__":
    print("AI Chatbot SmartElevator backend đang chạy...")
    print(f"API: http://localhost:{PORT}")
    app.run(host=HOST, port=PORT, debug=DEBUG)