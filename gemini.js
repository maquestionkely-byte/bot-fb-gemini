import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * callGemini(userText)
 * Envoie userText à l'API Generative Language (Gemini) et retourne le texte de réponse.
 * IMPORTANT: ne laisse pas ta clé dans le code. Mets-la dans .env (local) ou dans les Variables d'environnement Render.
 */
export async function callGemini(userText) {
  try {
    const payload = {
      // Format simple pour l'endpoint generateContent
      contents: [{ parts: [{ text: userText }] }]
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    // Extraire le texte selon le format attendu
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.output?.[0]?.content ||
      null;

    if (text) return text;

    console.warn('Réponse Gemini inattendue:', JSON.stringify(data));
    return "Désolé, je n'ai pas de réponse pour l'instant.";
  } catch (err) {
    console.error('Erreur Gemini:', err);
    return "Erreur serveur, réessayez plus tard.";
  }
}
