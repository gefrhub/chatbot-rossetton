// ======================================================
// CONFIGURACIÓN IA GEMINI - LOGÍSTICA ROSSETTON (VERSIÓN INTELIGENTE)
// ======================================================

const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// INSTRUCCIONES AVANZADAS: Acá le enseñamos todo lo que vos querés
const INSTRUCCIONES_BOT = `
Eres el Asistente Virtual de Logística Rossetton. Guillermo es el dueño.
Tu objetivo es gestionar pedidos de envíos y retiros de forma proactiva.

REGLAS DE ORO:
1. Si el cliente dice "mandar", "llevar", "enviar" o "alcanzar", entiende que es un ENVÍO.
2. Si dice "buscar", "traer", "retirar" o "pasar por", entiende que es un RETIRO.
3. Si el cliente dice "quiero mandar algo a Santa Fe", tú debes responder: "¡Buenísimo! Yo te ayudo con eso. ¿Desde qué dirección saldría y a qué parte de Santa Fe lo llevamos?"
4. NUNCA respondas con errores técnicos. Si algo no está claro, pregunta con onda.
5. Siempre intenta obtener: Nombre, Origen (calle, altura, localidad), Destino y qué es lo que hay que llevar.
6. Habla como un asistente de logística argentino: usa "che", "dale", "perfecto", "claro".
7. Al final, dile que Guillermo ya tiene los datos y lo llamará.
`;

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: INSTRUCCIONES_BOT + "\n\nHistorial/Mensaje: " + mensajeUsuario }] 
                }]
            })
        });

        const data = await response.json();
        
        // Verificamos si la IA respondió correctamente
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "Che, se me chispoteó un cable. ¿Me lo repetís más simple? Soy el asistente de Rossetton.";
        }
    } catch (error) {
        return "Disculpame, me distraje un segundo. ¿Qué era lo que necesitabas enviar o retirar?";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Ponemos un mensaje de "escribiendo..." para que sea más real
    const respuestaIA = await hablarConIA(text);
    addMessage(respuestaIA, "bot");
    
    // Mandamos todo a la planilla de Guillermo
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

// El clip de fotos sigue funcionando igual
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
            addMessage("¡Joyita! Ya le pasé la foto a Guillermo.", "bot");
        };
        reader.readAsDataURL(input.files[0]);
    }
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
    setTimeout(() => {
        addMessage("¡Buenas! Soy el asistente virtual de <b>Logística Rossetton</b> 🚚. ¿Qué tenemos que mandar o retirar hoy?", "bot");
    }, 500);
});
