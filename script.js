const PROMPT_SISTEMA = 
"Sos el asistente de Logística Rossetton. Hablá como un pibe de Argentina. Si te dicen que quieren mandar algo a Santa Fe, pedí calle y altura de origen y destino. Usá motitos 🛵.";

async function enviarAlServidor(mensajeUsuario) {
    try {
        const respuesta = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: PROMPT_SISTEMA + "\n\nCliente: " + mensajeUsuario
            })
        });

        const data = await respuesta.json();

        if (data.error) {
            return "ERROR DEL SERVIDOR: " + data.error;
        }

        return data.reply;

    } catch (e) {
        return "ERROR DE CONEXIÓN: Revisá tu internet.";
    }
}

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const respuestaIA = await enviarAlServidor(text);
    addMessage(respuestaIA, "bot");
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", (e) => { 
        if (e.key === "Enter") sendMessage(); 
    });
});
