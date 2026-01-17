const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
// Probamos con la versión "v1beta" pero con el nombre del modelo COMPLETO que pide Google
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function hablarConIA(mensajeUsuario) {
    // Instrucciones cortas para no gastar energía
    const instrucciones = "Sos el asistente de Logística Rossetton. Hablá como argentino y pedí direcciones de envío.";
    
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: instrucciones + "\nCliente dice: " + mensajeUsuario }]
                }]
            })
        });

        const data = await response.json();

        // Si Google tira error, lo mostramos para saber LA VERDAD
        if (data.error) {
            return "DICE GOOGLE: " + data.error.message;
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        return "No te entendí, ¿me repetís? 🛵";
    } catch (e) {
        return "Error de conexión total.";
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
