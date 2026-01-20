import requests
import json
import re
import os

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# --- CONFIGURATION ---
# NO hardcoded key
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found. Check your .env file.")

# 2026 Stable Endpoint
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={API_KEY}"
FASTAPI_URL = "http://127.0.0.1:8000/predict_and_schedule"

def ask_gemini(prompt):
    # Updated instruction: Added 2026 date context and range extraction
    system_instruction = (
        "You are a crypto wallet assistant. Today is Friday, January 16, 2026. "
        "If a user wants to schedule money, respond ONLY with a JSON object: "
        "{'amount': float, 'token': str, 'start_time': 'YYYY-MM-DD HH:MM:SS', 'end_time': 'YYYY-MM-DD HH:MM:SS'}. "
        "If the user does not specify a range, leave start_time and end_time as null. "
        "Calculate dates for terms like 'this weekend' or 'next month' based on the year 2026. "
        "Otherwise, respond with helpful text."
    )
    
    payload = {
        "contents": [{"parts": [{"text": f"{system_instruction}\n\nUser: {prompt}"}]}]
    }
    
    try:
        response = requests.post(GEMINI_URL, json=payload)
        response.raise_for_status()
        result = response.json()
        
        if 'error' in result:
            return f"ERROR FROM GOOGLE: {result['error']['message']}"
        
        if 'candidates' not in result:
            return f"DEBUG: API returned no candidates. Full Response: {result}"
        
        return result['candidates'][0]['content']['parts'][0]['text']
    except requests.exceptions.RequestException as e:
        return f"Network Error: {str(e)}"

# --- MAIN LOOP ---
print("--- AI SMART WALLET BRIDGE ONLINE (2026 Edition) ---")
print("Examples: 'Send 5 ETH' (Whole year) or 'Send 2 ETH this weekend' (Range)")

while True:
    user_msg = input("\nYou: ")
    if user_msg.lower() in ['exit', 'quit']: 
        break
    
    ai_response = ask_gemini(user_msg)
    
    # Extract JSON from response
    json_match = re.search(r"\{.*\}", ai_response, re.DOTALL)
    
    if json_match:
        try:
            clean_json = json_match.group(0)
            clean_json = clean_json.replace("'", '"')
            data = json.loads(clean_json)
            
            print(f"Gemini: Planning to send {data['amount']} {data['token']}...")
            
            # Prepare optional range parameters for FastAPI
            params = {
                "amount": data['amount'], 
                "token": data['token']
            }
            if data.get('start_time'): params['start_time'] = data['start_time']
            if data.get('end_time'): params['end_time'] = data['end_time']
            
            # Call your FASTAPI Brain
            tx_response = requests.post(FASTAPI_URL, params=params)
            tx_response.raise_for_status()
            res = tx_response.json()
            
            # Use 'best_time' to match your updated main.py
            print(f"Gemini: Success! Scheduled for {res['best_time']} (Saved to MongoDB ID: {res['db_id']})")
            print(f"Gemini: Predicted Price: ${res['predicted_price']}")
            
        except Exception as e:
            print(f"Gemini: Error processing transaction: {str(e)}")
    else:
        print(f"Gemini: {ai_response}")

