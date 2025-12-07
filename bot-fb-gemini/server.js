import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { callGemini } from './utils/gemini.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_TOKEN = process.env.PAGE_TOKEN;

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          const senderId = event.sender?.id;
          if (!senderId) continue;

          if (event.message && event.message.text) {
            const userText = event.message.text;
            const reply = await callGemini(userText);
            await sendMessage(senderId, reply);
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Erreur webhook:', err);
    res.sendStatus(500);
  }
});

async function sendMessage(recipientId, text) {
  const body = {
    messaging_type: 'RESPONSE',
    recipient: { id: recipientId },
    message: { text }
  };

  const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) console.error('Erreur sendMessage:', data);
  return data;
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Bot en ligne sur port ${port}`));
