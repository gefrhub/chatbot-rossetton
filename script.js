const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

const sonidoUsuario = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
const sonidoBot = new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3");
sonidoUsuario.volume = 0.3;
sonidoBot.volume = 0.2;

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    esIdaVuelta: false
};

function analizarMensaje(texto) {
    const envioKeywords = /envio|enviara|mandar|llevar|alcanzar|dejar|lleven|manden|lleve/i;
    const retiroKeywords = /retiro|retirar|traer|busquen|busc|traigan|buscame|traeme/i;

    if (envioKeywords.test(texto) && retiroKeywords.test(texto)) {
        botEstado.esIdaVuelta = true;
        botEstado.tipo = "envio";
    } else if (retiroKeywords.test(texto)) {
        botEstado.tipo = "retiro";
    } else if (envioKeywords.test(texto)) {
        botEstado.tipo = "envio";
    }

    const regHasta = /(?:hasta|hacia|a la|al|destino|para|llevalo a|entregalo en) ([\w\sÁÉÍÓÚáéíóúñ0-9]+)/i;
    const regDesde = /(?:desde|de|origen|salida|en|buscalo en|retiralo en) ([\w\sÁÉÍÓÚáéíóúñ0-9]+)/i;

    const matchHasta = texto.match(regHasta);
    const matchDesde = texto.match(regDesde);

    if (matchHasta) botEstado.datos.destino = matchHasta[1].trim();
    if (matchDesde) botEstado.datos.origen = matchDesde[1].trim();
}

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    analizarMensaje(texto);

    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""}, esIdaVuelta: false };
        return "¡Entendido! Reiniciamos. ¿En qué puedo ayudarte?";
    }

    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente de <b>Logística Rossetton</b>. ¿Cómo es tu nombre?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        botEstado.nombreCliente = mensaje.trim();
        botEstado.paso = "menu";
        return `¡Mucho gusto, ${botEstado.nombreCliente}! ¿Querés coordinar un <b>Envío</b> o un <b>Retiro</b>?`;
    }

    if (botEstado.tipo) {
        if (!botEstado.datos.origen) {
            botEstado.paso = "origen";
            return "¿De qué dirección saldría el pedido?";
        }
        if (!botEstado.datos.destino) {
            botEstado.paso = "destino";
            return `¿A qué dirección lo llevamos?`;
        }
        if (botEstado.paso !== "finalizar") {
            botEstado.paso = "finalizar";
            return `<b>Resumen:</b> De ${botEstado.datos.origen} a ${botEstado.datos.destino}. ¿Algún detalle extra?`;
        }
    }

    if (botEstado.paso === "finalizar") {
        botEstado.datos.detalles = mensaje;
        enviarNotificacion(botEstado.datos);
        botEstado.paso = "menu";
        return `¡Perfecto! Ya le avisé a Guillermo. Te contactamos en breve. ¡Muchas gracias! ❤️`;
    }

    return "Podés decirme si necesitas un <b>Envío</b> o <b>Retiro</b>.";
}

function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";
    setTimeout(() => {
        addMessage(responderBot(text), "bot");
    }, 800);
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// FUNCIÓN PARA EL CLIP DE FOTOS
function subirFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Mostrar la imagen en el chat
            const chatBox = document.getElementById("chat-box");
            const msg = document.createElement("div");
            msg.className = "message user";
            msg.innerHTML = `<img src="${e.target.result}">`;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;

            // Respuesta del bot
            setTimeout(() => {
                addMessage("¡Imagen recibida! 📸 Ya se la envié a Guillermo para que la vea.", "bot");
                sonidoBot.play().catch(e => {});
            }, 1000);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function enviarNotificacion(datosFinales) {
    if (!URL_GOOGLE_SHEETS) return;
    const formData = new URLSearchParams();
    formData.append("nombre", botEstado.nombreCliente);
    formData.append("origen", datosFinales.origen);
    formData.append("destino", datosFinales.destino);
    formData.append("detalles", datosFinales.detalles);
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { addMessage(responderBot("hola"), "bot"); }, 1000);
    const input = document.getElementById("user-input");
    if(input) input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});
