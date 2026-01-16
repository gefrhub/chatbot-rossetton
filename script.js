// ======================================================
// CONFIGURACIÓN Y ESTADO
// ======================================================

// URL de tu Google Apps Script (Actualizada)
const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: {},
    saludoEnviado: false
};

const respuestasGracias = [
    "Un placer ayudarte.",
    "Gracias a vos por confiar en nosotros.",
    "Siempre a disposición."
];

// ======================================================
// FUNCIONES DE APOYO Y NOTIFICACIÓN
// ======================================================

function enviarNotificacion(datosFinales) {
    if (!URL_GOOGLE_SHEETS) return;

    // Preparamos los datos para enviar a la planilla y al mail
    const payload = {
        nombre: botEstado.nombreCliente,
        tipo: botEstado.tipo,
        origen: datosFinales.origen || datosFinales.retiro,
        destino: datosFinales.destino || datosFinales.entrega,
        detalles: datosFinales.detalles
    };

    fetch(URL_GOOGLE_SHEETS, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(payload)
    });
}

function generarResumen(datos, tipo) {
    if (tipo === "envio") {
        return `📦 *RESERVA LISTA*\n\n🟦 ORIGEN: ${datos.origen}\n🟩 DESTINO: ${datos.destino}\n📝 Detalles/Teléfonos/Pago: ${datos.detalles || "No especificado"}`;
    } else {
        return `📦 *RESERVA RETIRO*\n\n🟦 RETIRO: ${datos.retiro}\n👤 A nombre de: ${datos.nombre}\n🟩 ENTREGA: ${datos.entrega}\n📝 Detalles/Teléfonos/Pago: ${datos.detalles || "No especificado"}`;
    }
}

