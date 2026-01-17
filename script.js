// ======================================================
// CONFIGURACIÓN IA GEMINI - LOGÍSTICA ROSSETTON (VERSIÓN CONVERSACIONAL)
// ======================================================

const GEMINI_API_KEY = "AIzaSyCX8-AZznolXp-Ftv8PrSNALBgyFUHEmAc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// INSTRUCCIONES DE PERSONALIDAD (Aquí le damos el "alma")
const INSTRUCCIONES_BOT = `
Eres el Asistente Virtual de Logística Rossetton (el negocio de Guillermo). 
Tu misión es conversar con el cliente de forma natural, como una persona real de Argentina.

REGLAS DE CONVERSACIÓN:
1. Si te dicen "Hola" o "Buen día", responde con calidez: "¡Buen día! ¿Cómo estás? Soy el asistente de Rossetton, ¿en qué te puedo ayudar hoy?".
2. Tu objetivo es detectar si quieren un ENVÍO (llevar algo) o un RETIRO (buscar algo).
3. NO seas un robot rígido. Si el cliente te dice "quiero mandar algo a Santa Fe", dile: "¡Dale, impecable! Yo te tomo los datos. ¿Desde qué dirección saldría acá en la zona y a qué parte de Santa Fe lo enviamos?".
4. Debes obtener: Nombre del cliente, Origen, Destino y qué es el paquete.
5. Usa un lenguaje amigable y cercano (usa "che", "viste", "listo", "avisame").
6. Una vez que tengas los datos básicos, confirma que Guillermo ya está al tanto.

IMPORTANTE: Mantén la charla fluida. Si falta un dato, pídelo en la conversación, no hagas un formulario.
`;

async function hablarConIA(mensajeUsuario) {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user",
                    parts: [{ text: INSTRUCCIONES_BOT + "\n\nCliente dice: " + mensajeUsuario }] 
                }],
                generationConfig: {
                    temperature: 0.7, // Le da más "chispa" y variedad al hablar
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200,
                }
            })
        });

        const data = await response.json();
        
        // Verificamos la estructura de respuesta de Google
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "¡Hola! Perdón, me distraje un segundo. ¿Me decías que necesitabas un envío o un retiro? 😊";
        }
    } catch (error) {
        console.error("Error Gemini:", error);
        return "¡Buen día! Acá estoy. Contame, ¿qué es lo que necesitás mandar o retirar?";
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
    
    // Guardamos en la planilla para que Guillermo no pierda nada
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
    
    // Saludo inicial más humano
    setTimeout(() => {
        addMessage("¡Hola! 👋 Soy el asistente virtual de <b>Logística Rossetton</b>. ¿Cómo va todo? ¿En qué te puedo dar una mano hoy?", "bot");
    }, 500);
});
