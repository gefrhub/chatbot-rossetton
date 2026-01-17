// ======================================================
// CONFIGURACIÓN IA GEMINI - LOGÍSTICA ROSSETTON
// ======================================================

const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Instrucciones para que la IA sepa quién es y qué datos buscar
const INSTRUCCIONES_BOT = `
Eres Tonton, el asistente inteligente de Logística Rossetton. 
Tu objetivo es ayudar a los clientes de Guillermo a coordinar envíos y retiros.
REGLAS:
1. Sé muy amable, eficiente y usa modismos de Argentina (che, listo, perfecto).
2. Debes obtener: Nombre del cliente, Tipo de servicio (Envío o Retiro), Origen, Destino y Detalles extras.
3. Si falta algún dato importante como la dirección, pídela amablemente.
4. Cuando tengas Origen y Destino definidos, confirma que Guillermo ya recibió la notificación.
5. Usa emojis de logística (📦, 🚚, 📍).
`;

// Función para hablar con la IA
async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: INSTRUCCIONES_BOT + "\n\nMensaje del usuario: " + mensajeUsuario }] }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error con Gemini:", error);
        return "Che, perdón, me dio un pequeño mareo técnico 😵‍💫. ¿Me podrías repetir eso?";
    }
}

// Enviar mensaje del usuario
async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Tonton responde usando la IA
    const respuestaIA = await hablarConIA(text);
    addMessage(respuestaIA, "bot");
    
    // Si la IA confirma un pedido, lo mandamos a la planilla (opcional)
    if (text.length > 10) { 
        enviarDatosHoja(text); 
    }
}

// Mostrar mensajes en pantalla
function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Función para el CLIP de fotos
function subirFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const chatBox = document.getElementById("chat-box");
            const msg = document.createElement("div");
            msg.className = "message user";
            msg.innerHTML = `<img src="${e.target.result}" style="max-width:100%; border-radius:10px;">`;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;

            setTimeout(() => {
                addMessage("¡Recibido! 📸 Ya le mandé la foto a Guillermo para que la revise.", "bot");
            }, 1000);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Enviar a Google Sheets
function enviarDatosHoja(mensajeCompleto) {
    if (!URL_GOOGLE_SHEETS) return;
    const formData = new URLSearchParams();
    formData.append("detalles", mensajeCompleto);
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

// Configuración inicial
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    
    // Saludo inicial de Tonton
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy Tonton, el asistente de <b>Logística Rossetton</b>. ¿En qué puedo ayudarte hoy?", "bot");
    }, 500);
});
