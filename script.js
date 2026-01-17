// ======================================================
// CONFIGURACIÓN INTELIGENTE MEJORADA
// ======================================================

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

const localidadesCercanas = ["santo tomé", "santa fe", "sauce viejo", "rincón", "colastiné", "recreo", "esperanza", "paraná"];
const lugaresDestino = ["casa", "trabajo", "oficina", "ministerio", "hospital", "clínica", "sanatorio", "local", "edificio", "centro", "puerto", "dirección", "dire"];

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    esIdaVuelta: false
};

// ======================================================
// MOTOR DE INTELIGENCIA (EXTRACCIÓN AVANZADA)
// ======================================================

function extraerInformacion(texto) {
    // 1. Detectar Intención de Ida y Vuelta (Retorno)
    const palabrasLlevar = /llevar|mandar|envia|enviro|alcanzar/i;
    const palabrasTraer = /traer|traigan|busquen|busc|buscá|retirar|traer/i;
    
    if (palabrasLlevar.test(texto) && palabrasTraer.test(texto)) {
        botEstado.esIdaVuelta = true;
        botEstado.tipo = "envio"; // Lo manejamos como envío pero con aviso de retorno
    } else if (palabrasTraer.test(texto)) {
        botEstado.tipo = "retiro";
    } else if (palabrasLlevar.test(texto)) {
        botEstado.tipo = "envio";
    }

    // 2. Detectar Destino con conectores (A, HACIA, HASTA)
    // Ejemplo: "hacia Santa Fe" o "a la casa de mi vieja"
    const regexDestino = /(?:hacia|hasta| a |destino|para|llevalo a) (.+)/i;
    const matchDestino = texto.match(regexDestino);
    if (matchDestino) {
        botEstado.datos.destino = matchDestino[1].trim();
    }

    // 3. Detectar Origen con conectores (DESDE, DE, BUSCAR EN)
    const regexOrigen = /(?:desde| de |origen|buscalo en|retiralo en) (.+)/i;
    const matchOrigen = texto.match(regexOrigen);
    if (matchOrigen) {
        botEstado.datos.origen = matchOrigen[1].trim();
    }

    // 4. Si solo puso una localidad y no tenemos nada, intentamos ubicarla
    localidadesCercanas.forEach(loc => {
        if (texto.includes(loc)) {
            if (!botEstado.datos.destino && (texto.includes(" a ") || texto.includes("hasta"))) {
                botEstado.datos.destino = texto;
            } else if (!botEstado.datos.origen) {
                botEstado.datos.origen = texto;
            }
        }
    });
}

