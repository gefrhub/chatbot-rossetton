// ======================================================
// CONFIGURACIÓN Y ESTADO
// ======================================================

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
// FUNCIONES DE APOYO
// ======================================================

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
    const linkWA = "https://wa.me/5493426396085";

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
        // Corrección de identidad: Limpiamos frases comunes para quedarnos solo con el nombre
        let nombreLimpio = mensaje.replace(/hola|soy|me llamo|mi nombre es/gi, "").trim();
        botEstado.nombreCliente = nombreLimpio || mensaje;
        
        botEstado.paso = "menu";
        return `Perfecto, ${botEstado.nombreCliente}, ¿en qué puedo ayudarte? Por favor elige una opción:\n1- Envío\n2- Retiro\n3- Quiero hacer una consulta`;
    }

    // --- PASO 2: MENÚ PRINCIPAL ---
    if (botEstado.paso === "menu") {
        if (texto === "1" || texto.includes("envío") || texto.includes("enviar")) {
            botEstado.tipo = "envio";
            botEstado.paso = "origen";
            return "Perfecto muchas gracias, ¿me dirías cuál es la dirección y localidad de origen?";
        }
        if (texto === "2" || texto.includes("retiro") || texto.includes("retirar")) {
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

    // --- PASO 3: CONSULTA ---
    if (botEstado.paso === "consulta_abierta") {
        if (texto.includes("horario") || texto.includes("días")) {
            return "Atendemos de lunes a viernes de 8 a 18hs. ¿Deseas consultar algo más?";
        }
        if (texto.includes("precio") || texto.includes("cuánto") || texto.includes("costo")) {
            return "Los precios dependen de la distancia. Te sugiero iniciar un pedido (opción 1 o 2) para que Guillermo te cotice.";
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
                const resumenEnvio = generarResumen(botEstado.datos, "envio");
                botEstado.paso = "menu";
                return resumenEnvio + `\n\nMuchas gracias por detallar todo, Guillermo en breve te cotizará tu pedido, que tengas una excelente jornada ❤️\n\nSi prefieres, puedes contactarlo aquí: ${linkWA}`;
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
                const resumenRetiro = generarResumen(botEstado.datos, "retiro");
                botEstado.paso = "menu";
                return resumenRetiro + `\n\nMuchas gracias por detallar todo, Guillermo en breve te cotizará tu pedido, que tengas una excelente jornada ❤️\n\nContacto directo: ${linkWA}`;
        }
    }

    // RESPUESTA AMABLE POR DEFECTO
    return "Lo siento, no tengo información sobre esa consulta, 💔. Reformula tu pregunta o espera a que Guillermo te responda por WhatsApp. Soy un bot con memoria limitada y estoy a prueba, aprendiendo. ✍️";
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
    
    // Usamos innerHTML para que reconozca la etiqueta <small> y los saltos de línea
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
