const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Instrucciones maestras: Así Gemini sabe qué hacer con tus mensajes
const PROMPT_SISTEMA = "Sos el asistente de Logística Rossetton. Hablá como un argentino amable. Si te saludan, saludá. Si quieren enviar o retirar, pedí dirección y localidad de origen y destino. Usá emojis de motitos 🛵. Sé inteligente y recordá lo que te dicen.";

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: PROMPT_SISTEMA + "\n\nCliente: " + mensajeUsuario }]
                }]
            })
        });

        const data = await response.json();

        // Si hay respuesta de la IA
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } 
        
        // Si Google devuelve un error específico
        if (data.error) {
            return "Che, Google me dice: " + data.error.message;
        }

        return "No te escuché bien, ¿me repetís?";
    } catch (e) {
        return "Error de conexión. Revisá si tenés internet o si la API Key está activa.";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Aquí es donde sucede la magia
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

// Escuchar el Enter
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});
