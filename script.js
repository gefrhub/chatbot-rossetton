const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Instrucciones ultra detalladas para que no sea "tonto"
const PROMPT_SISTEMA = "Sos el asistente humano de Logística Rossetton. Hablás como un argentino (usá che, dale, joya). Tu objetivo es sacar estos datos: 1. Nombre del cliente, 2. Dirección y Localidad de origen, 3. Dirección y Localidad de destino. Si el cliente dice que quiere mandar algo, decile '¡Dale, impecable! Pasame la calle y la localidad de donde sale y a dónde va así te cotizo'. No repitas siempre lo mismo, mantené una charla real.";

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user", // Esto es CLAVE para que Google no rechace el mensaje
                    parts: [{ text: PROMPT_SISTEMA + "\n\nCliente dice: " + mensajeUsuario }]
                }]
            })
        });

        const data = await response.json();
        
        // Si Google nos da una respuesta válida
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } 
        
        // Si hay un error de Google (como que se bloqueó el mensaje)
        console.log("Error de la IA:", data);
        return "¡Dale! Soy el asistente de Rossetton. Justo se me cortó el wifi un toque, pero decime: ¿Desde qué calle y localidad saldría el envío y a dónde lo llevamos?";

    } catch (error) {
        return "¡Buenas! Soy el asistente de Guillermo. Decime qué necesitás mandar y a dónde (calle y localidad), así te ayudo rápido.";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Llamamos a la IA
    const respuestaIA = await hablarConIA(text);
    addMessage(respuestaIA, "bot");
    
    // Guardamos en tu planilla
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
    
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy el asistente de <b>Logística Rossetton</b>. ¿Qué envío o retiro tenemos para hoy?", "bot");
    }, 500);
});
