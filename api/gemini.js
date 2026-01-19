export default async function handler(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Falta el mensaje del usuario." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key no encontrada en el servidor." });
    }

    const respuesta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await respuesta.json();

    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: "Respuesta inválida del modelo." });
    }

    const texto = data.candidates[0].content.parts[0].text;

    res.status(200).json({ reply: texto });

  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor." });
  }
}