// ======================================================
// LÓGICA CON "CHISPA" MEJORADA
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    const linkWA = `<a href="https://wa.me/5493426396085" target="_blank" style="color: #1e88e5; font-weight: bold;">WhatsApp de Guillermo</a>`;
    
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""}, esIdaVuelta: false };
        return `¡Reiniciamos! ¿Qué necesitas ahora, ${botEstado.nombreCliente}?`;
    }

    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente virtual de <b>Logística Rossetton</b>. ¿Con quién hablo?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        botEstado.nombreCliente = mensaje.replace(/hola|soy|me llamo|mi nombre es/gi, "").trim();
        botEstado.paso = "menu";
        return `¡Gusto en conocerte, ${botEstado.nombreCliente}! ¿Querés hacer un <b>Envío</b>, un <b>Retiro</b> o una <b>Consulta</b>? Podés escribirme directamente lo que necesitás.`;
    }

    if (botEstado.paso === "menu" || botEstado.paso === "consulta_abierta") {
        extraerInformacion(texto);

        if (botEstado.tipo) {
            let respuesta = botEstado.esIdaVuelta ? "<b>¡Entendido! Es un servicio con retorno (ida y vuelta).</b> " : "<b>¡Perfecto! Ya capté la idea.</b> ";
            
            // Validar si falta calle/altura cuando solo dan localidad
            const soloLocalidad = localidadesCercanas.some(loc => texto === loc);
            if (soloLocalidad) {
                respuesta += "Veo la localidad, ¿pero me podrías decir la <b>calle y altura</b> exacta?";
                return respuesta;
            }

            if (!botEstado.datos.origen) {
                botEstado.paso = "origen";
                return respuesta + "¿De qué dirección y localidad saldría el pedido?";
            }
            if (!botEstado.datos.destino) {
                botEstado.paso = "destino";
                return respuesta + "¿Y a qué dirección y localidad lo llevamos?";
            }
            
            botEstado.paso = "detalles";
            return respuesta + "Ya tengo las direcciones. ¿Algún detalle extra o teléfonos? (Piso, dpto, quién paga, etc.)";
        }

        if (/precio|cuanto|costo|valor/i.test(texto)) return "Los costos dependen de la distancia. Pasame las direcciones y te digo.";
        
        botEstado.paso = "consulta_abierta";
        return "No estoy seguro, pero Guillermo te ayuda enseguida. ¿Querés completar los datos del envío o hablar con él? " + linkWA;
    }

    // --- RECOLECCIÓN RESTANTE ---
    if (botEstado.tipo) {
        if (botEstado.paso === "origen") {
            botEstado.datos.origen = mensaje;
            botEstado.paso = "destino";
            return "¡Excelente! ¿Y el <b>destino</b> (dirección y localidad)?";
        }
        
        if (botEstado.paso === "destino") {
            botEstado.datos.destino = mensaje;
            botEstado.paso = botEstado.tipo === "retiro" ? "nombre_quien" : "detalles";
            return botEstado.paso === "nombre_quien" ? "¿A nombre de quién retiramos?" : "¿Detalles finales o teléfonos?";
        }

        if (botEstado.paso === "nombre_quien") {
            botEstado.datos.nombre = mensaje;
            botEstado.paso = "detalles";
            return "Perfecto. ¿Alguna instrucción extra o teléfonos?";
        }

        if (botEstado.paso === "detalles") {
            botEstado.datos.detalles = mensaje + (botEstado.esIdaVuelta ? " (PEDIDO CON RETORNO)" : "");
            enviarNotificacion(botEstado.datos);
            const resumen = generarResumen(botEstado.datos, botEstado.tipo);
            botEstado.paso = "menu";
            botEstado.tipo = null;
            return `¡Listo! Guillermo ya recibió todo.<br><br>${resumen}<br><br><b>Te escribiremos al toque.</b> ¡Gracias! ❤️`;
        }
    }

    return "No te entendí bien, perdón ❤️ ¿Necesitás un Envío o Retiro? (Escribí 'cancelar' para reempezar)";
}

// ======================================================
// FUNCIONES DE INTERFAZ Y ENVÍO (MANTENER IGUAL)
// ======================================================

function enviarNotificacion(datosFinales) {
    if (!URL_GOOGLE_SHEETS || URL_GOOGLE_SHEETS.includes("TU_URL")) return;
    const formData = new URLSearchParams();
    formData.append("nombre", botEstado.nombreCliente);
    formData.append("tipo", botEstado.tipo + (botEstado.esIdaVuelta ? " + RETORNO" : ""));
    formData.append("origen", datosFinales.origen || "");
    formData.append("destino", datosFinales.destino || "");
    formData.append("detalles", datosFinales.detalles || "");
    fetch(URL_GOOGLE_SHEETS, { method: 'POST', mode: 'no-cors', body: formData.toString() });
}

function generarResumen(datos, tipo) {
    let titulo = botEstado.esIdaVuelta ? "ENVÍO CON RETORNO" : (tipo === "envio" ? "ENVÍO" : "RETIRO");
    return `📦 <b>${titulo}</b><br>🟦 ORIGEN: ${datos.origen}<br>🟩 DESTINO: ${datos.destino}<br>📝 DETALLES: ${datos.detalles}`;
}

function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (text === "") return;
    addMessage(text, "user");
    input.value = "";
    setTimeout(() => { addMessage(responderBot(text), "bot"); }, 500);
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { addMessage(responderBot("hola"), "bot"); }, 500);
    const input = document.getElementById("user-input");
    if(input) input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
});
