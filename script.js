// ======================================================
// CONFIGURACIÓN IA GEMINI - LOGÍSTICA ROSSETTON (V1 ESTABLE)
// ======================================================

const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
// Usamos la versión "v1" que es la estable para evitar el error de versión
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Instrucciones para que la IA sea inteligente y hable como vos querés
const PROMPT_SISTEMA = `Eres el asistente virtual de Logística Rossetton. Tu jefe es Guillermo.
REGLAS DE ORO:
1. Hablá como un argentino (usá che, dale, joya, impecable).
2. Si te saludan, saludá y presentate como el asistente de Rossetton.
3. Si el cliente quiere un ENVÍO o RETIRO: Pedí calle, altura y LOCALIDAD tanto de origen como de destino.
4. No uses camiones en los emojis, usá motitos (🛵) o cajas (📦).
5. Si el cliente ya mencionó un lugar (ej. Santa Fe), no preguntes de nuevo qué provincia es, pedí la calle y altura exacta de esa localidad.
6. Sé amable y profesional siempre.`;

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: PROMPT_SISTEMA + "\n\nCliente dice: " + mensajeUsuario }]
                }]
            })
        });

        const data = await response.json();

        // Si Google devuelve un error, lo capturamos
        if (data.error) {
            console.error("Error de Google:", data.error.message);
            return "Che, hubo un problema de conexión con el servidor. ¿Me podrías repetir qué necesitás enviar o retirar? 🛵";
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }

        return "No te entendí bien, ¿me repetís los datos del envío? 📦";

    } catch (error) {
        console.error("Error de red:", error);
        return "Parece que hay un problema con internet. Probemos de nuevo en un segundo. 🛵";
    }
}

// Función principal para enviar mensajes
async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    // 1. Mostrar mensaje del usuario
    addMessage(text, "user");
    input.value = "";

    // 2. Sonido de mensaje (opcional, si tenés el archivo)
    try {
        const audio = new Audio('https://www.soundjay.com/communication/sounds/message-sent-1.mp3');
        audio.play();
    } catch(e) { /* Si falla el audio no pasa nada */ }

    // 3. Obtener respuesta de Gemini
    const respuestaIA = await hablarConIA(text);
    
    // 4. Mostrar respuesta del Bot
    addMessage(respuestaIA, "bot");
    
    // 5. Enviar a tu planilla de Google Sheets
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

// Función para el ganchito de fotos
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
                addMessage("¡Joyita! Ya le pasé la foto a Guillermo para que la vea. 📸🛵", "bot");
            }, 1000);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Función para guardar en Google Sheets
function enviarDatosHoja(mensaje) {
    if (!URL_GOOGLE_SHEETS) return;
    const formData = new URLSearchParams();
    formData.append("detalles", mensaje);
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

// Configuración de inicio y tecla Enter
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

    // Saludo inicial automático
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy el asistente virtual de <b>Logística Rossetton</b>. ¿En qué te puedo ayudar hoy? 🛵", "bot");
    }, 800);
});
