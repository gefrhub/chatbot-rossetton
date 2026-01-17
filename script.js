const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Instrucciones precisas (Sin camiones, solo motos y utilitarios)
const PROMPT_SISTEMA = "Sos el asistente de Logística Rossetton. Tu jefe es Guillermo. REGLAS: 1. Hablá como un pibe de acá (usá che, dale, joya). 2. Si te dicen que quieren mandar algo, pedí calle y localidad de origen y destino. 3. No uses emojis de camiones, usá motitos (🛵) o cajas (📦). 4. Si el cliente ya mencionó un lugar (ej. Santa Fe), no se lo vuelvas a preguntar, pedile la dirección exacta de ese lugar. 5. Sé proactivo y amable.";

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: PROMPT_SISTEMA + "\n\nCliente: " + mensajeUsuario }] }]
            })
        });
        const data = await response.json();
        if (data.candidates) return data.candidates[0].content.parts[0].text;
        return "¡Uy! Se me cortó el cable. ¿Me repetís la dirección y localidad de entrega? 🛵";
    } catch (e) {
        return "Che, estoy con poca señal. ¿A qué dirección y localidad exacta mandamos la moto? 🛵";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    
    // Sonido de enviado
    const audio = new Audio('https://www.soundjay.com/communication/sounds/message-sent-1.mp3');
    audio.play();

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
            addMessage("¡Recibido! 📸 Ya le mandé la foto a Guillermo. 🛵", "bot");
        };
        reader.readAsDataURL(input.files[0]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});
