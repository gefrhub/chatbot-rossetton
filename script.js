// LLAVE NUEVA QUE ME PASASTE
// La API key viene desde config.js
// USAMOS ESTA URL QUE ES LA QUE GOOGLE EXIGE AHORA
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT_SISTEMA = "Sos el asistente de Logística Rossetton. Hablá como un pibe de Argentina. Si te dicen que quieren mandar algo a Santa Fe, pedí calle y altura de origen y destino. Usá motitos 🛵.";

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: PROMPT_SISTEMA + "\n\nCliente: " + mensajeUsuario }]
                }]
            })
        });

        const data = await response.json();

        // Si hay error, lo mostramos para ver si cambió el mensaje
        if (data.error) {
            return "ERROR DE GOOGLE: " + data.error.message;
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        return "No te entendí, che. ¿Me repetís? 🛵";
    } catch (e) {
        return "ERROR DE CONEXIÓN: Revisá tu internet.";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const respuestaIA = await hablarConIA(text);
    addMessage(respuestaIA, "bot");
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});

