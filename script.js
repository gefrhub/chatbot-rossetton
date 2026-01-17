// ======================================================
// CONFIGURACIÓN LOGÍSTICA ROSSETTON - V3.5 (INTELIGENCIA Y EMPATÍA)
// ======================================================

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Sonidos
const sonidoUsuario = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
const sonidoBot = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
sonidoUsuario.volume = 0.4;
sonidoBot.volume = 0.4;

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    esIdaVuelta: false
};

// ======================================================
// MOTOR DE INTELIGENCIA Y ASOCIACIÓN
// ======================================================

function analizarMensaje(texto) {
    // 1. Detección de Tipo (Sinónimos y sin acentos)
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

    // 2. Asociación de Direcciones (Mejorada con más conectores)
    const regHasta = /(?:hasta|hacia|a la|al|destino|para|llevalo a|entregalo en|que sea en) ([\w\sÁÉÍÓÚáéíóúñ]+)/i;
    const regDesde = /(?:desde|de|origen|salida|en|buscalo en|retiralo en|estoy en) ([\w\sÁÉÍÓÚáéíóúñ]+)/i;

    const matchHasta = texto.match(regHasta);
    const matchDesde = texto.match(regDesde);

    if (matchHasta) botEstado.datos.destino = matchHasta[1].trim();
    if (matchDesde) botEstado.datos.origen = matchDesde[1].trim();

    // 3. Palabras clave de lugares comunes
    const lugaresComunes = ["mi casa", "mi trabajo", "el centro", "el puerto", "la oficina", "el negocio", "la clinica", "el hospital"];
    lugaresComunes.forEach(lugar => {
        if (texto.includes(lugar)) {
            if (texto.includes("hasta") || texto.includes(" a ") || texto.includes("al ")) botEstado.datos.destino = lugar;
            else if (texto.includes("desde") || texto.includes(" de ") || texto.includes("en ")) botEstado.datos.origen = lugar;
        }
    });
}

// ======================================================
// LÓGICA DE CONVERSACIÓN
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    
    // --- DETECTOR DE ELOGIOS Y BUENA ONDA ---
    const elogios = /genio|capo|crack|buenisimo|me encanta|que bueno|excelente|tecnologia|buen bot|amable|gracias|felicitaciones/i;
    if (elogios.test(texto) && botEstado.paso !== "saludo") {
        return "¡Muchas gracias! ❤️ Me encanta que te guste el sistema. Cada día aprendo más para que tu experiencia con <b>Logística Rossetton</b> sea la mejor. ¿En qué te puedo ayudar ahora?";
    }

    // Reinicio
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""}, esIdaVuelta: false };
        return "¡Reiniciado! ¿Qué necesitás hoy, " + botEstado.nombreCliente + "?";
    }

    // Saludo
    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente de <b>Logística Rossetton</b>. ¿Cómo es tu nombre?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        botEstado.nombreCliente = mensaje.replace(/hola|soy|me llamo/gi, "").trim();
        botEstado.paso = "menu";
        return `¡Mucho gusto, ${botEstado.nombreCliente}! ¿Querés coordinar un <b>Envío</b> o un <b>Retiro</b>? (Podés contarme todo el pedido de una).`;
    }

    analizarMensaje(texto);

    if (botEstado.tipo) {
        if (!botEstado.datos.origen) {
            botEstado.paso = "origen";
            return "Entendido. ¿De qué <b>dirección y localidad</b> saldría el pedido?";
        }

        if (!botEstado.datos.destino) {
            botEstado.paso = "destino";
            return `Anotado: sale de ${botEstado.datos.origen}. ¿Hacia qué <b>dirección y localidad</b> va?`;
        }

        if (botEstado.tipo === "retiro" && !botEstado.datos.nombre) {
            botEstado.paso = "nombre_quien";
            return "¿A nombre de quién retiramos?";
        }

        if (botEstado.paso !== "finalizar") {
            botEstado.paso = "finalizar";
            let tipoTxt = botEstado.esIdaVuelta ? "IDA Y VUELTA" : botEstado.tipo.toUpperCase();
            return `<b>Resumen:</b> ${tipoTxt} de ${botEstado.datos.origen} a ${botEstado.datos.destino}.<br><br>¿Algún detalle extra? (Teléfonos, quién paga, si hay que cobrar, etc.)`;
        }
    }

    if (botEstado.paso === "finalizar") {
        botEstado.datos.detalles = mensaje + (botEstado.esIdaVuelta ? " [CON RETORNO]" : "");
        enviarNotificacion(botEstado.datos);
        const res = generarResumen(botEstado.datos, botEstado.tipo);
        botEstado.paso = "menu"; botEstado.tipo = null;
        return `¡Perfecto! Ya agendé todo.<br><br>${res}<br><br>Guillermo ya recibió el aviso y te contactará pronto. ¡Muchas gracias! ❤️`;
    }

    return "Lo siento, soy un bot en aprendizaje y todavía no entiendo esa frase 🤔. ¿Podrías decirme si es un <b>Envío</b> o <b>Retiro</b> o darme más detalles?";
}

// ======================================================
// INTERFAZ Y SONIDO
// ======================================================

function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    sonidoUsuario.play().catch(e => {});
    addMessage(text, "user");
    input.value = "";

    setTimeout(() => {
        const respuesta = responderBot(text);
        sonidoBot.play().catch(e => {});
        addMessage(respuesta, "bot");
    }, 800);
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function enviarNotificacion(datosFinales) {
    if (!URL_GOOGLE_SHEETS || URL_GOOGLE_SHEETS.includes("TU_URL")) return;
    const formData = new URLSearchParams();
    formData.append("nombre", botEstado.nombreCliente);
    formData.append("tipo", botEstado.tipo + (botEstado.esIdaVuelta ? " + RETORNO" : ""));
    formData.append("origen", datosFinales.origen);
    formData.append("destino", datosFinales.destino);
    formData.append("detalles", datosFinales.detalles);
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

function generarResumen(datos, tipo) {
    let t = botEstado.esIdaVuelta ? "IDA Y VUELTA" : tipo.toUpperCase();
    return `📦 <b>${t}</b><br>🟦 DE: ${datos.origen}<br>🟩 A: ${datos.destino}<br>📝 INFO: ${datos.detalles}`;
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { addMessage(responderBot("hola"), "bot"); }, 1000);
    const input = document.getElementById("user-input");
    if(input) input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});
