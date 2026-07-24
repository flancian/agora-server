#!/usr/bin/env -S uv run
# /// script
# dependencies = [
#     "openai",
# ]
# ///

import os
import sys
import json
from openai import OpenAI

CACHE_FILE = os.path.expanduser("~/.cache/openrouter_last_chat.json")

def get_api_key() -> str:
    """
    Retrieves the OpenRouter API key.
    Checks the OPENROUTER_API_KEY environment variable first,
    then looks in ~/flancia/secret/openrouter.
    """
    # 1. Try env var
    key = os.environ.get("OPENROUTER_API_KEY")
    if key:
        return key.strip()
    
    # 2. Try file path
    secret_path = os.path.expanduser("~/flancia/secret/openrouter")
    if os.path.exists(secret_path):
        try:
            with open(secret_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception as e:
            print(f"Warning: Could not read secret file at {secret_path}: {e}", file=sys.stderr)
            
    # 3. Fail
    print(
        "Error: OpenRouter API key not found.\n"
        "Please either:\n"
        "  - Set the OPENROUTER_API_KEY environment variable, or\n"
        "  - Create a file at ~/flancia/secret/openrouter containing your API key.",
        file=sys.stderr
    )
    sys.exit(1)

def load_history():
    """
    Loads active conversation history and model from the cache file.
    """
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("messages", []), data.get("model", "google/gemini-3.6-flash")
        except Exception as e:
            print(f"Warning: Could not read history file: {e}", file=sys.stderr)
    return [], "google/gemini-3.6-flash"

def save_history(messages: list, model: str):
    """
    Saves active conversation history and model to the cache file.
    """
    try:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump({"messages": messages, "model": model}, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save history file: {e}", file=sys.stderr)

def query_openrouter(messages: list, model: str = "google/gemini-3.6-flash") -> str:
    """
    Sends a list of messages (conversation history) to OpenRouter and returns the response.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=get_api_key(),
    )
    
    # Optional headers to show your app name and URL on openrouter.ai rankings.
    headers = {
        "HTTP-Referer": "https://anagora.org",
        "X-Title": "Agora Client",
    }
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            extra_headers=headers
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error querying OpenRouter: {e}", file=sys.stderr)
        sys.exit(1)

def list_models():
    """
    Fetches and prints all available model IDs from OpenRouter.
    """
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=get_api_key(),
    )
    try:
        models = client.models.list()
        for m in models:
            print(m.id)
    except Exception as e:
        print(f"Error fetching models: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ("--help", "-h"):
        print("Usage:", file=sys.stderr)
        print("  ./scripts/openrouter.py <prompt> [model]      Start a new conversation", file=sys.stderr)
        print("  ./scripts/openrouter.py --continue <prompt>   Continue the last conversation", file=sys.stderr)
        print("  ./scripts/openrouter.py --list | list         List all available models", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print("  ./scripts/openrouter.py \"Why is the sky blue?\"", file=sys.stderr)
        print("  ./scripts/openrouter.py --continue \"Tell me more.\"", file=sys.stderr)
        sys.exit(1)
        
    arg = sys.argv[1]
    if arg in ("--list", "list"):
        list_models()
    elif arg == "--continue":
        if len(sys.argv) < 3:
            print("Error: Please provide a prompt for --continue.", file=sys.stderr)
            sys.exit(1)
        next_prompt = sys.argv[2]
        messages, model = load_history()
        if not messages:
            print("Error: No active conversation history found to continue.", file=sys.stderr)
            sys.exit(1)
        messages.append({"role": "user", "content": next_prompt})
        response_text = query_openrouter(messages, model)
        messages.append({"role": "assistant", "content": response_text})
        save_history(messages, model)
        print(response_text)
    else:
        model = sys.argv[2] if len(sys.argv) > 2 else "google/gemini-3.6-flash"
        messages = [{"role": "user", "content": arg}]
        response_text = query_openrouter(messages, model)
        messages.append({"role": "assistant", "content": response_text})
        save_history(messages, model)
        print(response_text)

