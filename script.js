// ======================================================
// CONFIGURACIÓN Y ESTADO
// ======================================================

// Usamos un objeto único para evitar colisiones de nombres
var botEstado = {
    paso: null,
    tipo: null,
    datos: {},
    saludoEnviado: false
};

const respuestasGracias = [
    "De nada, muchas gracias a vos.",
    "Gracias a vos.",
    "Un placer, muchas gracias."
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

    // Resetear
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: null, tipo: null, datos: {}, saludoEnviado: true };
        return "Reinicio el proceso. ¿Querés un *envío* o un *retiro*?";
    }

    // Saludo
    if (!botEstado.saludoEnviado) {
        botEstado.saludoEnviado = true;
        return "Hola, soy el asistente de Logística Rossetton. ¿Querés coordinar un *envío* o un *retiro*?";
    }

    // Flujo inicial
    if (!botEstado.paso) {
        if (texto.includes("envío") || texto.includes("enviar")) {
            botEstado.tipo = "envio";
            botEstado.paso = "origen";
            return "Perfecto. Pasame *dirección y localidad de origen*.";
        }
        if (texto.includes("retiro") || texto.includes("retirar")) {
            botEstado.tipo = "retiro";
            botEstado.paso = "retiro";
            return "Listo. Pasame *dirección y localidad de retiro*.";
        }
        return "¿Querés coordinar un envío o un retiro?";
    }

    // Lógica de Envío
    if (botEstado.tipo === "envio") {
        switch (botEstado.paso) {
            case "origen":
                botEstado.datos.origen = mensaje;
                botEstado.paso = "destino";
                return "Ahora pasame *dirección y localidad de destino*.";
            case "destino":
                botEstado.datos.destino = mensaje;
                botEstado.paso = "tel_rem";
                return "¿Teléfono de quien envía?";
            case "tel_rem":
                if (!esTelefonoValido(mensaje)) return "Número no válido. Solo números por favor.";
                botEstado.datos.tel_rem = mensaje;
                botEstado.paso = "tel_dest";
                return "¿Teléfono de quien recibe?";
            case "tel_dest":
                if (!esTelefonoValido(mensaje)) return "Número no válido. Solo números por favor.";
                botEstado.datos.tel_dest = mensaje;
                botEstado.paso = "detalles";
                return "¿Detalles adicionales? (Piso, dpto, etc). Si no hay, poné 'No'.";
            case "detalles":
                botEstado.datos.detalles = mensaje;
                const r = generarResumen(botEstado.datos, "envio");
                botEstado.paso = null; 
                return r + "\n\n✅ Guillermo te cotizará pronto.";
        }
    }
    
    // (Puedes agregar la lógica de retiro aquí de forma similar)
    return "No entendí, ¿podés repetir?";
}

// ======================================================
// INTERFAZ (BOTÓN Y CHAT)
// ======================================================

// Función vinculada al botón
function sendMessage() {
    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    
    if (!input || !chatBox) return;

    const text = input.value.trim();
    if (text === "") return;

    // 1. Mostrar mensaje usuario
    addMessage(text, "user");
    input.value = "";

    // 2. Respuesta del bot
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

// Permitir enviar con la tecla Enter
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    if(input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
