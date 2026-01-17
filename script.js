// ======================================================
// CONFIGURACIÓN LOGÍSTICA ROSSETTON - V3.7 (CEREBRO PRIORITARIO)
// ======================================================

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

const sonidoUsuario = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
const sonidoBot = new Audio("https://assets.mixkit.co/active_storage/sfx/1117/1117-preview.mp3");
sonidoUsuario.volume = 0.3;
sonidoBot.volume = 0.3;

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    esIdaVuelta: false
};

// ======================================================
// MOTOR DE INTELIGENCIA
// ======================================================

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

    const regHasta = /(?:hasta|hacia|a la|al|destino|para|llevalo a|entregalo en) ([\w\sÁÉÍÓÚáéíóúñ]+)/i;
    const regDesde = /(?:desde|de|origen|salida|en|buscalo en|retiralo en) ([\w\sÁÉÍÓÚáéíóúñ]+)/i;

    const matchHasta = texto.match(regHasta);
    const matchDesde = texto.match(regDesde);

    if (matchHasta) botEstado.datos.destino = matchHasta[1].trim();
    if (matchDesde) botEstado.datos.origen = matchDesde[1].trim();
}

// ======================================================
// LÓGICA DE CONVERSACIÓN
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    
    // 1. ANALIZAR PRIMERO (Para ver si hay un pedido oculto)
    const teniaDatosAntes = (botEstado.datos.origen !== "" || botEstado.datos.destino !== "");
    analizarMensaje(texto);
    const tieneDatosAhora = (botEstado.datos.origen !== "" || botEstado.datos.destino !== "");

    // 2. DETECTOR DE DESPEDIDA (Solo si NO hay datos nuevos en este mensaje)
    const esSoloDespedida = /^(gracias|listo|eso es todo|nada mas|chau|hasta pronto|no necesito nada mas|ya esta)$/i.test(texto);
    
    if (esSoloDespedida && !tieneDatosAhora) {
        return "¡De nada! Fue un placer ayudarte ❤️. Cualquier otra cosa que necesites, acá voy a estar. ¡Que tengas un excelente día!";
    }

    // 3. DETECTOR DE ELOGIOS
    const elogios = /genio|capo|crack|buenisimo|me encanta|que bueno|excelente|tecnologia|buen bot|amable/i;
    if (elogios.test(texto) && botEstado.paso !== "saludo") {
        return "¡Muchas gracias! ❤️ Trabajo para que el servicio sea cada vez mejor. ¿Querés coordinar algo más o eso sería todo?";
    }

    // Reinicio
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""}, esIdaVuelta: false };
        return "¡Entendido! Reiniciamos. ¿En qué puedo ayudarte ahora?";
    }

    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente de <b>Logística Rossetton</b>. ¿Cómo es tu nombre?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        botEstado.nombreCliente = mensaje.replace(/hola|soy|me llamo/gi, "").trim();
        botEstado.paso = "menu";
        return `¡Mucho gusto, ${botEstado.nombreCliente}! ¿Querés coordinar un <b>Envío</b> o un <b>Retiro</b>? Podés decirme todo el pedido directamente.`;
    }

    // 4. FLUJO DE TRABAJO (Si detectó tipo de pedido)
    if (botEstado.tipo) {
        if (!botEstado.datos.origen) {
            botEstado.paso = "origen";
            return "Entendido. ¿De qué <b>dirección y localidad</b> saldría el pedido?";
        }
        if (!botEstado.datos.destino) {
            botEstado.paso = "destino";
            return `Sale de ${botEstado.datos.origen}. ¿Hacia qué <b>dirección y localidad</b> va?`;
        }
        if (botEstado.tipo === "retiro" && !botEstado.datos.nombre) {
            botEstado.paso = "nombre_quien";
            return "¿A nombre de quién retiramos?";
        }
        if (botEstado.paso !== "finalizar") {
            botEstado.paso = "finalizar";
            let tipoTxt = botEstado.esIdaVuelta ? "IDA Y VUELTA" : botEstado.tipo.toUpperCase();
            return `<b>Resumen:</b> ${tipoTxt} de ${botEstado.datos.origen} a ${botEstado.datos.destino}.<br><br>¿Algún detalle extra? (Teléfonos, quién paga, etc.)`;
        }
    }

    if (botEstado.paso === "finalizar") {
        // Aquí limpiamos el "nada mas" o "eso es todo" del campo detalles si apareciera
        let detallesLimpios = mensaje.replace(/nada mas|eso es todo|listo|gracias/gi, "").trim();
        botEstado.datos.detalles = detallesLimpios + (botEstado.esIdaVuelta ? " [CON RETORNO]" : "");
        
        enviarNotificacion(botEstado.datos);
        const res = generarResumen(botEstado.datos, botEstado.tipo);
        botEstado.paso = "menu"; botEstado.tipo = null;
        return `¡Perfecto! Ya le avisé a Guillermo.<br><br>${res}<br><br>Te contactamos en breve. ¡Muchas gracias por elegirnos! ❤️`;
    }

    return "Lo siento, todavía estoy aprendiendo 🤔. ¿Podrías decirme si necesitas un <b>Envío</b> o <b>Retiro</b>?";
}

// ======================================================
// INTERFAZ Y FUNCIONES AUXILIARES (IGUALES)
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
