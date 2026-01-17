async function confirmSend() {
    try {
        // 🔹 SMS call
        const res = await fetch("http://127.0.0.1:5000/send-sms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: "0.005",
                tx: "SUCCESS"
            })
        });

        const data = await res.json();
        console.log("SMS sent:", data);

        // 🔹 Optional: success UI
        alert("📩 Transaction Confirmed & SMS Sent!");

        // 🔹 Close overlay if you want
        closeOverlay('send-overlay');

    } catch (err) {
        console.error(err);
        alert("❌ SMS failed");
    }
}