// ======================================================
// LÓGICA DEL BOT
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    // Enlace de WhatsApp corregido para que sea cliqueable en el chat
    const linkWA = `<a href="https://wa.me/5493426396085" target="_blank" style="color: #1e88e5; font-weight: bold; text-decoration: underline;">WhatsApp de Guillermo</a>`;

    // Resetear
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {}, saludoEnviado: true };
        return `Perfecto, reiniciamos. ¿En qué puedo ayudarte, ${botEstado.nombreCliente}?\n1- Envío\n2- Retiro\n3- Quiero hacer una consulta`;
    }

    // --- PASO 1: SALUDO Y NOMBRE ---
    if (botEstado.paso === "saludo") {
        botEstado.paso = "preguntar_nombre";
        return "Hola 👋 Soy el asistente virtual de Logística Rossetton. ¿Cómo es tu nombre?";
    }

    if (botEstado.paso === "preguntar_nombre") {
        let nombreLimpio = mensaje.replace(/hola|soy|me llamo|mi nombre es/gi, "").trim();
        botEstado.nombreCliente = nombreLimpio || mensaje;
        
        botEstado.paso = "menu";
        return `Perfecto, ${botEstado.nombreCliente}, ¿en qué puedo ayudarte? Por favor elige una opción:\n1- Envío\n2- Retiro\n3- Quiero hacer una consulta`;
    }

    // --- PASO 2: MENÚ PRINCIPAL ---
    if (botEstado.paso === "menu") {
        if (texto === "1" || texto.includes("envío") || texto.includes("enviar") || texto.includes("lleven") || texto.includes("llevar")) {
            botEstado.tipo = "envio";
            botEstado.paso = "origen";
            return "Perfecto muchas gracias, ¿me dirías cuál es la dirección y localidad de origen?";
        }
        if (texto === "2" || texto.includes("retiro") || texto.includes("retirar") || texto.includes("busquen") || texto.includes("buscar")) {
            botEstado.tipo = "retiro";
            botEstado.paso = "retiro";
            return "Genial! muchas gracias por contar con nosotros, ¿me dirías cuál es la dirección y localidad de origen del retiro?";
        }
        if (texto === "3" || texto.includes("consulta")) {
            botEstado.paso = "consulta_abierta";
            return "Excelente, ¿qué necesitas consultar? Si eso está dentro de los datos que tengo cargados en mi memoria te asesoro enseguida, sino aguarda que Guillermo ni bien esté disponible te contesta por WhatsApp 🤖";
        }
        return "Por favor, elige una opción:\n1- Envío\n2- Retiro\n3- Consulta";
    }

    // --- PASO 3: CONSULTA (CON SALTO LÓGICO) ---
    if (botEstado.paso === "consulta_abierta") {
        if (texto.includes("envío") || texto.includes("enviar") || texto.includes("lleven") || texto.includes("llevar")) {
            botEstado.tipo = "envio";
            botEstado.paso = "origen";
            return "Entendido, para coordinar el envío primero decime: ¿Cuál es la dirección y localidad de origen?";
        }
        if (texto.includes("retiro") || texto.includes("retirar") || texto.includes("busquen") || texto.includes("buscar")) {
            botEstado.tipo = "retiro";
            botEstado.paso = "retiro";
            return "Claro que sí, para el retiro decime: ¿Cuál es la dirección y localidad de origen donde debemos buscar el paquete?";
        }
        if (texto.includes("precio") || texto.includes("cuánto") || texto.includes("costo") || texto.includes("sale")) {
            return "Los precios se calculan según la distancia a recorrer. Por favor, aguarda que Guillermo ni bien esté disponible te cotiza tu pedido por WhatsApp. Si quieres adelantar los datos, escribe 'envío'.";
        }
        if (texto.includes("horario") || texto.includes("días") || texto.includes("atienden")) {
            return "Atendemos de lunes a viernes de 8 a 18hs. ¿Deseas realizar un pedido ahora?";
        }
        return "Lo siento, no tengo información sobre esa consulta, 💔. Reformula tu pregunta o espera a que Guillermo te responda por WhatsApp. Soy un bot con memoria limitada y estoy a prueba, aprendiendo. ✍️";
    }

    // ======================================================
    // FLUJO DE ENVÍO
    // ======================================================
    if (botEstado.tipo === "envio") {
        switch (botEstado.paso) {
            case "origen":
                botEstado.datos.origen = mensaje;
                botEstado.paso = "destino";
                return "Excelente!, ¿y cuál es la dirección y localidad de destino?";
            case "destino":
                botEstado.datos.destino = mensaje;
                botEstado.paso = "detalles";
                return "¿Quieres agregar algún detalle o instrucción más?\n\n<small>Necesitamos teléfonos (origen y destino), piso, dpto, oficina, local, clínica, si no anda el timbre o forma de pago (efectivo o transferencia).</small>";
            case "detalles":
                botEstado.datos.detalles = mensaje;
                enviarNotificacion(botEstado.datos); // <-- Envío a Sheets y Mail
                const resumenEnvio = generarResumen(botEstado.datos, "envio");
                botEstado.paso = "menu";
                botEstado.tipo = null;
                return resumenEnvio + `\n\nMuchas gracias por detallar todo, Guillermo ya recibió tu pedido y te cotizará pronto ❤️\n\nSi prefieres, puedes contactarlo aquí: ${linkWA}`;
        }
    }

    // ======================================================
    // FLUJO DE RETIRO
    // ======================================================
    if (botEstado.tipo === "retiro") {
        switch (botEstado.paso) {
            case "retiro":
                botEstado.datos.retiro = mensaje;
                botEstado.paso = "nombre";
                return "Entendido 🫶, ¿A nombre de quién retiramos?";
            case "nombre":
                botEstado.datos.nombre = mensaje;
                botEstado.paso = "entrega";
                return "¿Y cuál es la dirección y localidad de destino?";
            case "entrega":
                botEstado.datos.entrega = mensaje;
                botEstado.paso = "detalles";
                return "¿Quieres agregar alguna instrucción más?\n\n<small>Necesitamos teléfonos (origen y destino), piso, dpto, oficina, local, clínica, si no anda el timbre o forma de pago (efectivo o transferencia).</small>";
            case "detalles":
                botEstado.datos.detalles = mensaje;
                enviarNotificacion(botEstado.datos); // <-- Envío a Sheets y Mail
                const resumenRetiro = generarResumen(botEstado.datos, "retiro");
                botEstado.paso = "menu";
                botEstado.tipo = null;
                return resumenRetiro + `\n\nMuchas gracias por detallar todo, Guillermo ya recibió tu pedido y te cotizará pronto ❤️\n\nContacto directo: ${linkWA}`;
        }
    }

    return "Lo siento, no tengo información sobre esa consulta, 💔. Reformula tu pregunta o espera a que Guillermo te responda por WhatsApp. ✍️";
}

// ======================================================
// INTERFAZ (BOTÓN Y CHAT)
// ======================================================

function sendMessage() {
    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    if (!input || !chatBox) return;

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
    const msg = document.createElement("div");
    msg.className = "message " + sender;
    // Usamos innerHTML para procesar los saltos de línea y el enlace de WhatsApp
    msg.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        addMessage(responderBot("hola"), "bot");
    }, 500);

    const input = document.getElementById("user-input");
    if(input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
