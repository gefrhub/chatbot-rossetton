// ======================================================
// CONFIGURACIÓN INTELIGENTE
// ======================================================

const URL_GOOGLE_SHEETS = "https://script.google.com/macros/s/AKfycbys09jDL6F1pQpySwUO9m5nykao1q3tzTjg3ajJu5X79inxi79VHdNXns0KTWo2U7ot/exec";

// Lista de localidades frecuentes para detectar info rápida
const localidadesCercanas = ["santo tomé", "santa fe", "sauce viejo", "rincón", "colastiné", "recreo"];

var botEstado = {
    paso: "saludo", 
    tipo: null,
    nombreCliente: "", 
    datos: { origen: "", destino: "", detalles: "", nombre: "" },
    saludoEnviado: false
};

// ======================================================
// MOTOR DE INTELIGENCIA (EXTRACCIÓN)
// ======================================================

function extraerInformacion(texto) {
    // Intentamos detectar si el usuario ya puso localidades
    localidadesCercanas.forEach(loc => {
        if (texto.includes(loc)) {
            if (!botEstado.datos.origen) {
                botEstado.datos.origen = texto; // Asumimos que lo primero que dice es origen
            } else if (!botEstado.datos.destino) {
                botEstado.datos.destino = texto;
            }
        }
    });

    // Detectar intención de Envío o Retiro por palabras clave (incluso mal escritas)
    if (/envio|enviar|enbiar|llevar|manda|mandar|transpor/i.test(texto)) botEstado.tipo = "envio";
    if (/retiro|retirar|busqu|busc|traer|traigan/i.test(texto)) botEstado.tipo = "retiro";
}

// ======================================================
// LÓGICA CON "CHISPA"
// ======================================================

function responderBot(mensaje) {
    const texto = mensaje.toLowerCase().trim();
    const linkWA = `<a href="https://wa.me/5493426396085" target="_blank" style="color: #1e88e5; font-weight: bold;">WhatsApp de Guillermo</a>`;
    
    // 1. Siempre amables con las palabras mágicas
    let cortesia = "";
    if (/gracias|agradezco|por favor|porfa|amable/i.test(texto)) {
        cortesia = "¡Muchas gracias a vos por tu amabilidad! ❤️ ";
    }

    // 2. Resetear
    if (texto.includes("cancelar") || texto.includes("empezar")) {
        botEstado = { paso: "menu", tipo: null, nombreCliente: botEstado.nombreCliente, datos: {origen:"", destino:"", detalles:"", nombre:""} };
        return `¡Entendido! Reiniciamos todo. ¿En qué puedo ayudarte ahora, ${botEstado.nombreCliente}?`;
    }

    // --- FLUJO INTELIGENTE ---

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
        extraerInformacion(texto); // Escaneamos el mensaje por si ya mandó info

        if (botEstado.tipo === "envio") {
            botEstado.paso = "origen";
            if (botEstado.datos.origen) { // Si ya detectamos el origen en el texto
                botEstado.paso = "destino";
                return cortesia + `¡Perfecto! Ya tomé nota del origen. Ahora, ¿hacia qué <b>destino</b> lo llevamos?`;
            }
            return cortesia + "¿Me dirías la dirección y localidad de <b>origen</b> para el envío?";
        }

        if (botEstado.tipo === "retiro") {
            botEstado.paso = "retiro";
            return cortesia + "Genial, nos encargamos del retiro. ¿Por dónde tendríamos que <b>pasar a buscarlo</b>?";
        }

        // Si es consulta de precios
        if (/precio|cuanto|costo|sale|valor/i.test(texto)) {
            return "Los precios varían según la distancia. Si me pasás las direcciones (escribí 'envío'), te damos el costo exacto ahora mismo.";
        }
        
        if (botEstado.paso === "consulta_abierta") {
             return "No estoy seguro de entender, pero Guillermo puede asesorarte mejor. ¿Querés dejar los datos del envío o preferís hablar con él? " + linkWA;
        }
    }

    // --- RECOLECCIÓN DE DATOS (SALTANDO PASOS SI YA EXISTEN) ---

    if (botEstado.tipo === "envio" || botEstado.tipo === "retiro") {
        if (botEstado.paso === "origen" || botEstado.paso === "retiro") {
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

    return "Disculpame, me perdí un poquito. ❤️ ¿Podrías decirme si necesitas un Envío o un Retiro? O escribe 'cancelar' para empezar de nuevo.";
}
