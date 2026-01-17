const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// ACÁ GUARDAMOS LA MEMORIA DE LA CHARLA
let historialChat = [
    {
        role: "user",
        parts: [{ text: "Eres el asistente de Logística Rossetton. Tu jefe es Guillermo. Debes ser amable, usar modismos argentinos y coordinar envíos o retiros. No eres un bot tonto, eres una IA avanzada. Si te saludan, saluda. Si te piden un envío, pide direccion y localidad de origen y destino de forma natural, si te piden un retiro igual, pide informacion de la localidad y direccion donde hay que retirar Y si te dicen que solo quieren hacer una consuta o averiguar algo preguntales que es con respeto siempre." }]
    },
    {
        role: "model",
        parts: [{ text: "¡Entendido! Soy el asistente de Logística Rossetton y estoy listo para ayudar a los clientes de Guillermo con onda y eficiencia." }]
    }
];

async function hablarConIA(mensajeUsuario) {
    // Agregamos lo que dijo el usuario a la memoria
    historialChat.push({
        role: "user",
        parts: [{ text: mensajeUsuario }]
    });

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: historialChat })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const respuestaTexto = data.candidates[0].content.parts[0].text;
            
            // Guardamos lo que respondió la IA en la memoria para que no se olvide
            historialChat.push({
                role: "model",
                parts: [{ text: respuestaTexto }]
            });

            return respuestaTexto;
        } else {
            return "Che, me perdí un toque. ¿Me repetís? Soy un bot y estoy aprendiendo, disculpame.";
        }
    } catch (error) {
        return "¡Hola! Estoy atendiendo bastantes pedidos de entregas pero decime, ¿qué necesitás mandar o retirar?";
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
    
    // Notificamos a la planilla de Guillermo
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
});
