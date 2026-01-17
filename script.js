// CONFIGURACIÓN CORREGIDA POR GEMINI
const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
// CAMBIO CLAVE: Usamos 'v1' en lugar de 'v1beta'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT_SISTEMA = "Sos el asistente de Logística Rossetton. Tu jefe es Guillermo. Reglas: 1. Hablá como argentino (che, dale). 2. Si quieren mandar algo, pedí dirección y localidad de origen y destino. 3. Usá emojis de motitos 🛵.";

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

        // Si hay un error, lo mostramos clarito
        if (data.error) {
            return "ERROR DE GOOGLE: " + data.error.message;
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        return "No te entendí, ¿me repetís? 🛵";
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
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    
    // Saludo inicial para ver si arranca
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy el asistente de <b>Logística Rossetton</b>. ¿Qué envío o retiro tenemos para hoy? 🛵", "bot");
    }, 500);
});
