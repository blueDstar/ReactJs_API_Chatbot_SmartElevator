from llama_cpp import Llama
from config import MODEL_PATH

LLM = None


def init_llm():
    global LLM
    if LLM is None:
        LLM = Llama(
            model_path=MODEL_PATH,
            n_ctx=4096,
            n_threads=0,
            n_gpu_layers=0,
            verbose=False,
        )
    return LLM


def generate_reply(messages):
    llm = init_llm()
    resp = llm.create_chat_completion(
        messages=messages,
        temperature=0.2,
        top_p=0.9,
        max_tokens=384,
        stream=False,
    )
    return (resp["choices"][0]["message"]["content"] or "").strip()