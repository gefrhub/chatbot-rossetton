// ======================================================
// CONFIGURACIÓN Y ESTADO
// ======================================================

var botEstado = {
    paso: null,
    tipo: null,
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

function esTelefonoValido(texto) {
    const soloNumeros = texto.replace(/\D/g, "");
    return soloNumeros.length >= 8 && soloNumeros.length <= 15;
}

function generarResumen(datos, tipo) {
    if (tipo === "envio") {
        return `📦 *RESERVA LISTA*\n\n🟦 ORIGEN: ${datos.origen}\n🟩 DESTINO: ${datos.destino}\n📞 Remitente: ${datos.tel_rem}\n📞 Destinatario: ${datos.tel_dest}\n📝 Notas: ${datos.detalles || "Ninguna"}`;
    } else {
        return `📦 *RESERVA RETIRO*\n\n🟦 RETIRO: ${datos.retiro}\n👤 Nombre: ${datos.nombre}\n🟩 ENTREGA: ${datos.entrega}\n📞 Contacto: ${datos.tel_ent}\n📝 Notas: ${datos.detalles || "Ninguna"}`;
    }
}

// ======================================================
// LÓGICA DEL BOT
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();

    // Respuestas a "gracias"
    if (texto.includes("gracias")) {
        return respuestasGracias[Math.floor(Math.random() * respuestasGracias.length)];
    }

    // Resetear
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: null, tipo: null, datos: {}, saludoEnviado: true };
        return "Perfecto, reiniciamos el proceso. ¿Querés coordinar un *envío* o un *retiro*?";
    }

    // Saludo inicial
    if (!botEstado.saludoEnviado) {
        botEstado.saludoEnviado = true;
        return "Hola 👋 Soy el asistente de Logística Rossetton. ¿Querés coordinar un *envío* o un *retiro*?";
    }

    // Flujo inicial
    if (!botEstado.paso) {
        if (texto.includes("envío") || texto.includes("enviar")) {
            botEstado.tipo = "envio";
            botEstado.paso = "origen";
            return "Perfecto. ¿Cuál es la *dirección y localidad de origen*?";
        }
        if (texto.includes("retiro") || texto.includes("retirar")) {
            botEstado.tipo = "retiro";
            botEstado.paso = "retiro";
            return "Listo. Pasame la *dirección y localidad de retiro*.";
        }
        return "Disculpá, no entendí bien. ¿Querés coordinar un *envío* o un *retiro*?";
    }

    // ======================================================
    // FLUJO DE ENVÍO
    // ======================================================

    if (botEstado.tipo === "envio") {
        switch (botEstado.paso) {
            case "origen":
                botEstado.datos.origen = mensaje;
                botEstado.paso = "destino";
                return "Perfecto. Ahora pasame la *dirección y localidad de destino*.";

            case "destino":
                botEstado.datos.destino = mensaje;
                botEstado.paso = "tel_rem";
                return "¿Cuál es el *teléfono del remitente*?";

            case "tel_rem":
                if (!esTelefonoValido(mensaje)) {
                    return "Parece que ese número no es válido. ¿Podés enviarlo solo con números?";
                }
                botEstado.datos.tel_rem = mensaje;
                botEstado.paso = "tel_dest";
                return "Genial. ¿Y el *teléfono del destinatario*?";

            case "tel_dest":
                if (!esTelefonoValido(mensaje)) {
                    return "Ese número no parece correcto. Probá enviarlo solo con números.";
                }
                botEstado.datos.tel_dest = mensaje;
                botEstado.paso = "detalles";
                return "¿Querés agregar *detalles adicionales*? (Piso, dpto, referencias). Si no, escribí 'No'.";

            case "detalles":
                botEstado.datos.detalles = mensaje;
                const resumenEnvio = generarResumen(botEstado.datos, "envio");
                botEstado.paso = null;
                return resumenEnvio + "\n\n✅ Guillermo te enviará la cotización en breve.";
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
                return "Perfecto. ¿A nombre de quién retiramos?";

            case "nombre":
                botEstado.datos.nombre = mensaje;
                botEstado.paso = "entrega";
                return "¿Dónde debemos *entregar* el paquete? (Dirección y localidad)";

            case "entrega":
                botEstado.datos.entrega = mensaje;
                botEstado.paso = "tel_ent";
                return "¿Cuál es el *teléfono de contacto*?";

            case "tel_ent":
                if (!esTelefonoValido(mensaje)) {
                    return "Ese número no parece válido. ¿Podés enviarlo solo con números?";
                }
                botEstado.datos.tel_ent = mensaje;
                botEstado.paso = "detalles";
                return "¿Querés agregar *detalles adicionales*? Si no, escribí 'No'.";

            case "detalles":
                botEstado.datos.detalles = mensaje;
                const resumenRetiro = generarResumen(botEstado.datos, "retiro");
                botEstado.paso = null;
                return resumenRetiro + "\n\n✅ Guillermo te confirmará el retiro en breve.";
        }
    }

    // Si nada coincide
    return "Perdón, no entendí bien. ¿Podés reformularlo?";
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
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    if(input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
