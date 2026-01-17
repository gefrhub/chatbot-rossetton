// ======================================================
// CONFIGURACIÓN INTELIGENTE
// ======================================================

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

const localidadesCercanas = ["santo tomé", "santa fe", "sauce viejo", "rincón", "colastiné", "recreo"];

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    saludoEnviado: false
};

// ======================================================
// FUNCIONES DE APOYO Y NOTIFICACIÓN
// ======================================================

function enviarNotificacion(datosFinales) {
    if (!URL_GOOGLE_SHEETS || URL_GOOGLE_SHEETS.includes("TU_URL")) return;

    const formData = new URLSearchParams();
    formData.append("nombre", botEstado.nombreCliente);
    formData.append("tipo", botEstado.tipo);
    formData.append("origen", datosFinales.origen || "");
    formData.append("destino", datosFinales.destino || "");
    formData.append("detalles", datosFinales.detalles || (datosFinales.nombre ? "Retira: " + datosFinales.nombre : ""));

    fetch(URL_GOOGLE_SHEETS, {
        method: 'POST',
        mode: 'no-cors',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
    })
    .then(() => console.log("Datos enviados correctamente"))
    .catch(err => console.error("Error al enviar:", err));
}

function generarResumen(datos, tipo) {
    if (tipo === "envio") {
        return `📦 <b>RESERVA DE ENVÍO</b><br>🟦 ORIGEN: ${datos.origen}<br>🟩 DESTINO: ${datos.destino}<br>📝 DETALLES: ${datos.detalles}`;
    } else {
        return `📦 <b>RESERVA DE RETIRO</b><br>👤 RETIRA: ${datos.nombre}<br>🟦 ORIGEN: ${datos.origen}<br>🟩 DESTINO: ${datos.destino}<br>📝 DETALLES: ${datos.detalles}`;
    }
}

function extraerInformacion(texto) {
    localidadesCercanas.forEach(loc => {
        if (texto.includes(loc)) {
            if (!botEstado.datos.origen) {
                botEstado.datos.origen = texto;
            } else if (!botEstado.datos.destino) {
                botEstado.datos.destino = texto;
            }
        }
    });

    if (/envio|enviar|enbiar|llevar|manda|mandar|transpor/i.test(texto)) botEstado.tipo = "envio";
    if (/retiro|retirar|busqu|busc|traer|traigan/i.test(texto)) botEstado.tipo = "retiro";
}

// ======================================================
// LÓGICA CON "CHISPA"
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    const linkWA = `<a href="https://wa.me/5493426396085" target="_blank" style="color: #1e88e5; font-weight: bold; text-decoration: underline;">WhatsApp de Guillermo</a>`;
    
    let cortesia = "";
    if (/gracias|agradezco|por favor|porfa|amable/i.test(texto)) {
        cortesia = "¡Muchas gracias a vos por tu amabilidad! ❤️ ";
    }

    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""} };
        return `¡Entendido! Reiniciamos todo. ¿En qué puedo ayudarte ahora, ${botEstado.nombreCliente}?`;
    }

    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente virtual de <b>Logística Rossetton</b>. ¿Con quién tengo el gusto de hablar?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        botEstado.nombreCliente = mensaje.replace(/hola|soy|me llamo|mi nombre es/gi, "").trim();
        botEstado.paso = "menu";
        return `¡Mucho gusto, ${botEstado.nombreCliente}! Es un placer. Decime, ¿querés coordinar un <b>Envío</b>, un <b>Retiro</b> o tenés alguna <b>Consulta</b>?`;
    }

    if (botEstado.paso === "menu" || botEstado.paso === "consulta_abierta") {
        extraerInformacion(texto);

        if (botEstado.tipo === "envio") {
            botEstado.paso = "origen";
            if (botEstado.datos.origen) {
                botEstado.paso = "destino";
                return cortesia + `¡Perfecto! Ya tomé nota del origen. Ahora, ¿hacia qué <b>destino</b> lo llevamos?`;
            }
            return cortesia + "¿Me dirías la dirección y localidad de <b>origen</b> para el envío?";
        }

        if (botEstado.tipo === "retiro") {
            botEstado.paso = "origen"; // En retiro, el origen es donde pasamos a buscar
            return cortesia + "Genial, nos encargamos del retiro. ¿Por dónde tendríamos que <b>pasar a buscarlo</b>?";
        }

        if (/precio|cuanto|costo|sale|valor/i.test(texto)) {
            return "Los precios varían según la distancia. Si me pasás las direcciones (escribí 'envío'), te damos el costo exacto ahora mismo.";
        }
        
        if (botEstado.paso === "consulta_abierta") {
             return "No estoy seguro de entender, pero Guillermo puede asesorarte mejor. ¿Querés dejar los datos del envío o preferís hablar con él? " + linkWA;
        }
    }

    // --- RECOLECCIÓN DE DATOS ---
    if (botEstado.tipo === "envio" || botEstado.tipo === "retiro") {
        if (botEstado.paso === "origen") {
            botEstado.datos.origen = mensaje;
            botEstado.paso = "destino";
            return "¡Excelente! ¿Y cuál es el <b>destino</b> o punto de entrega?";
        }
        
        if (botEstado.paso === "destino") {
            botEstado.datos.destino = mensaje;
            if (botEstado.tipo === "retiro") {
                botEstado.paso = "nombre_quien";
                return "Anotado. ¿A <b>nombre de quién</b> retiramos?";
            }
            botEstado.paso = "detalles";
            return "¡Ya casi estamos! ¿Algún detalle final? (Teléfonos, si es cobrar o pagar, piso, dpto, etc.)";
        }

        if (botEstado.paso === "nombre_quien") {
            botEstado.datos.nombre = mensaje;
            botEstado.paso = "detalles";
            return "Perfecto. ¿Alguna instrucción extra o teléfonos de contacto?";
        }

        if (botEstado.paso === "detalles") {
            botEstado.datos.detalles = mensaje;
            enviarNotificacion(botEstado.datos);
            const resumen = generarResumen(botEstado.datos, botEstado.tipo);
            botEstado.paso = "menu";
            botEstado.tipo = null;
            return `¡Buenísimo! He recibido toda la información correctamente.<br><br>${resumen}<br><br><b>Guillermo ya tiene tu pedido</b> y te escribirá a la brevedad. ¡Gracias por confiar en nosotros! ❤️`;
        }
    }

    botEstado.paso = "consulta_abierta";
    return "Disculpame, me perdí un poquito. ❤️ ¿Podrías decirme si necesitas un Envío o un Retiro? O escribe 'cancelar' para empezar de nuevo.";
}

// ======================================================
// INTERFAZ (BOTÓN Y CHAT)
// ======================================================

function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    setTimeout(() => {
        const respuesta = responderBot(text);
        addMessage(respuesta, "bot");
    }, 500);
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
    if(input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
