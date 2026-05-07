export default async function handler(req, res) {
    // VERIFY WEBHOOK
    if (req.method === "GET") {
        const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode && token === VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        } else {
            return res.status(403).send("Verification failed");
        }
    }

    // HANDLE EVENTS
    if (req.method === "POST") {
        const body = req.body;

        console.log("🔥 EVENT RECEIVED:", JSON.stringify(body, null, 2));

        return res.status(200).send("EVENT_RECEIVED");
    }

    return res.status(405).send("Method not allowed");
}