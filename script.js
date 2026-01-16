// Agregamos esto para que VS Code no marque error de duplicados
export {}; 

// ======================================================
// CONFIGURACIÓN INICIAL
// ======================================================

let estado = {
  paso: null,
  tipo: null,
  datos: {}
};

let tono = "amigable";
let saludoInicialEnviado = false;

const respuestasGracias = [
  "De nada, muchas gracias vos.",
  "Gracias a vos.",
  "Un placer, muchas gracias."
];


// ======================================================
// VALIDACIONES
// ======================================================

function esTelefonoValido(texto) {
  const soloNumeros = texto.replace(/\D/g, "");
  return soloNumeros.length >= 8 && soloNumeros.length <= 15; // Extendí a 15 por seguridad
}

// ======================================================
// MENSAJES FINALES
// ======================================================

function mensajeFinalEnvio(datos) {
  const base =
    "📦 *RESERVA LISTA*\n\n" +
    "🟦 *ORIGEN*\n" +
    `Detalles: ${datos.origen_datos}\n\n` + // Simplifiqué ya que el usuario manda todo junto
    "🟩 *DESTINO*\n" +
    `Detalles: ${datos.destino_datos}\n` +
    `Teléfono remitente: ${datos.telefono_remitente}\n` +
    `Teléfono destinatario: ${datos.telefono_destinatario}\n\n` +
    "📝 *Detalles adicionales:*\n" +
    `${datos.detalles || "Sin detalles adicionales."}\n\n`;

  return (
    base +
    "📌 Los precios se calculan según la distancia a recorrer.\n" +
    "💬 Guillermo te cotizará ni bien esté disponible.\n\n" +
    "¡Muchas gracias!"
  );
}

function mensajeFinalRetiro(datos) {
  const base =
    "📦 *RESERVA LISTA (RETIRO)*\n\n" +
    "🟦 *RETIRO*\n" +
    `Ubicación: ${datos.retiro_datos}\n` +
    `A nombre de: ${datos.retiro_nombre}\n` +
    `Detalles: ${datos.retiro_detalles || "Sin detalles."}\n\n` +
    "🟩 *ENTREGA*\n" +
    `Ubicación: ${datos.entrega_datos}\n` +
    `Teléfono contacto: ${datos.telefono_entrega}\n` +
    `Detalles entrega: ${datos.entrega_detalles || "Sin detalles."}\n\n`;

  return (
    base +
    "📌 Los precios se calculan según la distancia.\n" +
    "💬 Guillermo te contactará pronto.\n\n" +
    "¡Muchas gracias!"
  );
}


// ======================================================
// LÓGICA PRINCIPAL DEL BOT
// ======================================================

function responderBot(mensaje) {
  const texto = mensaje.toLowerCase().trim();

  // --- CANCELAR ---
  if (texto.includes("cancelar") || texto.includes("empezar de nuevo")) {
    estado = { paso: null, tipo: null, datos: {} };
    return "Perfecto. Empezamos de nuevo. ¿Querés hacer un envío o un retiro?";
  }

  // --- SALUDO INICIAL ---
  if (!saludoInicialEnviado) {
    saludoInicialEnviado = true;
    return (
      "Hola, ¿cómo estás? Soy el asistente de Logística Rossetton.\n" +
      "¿Querés coordinar un envío o un retiro?"
    );
  }

  // --- RESPUESTA A GRACIAS ---
  if (texto === "gracias" || texto === "muchas gracias" || texto === "joya" || texto === "dale") {
    return respuestasGracias[Math.floor(Math.random() * respuestasGracias.length)];
  }

  // --- INICIO DE FLUJO ---
  if (!estado.paso) {
    if (texto.includes("envío") || texto.includes("enviar")) {
      estado.tipo = "envio";
      estado.paso = "origen";
      return "Perfecto. ¿Me pasás la *dirección y localidad de origen*?";
    }

    if (texto.includes("retiro") || texto.includes("retirar")) {
      estado.tipo = "retiro";
      estado.paso = "retiro";
      return "Listo. ¿Me pasás la *dirección y localidad de retiro*?";
    }

    return "¿Querés coordinar un envío o un retiro?";
  }

  // -------------------------
  // FLUJO ENVÍO
  // -------------------------
  if (estado.tipo === "envio") {
    if (estado.paso === "origen") {
      estado.datos.origen_datos = mensaje;
      estado.paso = "destino";
      return "Genial. Ahora pasame *dirección y localidad de destino*.";
    }

    if (estado.paso === "destino") {
      estado.datos.destino_datos = mensaje;
      estado.paso = "telefono_remitente";
      return "¿Cuál es el teléfono de quien envía?";
    }

    if (estado.paso === "telefono_remitente") {
      if (!esTelefonoValido(mensaje)) return "Ese teléfono no parece válido. Pasame solo números.";
      estado.datos.telefono_remitente = mensaje;
      estado.paso = "telefono_destinatario";
      return "¿Y el teléfono de quien recibe?";
    }

    if (estado.paso === "telefono_destinatario") {
      if (!esTelefonoValido(mensaje)) return "Ese teléfono no parece válido. Pasame solo números.";
      estado.datos.telefono_destinatario = mensaje;
      estado.paso = "detalles";
      return "¿Algún detalle extra? (piso, dpto, timbre...). Si no, poné 'No'.";
    }

    if (estado.paso === "detalles") {
      estado.datos.detalles = mensaje;
      const resumen = mensajeFinalEnvio(estado.datos);
      estado = { paso: null, tipo: null, datos: {} };
      return resumen;
    }
  }

  // -------------------------
  // FLUJO RETIRO (Lógica similar acortada para el ejemplo)
  // -------------------------
  if (estado.tipo === "retiro") {
    if (estado.paso === "retiro") {
        estado.datos.retiro_datos = mensaje;
        estado.paso = "retiro_nombre";
        return "¿A nombre de quién retiramos?";
    }
    // ... (El resto de tus pasos de retiro siguen igual)
  }

  return "No logré entenderte. ¿Podrías repetirlo o escribir 'cancelar' para empezar?";
}


// ======================================================
// INTERFAZ (DOM)
// ======================================================

// Usamos window. para asegurar que la función esté disponible en el HTML
window.sendMessage = function() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const text = input.value.trim();
  
  if (text === "" || !chatBox) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    const respuesta = responderBot(text);
    addMessage(respuesta, "bot");
  }, 600);
};

function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
