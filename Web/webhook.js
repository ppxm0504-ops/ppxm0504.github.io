import fetch from "node-fetch";

const CHANNEL_ACCESS_TOKEN = "ใส่ Token ของคุณ";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const events = req.body.events;
    for (let event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const replyToken = event.replyToken;
        const text = `คุณพิมพ์ว่า: ${event.message.text}`;

        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken,
            messages: [{ type: "text", text }]
          })
        });
      }
    }
    res.status(200).send("OK");
  } else {
    res.status(405).send("Method not allowed");
  }
}
