from flask import Flask, request, jsonify
from twilio.rest import Client
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


ACCOUNT_SID = "AC0d73f33fd09b889c2be08a6ccc140c2a"
AUTH_TOKEN = "2573f607a637fddf3a0890fa89d8ae91"
TWILIO_NUMBER = "+1XXXXXXXXXX"
USER_NUMBER = "+918708302190"


client = Client(ACCOUNT_SID, AUTH_TOKEN)


@app.route("/send-sms", methods=["POST"])
def send_sms():
    data = request.json
    amount = data.get("amount", "0.00")
    tx = data.get("tx", "pending")

    message = client.messages.create(
        body=f"✅ ETH Sent Successfully\nAmount: {amount} ETH\nStatus: {tx}",
        from_=TWILIO_NUMBER,
        to=USER_NUMBER
    )

    return jsonify({"status": "sent", "sid": message.sid})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

