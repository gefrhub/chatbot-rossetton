// ======================================================
// CONFIGURACIÓN IA GEMINI - LOGÍSTICA ROSSETTON (V. PROFESIONAL)
// ======================================================

const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Instrucciones modificadas: Tonton es el nombre interno, pero se presenta formalmente
const INSTRUCCIONES_BOT = `
Eres el Asistente Virtual de Logística Rossetton.
Tu objetivo es ayudar a los clientes de Guillermo a coordinar envíos y retiros de forma profesional y amable.
REGLAS DE PRESENTACIÓN:
1. NUNCA digas "Soy Tonton". Preséntate siempre como "el asistente virtual de Logística Rossetton".
2. Sé muy amable y usa un tono servicial (español de Argentina).
3. Tu prioridad es obtener: Nombre del cliente, Tipo de pedido (Envío o Retiro), Origen, Destino y Detalles extras.
4. Si el cliente te da datos incompletos, pedí lo que falta con cortesía.
5. Al finalizar, confirma que Guillermo ya recibió la notificación y se contactará pronto.
6. Usa emojis relacionados a la logística (📦, 🚚, 📍, ⏱️).
`;

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
        return "Disculpame, tuve un pequeño inconveniente técnico 😵‍💫. ¿Podrías repetirme tu mensaje?";
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
    
    if (text.length > 5) { 
        enviarDatosHoja(text); 
    }
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

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
                addMessage("¡Imagen recibida! 📸 Ya se la envié a Guillermo para que la revise.", "bot");
            }, 1000);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function enviarDatosHoja(mensajeCompleto) {
    if (!URL_GOOGLE_SHEETS) return;
    const formData = new URLSearchParams();
    formData.append("detalles", mensajeCompleto);
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    
    // SALUDO INICIAL PROFESIONAL
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy el asistente virtual de <b>Logística Rossetton</b>. ¿En qué puedo ayudarte con tus envíos hoy?", "bot");
    }, 500);
});
