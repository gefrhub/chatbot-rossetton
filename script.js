// ======================================================
// CONFIGURACIÓN CEREBRO AVANZADO
// ======================================================

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    esIdaVuelta: false
};

// ======================================================
// MOTOR DE EXTRACCIÓN DINÁMICA
// ======================================================

function analizarFrase(texto) {
    // 1. Detectar Intención Completa
    const tieneLlevar = /llevar|mandar|envia|enviro|alcanzar|dejar/i.test(texto);
    const tieneTraer = /traer|traigan|busquen|busc|retirar/i.test(texto);
    
    if (tieneLlevar && tieneTraer) {
        botEstado.esIdaVuelta = true;
        botEstado.tipo = "envio"; 
    } else if (tieneTraer) {
        botEstado.tipo = "retiro";
    } else if (tieneLlevar) {
        botEstado.tipo = "envio";
    }

    // 2. Extraer Origen (Desde donde sale)
    // Busca después de: desde, de, buscalo en, retiro en, sale de
    const regOrigen = /(?:desde|buscalo en|retiralo en|sale de|en el|en la) ([\w\s]+?)(?=\s+(?:hasta|hacia|a la|al |para|y me)|$)/i;
    const matchOri = texto.match(regOrigen);
    if (matchOri && !botEstado.datos.origen) botEstado.datos.origen = matchOri[1].trim();

    // 3. Extraer Destino (Hacia donde va)
    // Busca después de: hasta, hacia, a la, al, traelo a, traeme a
    const regDestino = /(?:hasta|hacia|traelo a|traeme a|entrega en|a la|al |destino) ([\w\s]+?)(?=\s+(?:y|con|desde)|$)/i;
    const matchDes = texto.match(regDestino);
    if (matchDes && !botEstado.datos.destino) botEstado.datos.destino = matchDes[1].trim();
    
    // 4. Si dice "mi casa" o "mi trabajo", lo anotamos tal cual
    if (texto.includes("mi casa")) botEstado.datos.destino = "Mi casa";
    if (texto.includes("mi trabajo")) botEstado.datos.destino = "Mi trabajo";
}

// ======================================================
// LÓGICA DE CONVERSACIÓN HUMANA
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    const linkWA = `<a href="https://wa.me/5493426396085" target="_blank" style="color: #1e88e5; font-weight: bold; text-decoration: underline;">WhatsApp</a>`;
    
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""}, esIdaVuelta: false };
        return "¡Listo! Empezamos de cero. ¿Qué necesitás?";
    }

    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente de <b>Logística Rossetton</b>. ¿Con quién hablo?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        botEstado.nombreCliente = mensaje.replace(/hola|soy|me llamo/gi, "").trim();
        botEstado.paso = "menu";
        return `¡Gusto, ${botEstado.nombreCliente}! ¿Qué servicio necesitás? (Podés contarme todo el pedido de una).`;
    }

    // ANALIZAMOS EL MENSAJE EN CUALQUIER MOMENTO
    analizarFrase(texto);

    // DETERMINAR QUÉ PREGUNTAR SEGÚN LO QUE FALTA
    if (botEstado.tipo) {
        if (!botEstado.datos.origen) {
            botEstado.paso = "origen";
            return "Entendido. ¿De qué <b>dirección o lugar</b> saldría el pedido?";
        }
        if (!botEstado.datos.destino) {
            botEstado.paso = "destino";
            return `Perfecto, ya sé que sale de ${botEstado.datos.origen}. ¿A qué <b>dirección o lugar</b> lo llevamos?`;
        }
        if (botEstado.tipo === "retiro" && !botEstado.datos.nombre) {
            botEstado.paso = "nombre_quien";
            return "¿A <b>nombre de quién</b> retiramos?";
        }
        if (botEstado.paso !== "detalles_finales") {
            botEstado.paso = "detalles_finales";
            let resumenPrevio = `<b>Resumen:</b> ${botEstado.tipo.toUpperCase()} desde ${botEstado.datos.origen} hasta ${botEstado.datos.destino}.`;
            return `${resumenPrevio}<br><br>¿Algún <b>detalle extra</b>? (Teléfonos, si hay que cobrar, piso/depto, etc.)`;
        }
    }

    if (botEstado.paso === "detalles_finales") {
        botEstado.datos.detalles = mensaje + (botEstado.esIdaVuelta ? " [IDA Y VUELTA]" : "");
        enviarNotificacion(botEstado.datos);
        const res = generarResumen(botEstado.datos, botEstado.tipo);
        botEstado.paso = "menu"; botEstado.tipo = null;
        return `¡Excelente! Ya le pasé todo a Guillermo.<br><br>${res}<br><br>Te contactamos en breve. ¡Gracias! ❤️`;
    }

    if (/precio|cuanto|costo/i.test(texto)) return "Los precios dependen del viaje. Si me das las direcciones, te cotizamos.";

    return "No estoy seguro de entender 🤔. ¿Es un <b>Envío</b> o un <b>Retiro</b>? (O escribí 'cancelar')";
}

// ======================================================
// ENVÍO Y MOTOR (MANTENER SIEMPRE)
// ======================================================

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

function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";
    setTimeout(() => { addMessage(responderBot(text), "bot"); }, 500);
}

function addMessage(text, sender) {
    const chatBox = document.getElementById("chat-box");
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
