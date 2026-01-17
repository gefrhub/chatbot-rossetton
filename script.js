const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT_SISTEMA = "Sos el asistente de Logística Rossetton. Si te dicen que quieren enviar algo a Santa Fe, preguntá calle y altura de origen y destino. Hablá como argentino.";

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: PROMPT_SISTEMA + "\nCliente: " + mensajeUsuario }] }]
            })
        });

        const data = await response.json();
        
        // Si Google responde bien
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } 
        
        // SI GOOGLE DA ERROR, LO MOSTRAMOS EN EL CHAT PARA QUE LO VEAS
        if (data.error) {
            return "ERROR DE GOOGLE: " + data.error.message;
        }

        return "La IA recibió el mensaje pero no supo qué responder.";
    } catch (e) {
        return "ERROR DE CONEXIÓN: No llega señal a Google.";
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
