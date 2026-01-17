const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Instrucciones reforzadas
const PROMPT_SISTEMA = `Sos el Asistente de Logística Rossetton. Tu jefe es Guillermo. 
REGLAS ESTRICTAS:
1. Siempre saludá amablemente y presentate como el asistente de Logística Rossetton.
2. Usá modismos argentinos (che, dale, perfecto, impecable).
3. Si el cliente quiere ENVÍO o RETIRO: Pedí dirección EXACTA y LOCALIDAD de origen y destino.
4. Si solo quieren consultar, respondé con respeto y asesoralos.
5. No seas robótico, conversá como si estuvieras en el mostrador del local.`;

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${PROMPT_SISTEMA}\n\nMensaje del cliente: ${mensajeUsuario}` }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // Si la IA falla, Tonton responde por su cuenta con lógica básica
            return "¡Hola! ¿Cómo estás? Soy el asistente de Logística Rossetton. Disculpame, se me cortó la señal un segundo. ¿Qué necesitás enviar o retirar así te tomo los datos?";
        }
    } catch (error) {
        return "¡Buenas! Soy el asistente de Guillermo. Decime qué necesitás mandar y a dónde, así te ayudo.";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Respuesta de la IA
    const respuestaIA = await hablarConIA(text);
    addMessage(respuestaIA, "bot");
    
    // Notificamos a la planilla
    enviarDatosHoja(text);
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function enviarDatosHoja(mensaje) {
    if (!URL_GOOGLE_SHEETS) return;
    const formData = new URLSearchParams();
    formData.append("detalles", mensaje);
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    
    // ESTO FUERZA EL SALUDO INICIAL
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy el asistente virtual de <b>Logística Rossetton</b>. ¿Qué envío o retiro tenemos para hoy?", "bot");
    }, 500);
});
