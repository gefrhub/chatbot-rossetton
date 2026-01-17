const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
// Cambiamos a gemini-pro que es el modelo más compatible con v1beta
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

async function hablarConIA(mensajeUsuario) {
    const prompt = "Sos el asistente de Logística Rossetton. Hablá como argentino, sé amable y pedí dirección y localidad de origen y destino para envíos.";
    
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt + "\nCliente: " + mensajeUsuario }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // Si gemini-pro también falla, probamos con la última opción automática
            return "DICE GOOGLE: " + data.error.message;
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        return "Che, se me mezclaron los pedidos. ¿Me repetís? 🛵";
    } catch (e) {
        return "Error de conexión. 🛵";
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
    msg.innerText = text; // Usamos innerText para evitar líos de formato
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});
