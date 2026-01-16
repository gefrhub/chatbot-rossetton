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
  return soloNumeros.length >= 8 && soloNumeros.length <= 12;
}

function esLocalidadValida(texto) {
  return texto.length >= 3 && /[a-záéíóúñ]/i.test(texto);
}

function esDireccionValida(texto) {
  return texto.length >= 5;
}


// ======================================================
// MENSAJES FINALES
// ======================================================

function mensajeFinalEnvio(datos) {
  const base =
    "📦 RESERVA LISTA\n\n" +
    "🟦 ORIGEN\n" +
    `Dirección: ${datos.origen_direccion}\n` +
    `Localidad: ${datos.origen_localidad}\n\n` +
    "🟩 DESTINO\n" +
    `Dirección: ${datos.destino_direccion}\n` +
    `Localidad: ${datos.destino_localidad}\n` +
    `Teléfono remitente: ${datos.telefono_remitente}\n` +
    `Teléfono destinatario: ${datos.telefono_destinatario}\n\n` +
    "📝 Detalles adicionales:\n" +
    `${datos.detalles || "Sin detalles adicionales."}\n\n`;

  return (
    base +
    "📌 Los precios se calculan según la distancia a recorrer por el cadete o comisionista.\n" +
    "💬 Guillermo puede estar ocupado repartiendo o atendiendo otras consultas, pero ni bien esté disponible te cotiza tu envío.\n\n" +
    "Muchas gracias por tu tiempo.\n" +
    "Fue un placer atenderte.\n" +
    "Hasta el próximo pedido."
  );
}

function mensajeFinalRetiro(datos) {
  const base =
    "📦 RESERVA LISTA (RETIRO)\n\n" +
    "🟦 RETIRO\n" +
    `Dirección: ${datos.retiro_direccion}\n` +
    `Localidad: ${datos.retiro_localidad}\n` +
    `A nombre de: ${datos.retiro_nombre}\n` +
    `Detalles del lugar: ${datos.retiro_detalles || "Sin detalles adicionales."}\n\n` +
    "🟩 ENTREGA\n" +
    `Dirección: ${datos.entrega_direccion}\n` +
    `Localidad: ${datos.entrega_localidad}\n` +
    `Teléfono contacto: ${datos.telefono_entrega}\n` +
    `Detalles de entrega: ${datos.entrega_detalles || "Sin detalles adicionales."}\n\n`;

  return (
    base +
    "📌 Los precios se calculan según la distancia a recorrer por el cadete o comisionista.\n" +
    "💬 Guillermo puede estar ocupado repartiendo o atendiendo otras consultas, pero ni bien esté disponible te cotiza tu envío.\n\n" +
    "Muchas gracias por tu tiempo.\n" +
    "Fue un placer atenderte.\n" +
    "Hasta el próximo pedido."
  );
}


// ======================================================
// LÓGICA PRINCIPAL DEL BOT
// ======================================================

function responderBot(mensaje) {
  const texto = mensaje.toLowerCase().trim();

  // --- SALUDO INICIAL ---
  if (!saludoInicialEnviado) {
    saludoInicialEnviado = true;
    return (
      "Hola, ¿cómo estás? Muchas gracias por escribirme.\n" +
      "Soy el asistente virtual de Logística Rossetton.\n" +
      "¿Querés coordinar un envío o un retiro?"
    );
  }

  // --- RESPUESTA A GRACIAS ---
  if (texto === "gracias" || texto === "muchas gracias") {
    const r = respuestasGracias[Math.floor(Math.random() * respuestasGracias.length)];
    return r;
  }

  // --- CANCELAR ---
  if (texto.includes("cancelar") || texto.includes("empezar de nuevo")) {
    estado = { paso: null, tipo: null, datos: {} };
    return "Perfecto, muchas gracias. Empezamos de nuevo. ¿Querés hacer un envío o un retiro?";
  }

  // --- INICIO DE FLUJO ---
  if (!estado.paso) {
    if (texto.includes("envío") || texto.includes("enviar")) {
      estado.tipo = "envio";
      estado.paso = "origen";
      return "Perfecto, muchas gracias. ¿Me pasás por favor *dirección y localidad de origen* juntas?";
    }

    if (texto.includes("retiro") || texto.includes("retirar")) {
      estado.tipo = "retiro";
      estado.paso = "retiro";
      return "Listo, muchas gracias. ¿Me pasás por favor *dirección y localidad de retiro* juntas?";
    }

    return "¿Querés coordinar un envío o un retiro?";
  }

  // -------------------------
  // FLUJO ENVÍO
  // -------------------------
  if (estado.tipo === "envio") {

    if (estado.paso === "origen") {
      estado.datos.origen_direccion = mensaje;
      estado.datos.origen_localidad = mensaje;
      estado.paso = "destino";
      return "Genial, muchas gracias. Ahora por favor pasame *dirección y localidad de destino* juntas.";
    }

    if (estado.paso === "destino") {
      estado.datos.destino_direccion = mensaje;
      estado.datos.destino_localidad = mensaje;
      estado.paso = "telefono_remitente";
      return "Perfecto, muchas gracias. ¿Cuál es el teléfono de quien envía?";
    }

    if (estado.paso === "telefono_remitente") {
      if (!esTelefonoValido(mensaje)) {
        return "Ese teléfono no me parece válido. ¿Podés escribir solo números, por favor?";
      }
      estado.datos.telefono_remitente = mensaje;
      estado.paso = "telefono_destinatario";
      return "¿Y el teléfono de quien recibe?";
    }

    if (estado.paso === "telefono_destinatario") {
      if (!esTelefonoValido(mensaje)) {
        return "Ese teléfono no me parece válido. Probá de nuevo solo con números, por favor.";
      }
      estado.datos.telefono_destinatario = mensaje;
      estado.paso = "detalles";
      return "¿Querés agregar detalles sobre las direcciones? (piso, dpto, oficina, timbre, etc.)";
    }

    if (estado.paso === "detalles") {
      estado.datos.detalles = mensaje;
      const resumen = mensajeFinalEnvio(estado.datos);
      estado = { paso: null, tipo: null, datos: {} };
      return resumen;
    }
  }

  // -------------------------
  // FLUJO RETIRO
  // -------------------------
  if (estado.tipo === "retiro") {

    if (estado.paso === "retiro") {
      estado.datos.retiro_direccion = mensaje;
      estado.datos.retiro_localidad = mensaje;
      estado.paso = "retiro_nombre";
      return "Perfecto, muchas gracias. ¿A nombre de quién retiramos?";
    }

    if (estado.paso === "retiro_nombre") {
      estado.datos.retiro_nombre = mensaje;
      estado.paso = "retiro_detalles";
      return "¿Querés agregar detalles del lugar de retiro? (piso, dpto, oficina, local, clínica, etc.)";
    }

    if (estado.paso === "retiro_detalles") {
      estado.datos.retiro_detalles = mensaje;
      estado.paso = "entrega";
      return "Genial, muchas gracias. ¿Me pasás por favor *dirección y localidad de entrega* juntas?";
    }

    if (estado.paso === "entrega") {
      estado.datos.entrega_direccion = mensaje;
      estado.datos.entrega_localidad = mensaje;
      estado.paso = "telefono_entrega";
      return "¿Tenés un número de teléfono de contacto para la entrega?";
    }

    if (estado.paso === "telefono_entrega") {
      if (!esTelefonoValido(mensaje)) {
        return "Ese teléfono no me parece válido. Probá de nuevo solo con números, por favor.";
      }
      estado.datos.telefono_entrega = mensaje;
      estado.paso = "entrega_detalles";
      return "¿Querés agregar detalles sobre la entrega? (piso, dpto, oficina, timbre, etc.)";
    }

    if (estado.paso === "entrega_detalles") {
      estado.datos.entrega_detalles = mensaje;
      const resumen = mensajeFinalRetiro(estado.datos);
      estado = { paso: null, tipo: null, datos: {} };
      return resumen;
    }
  }

  // --- SI NO ENTIENDE ---
  return (
    "Perdón, no logré entenderte bien. Soy un bot en aprendizaje y a veces me cuesta interpretar algunas cosas.\n" +
    "¿Podrías reformularlo un poquito? Muchas gracias por tu paciencia."
  );
}


// ======================================================
// SISTEMA DE CHAT
// ======================================================

const chatBox = document.getElementById("chat-box");

function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (text === "") return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    const respuesta = responderBot(text);
    addMessage(respuesta, "bot");
  }, 600);
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}// ======================================================
// ESTADO DEL BOT + CONFIGURACIÓN DE TONO
// ======================================================

let estado = {
  paso: null,
  tipo: null,
  datos: {}
};

// Tono del bot: "amigable", "formal", "tecnico", "rapido"
let tono = "amigable";


// ======================================================
// VALIDACIONES
// ======================================================

function esTelefonoValido(texto) {
  const soloNumeros = texto.replace(/\D/g, "");
  return soloNumeros.length >= 8 && soloNumeros.length <= 12;
}

function esLocalidadValida(texto) {
  return texto.length >= 3 && /[a-záéíóúñ]/i.test(texto);
}

function esDireccionValida(texto) {
  return texto.length >= 5;
}


// ======================================================
// MENSAJES FINALES (ENVÍO / RETIRO)
// ======================================================

function mensajeFinalEnvio(datos) {
  const base =
    "📦 RESERVA LISTA\n\n" +
    "🟦 ORIGEN\n" +
    `Dirección: ${datos.origen_direccion}\n` +
    `Localidad: ${datos.origen_localidad}\n\n` +
    "🟩 DESTINO\n" +
    `Dirección: ${datos.destino_direccion}\n` +
    `Localidad: ${datos.destino_localidad}\n` +
    `Teléfono remitente: ${datos.telefono_remitente}\n` +
    `Teléfono destinatario: ${datos.telefono_destinatario}\n\n` +
    "📝 Detalles adicionales:\n" +
    `${datos.detalles || "Sin detalles adicionales."}\n\n`;

  if (tono === "formal") {
    return (
      base +
      "Los precios se calculan según la distancia a recorrer por el cadete o comisionista.\n" +
      "Guillermo recibirá esta información y emitirá la cotización en cuanto su agenda se lo permita."
    );
  }

  if (tono === "tecnico") {
    return (
      base +
      "Tarifas determinadas por kilómetros recorridos y complejidad operativa.\n" +
      "Guillermo procesa estos datos y cotiza cuando finaliza las tareas en curso."
    );
  }

  if (tono === "rapido") {
    return base + "Precio según distancia. Guillermo te cotiza cuando esté libre.";
  }

  return (
    base +
    "📌 Los precios se calculan según la distancia a recorrer por el cadete o comisionista.\n" +
    "💬 Guillermo puede estar ocupado repartiendo o atendiendo otras consultas, pero ni bien esté disponible te cotiza tu envío.\n" +
    "Mientras tanto, cuantos más detalles me pases, mejor queda tu reserva lista para que él la ejecute enseguida."
  );
}


// ======================================================
// LÓGICA PRINCIPAL DEL BOT
// ======================================================

function responderBot(mensaje) {
  const texto = mensaje.toLowerCase().trim();

  if (texto.includes("cancelar") || texto.includes("empezar de nuevo")) {
    estado = { paso: null, tipo: null, datos: {} };
    return "Perfecto, empezamos de nuevo. ¿Querés hacer un envío o un retiro?";
  }

  if (!estado.paso) {
    if (texto.includes("envío") || texto.includes("enviar")) {
      estado.tipo = "envio";
      estado.paso = "origen_direccion";
      return "Perfecto, vamos a gestionar tu envío. ¿Cuál es la dirección de origen?";
    }

    if (texto.includes("retiro") || texto.includes("retirar")) {
      estado.tipo = "retiro";
      estado.paso = "retiro_direccion";
      return "Listo, vamos a coordinar el retiro. ¿Desde qué dirección debemos retirar?";
    }

    return "¿Querés hacer un envío o un retiro?";
  }

  // -------------------------
  // FLUJO PARA ENVÍOS
  // -------------------------
  if (estado.tipo === "envio") {

    if (estado.paso === "origen_direccion") {
      if (!esDireccionValida(mensaje)) {
        return "La dirección de origen me parece incompleta. ¿Podés escribirla un poco más detallada?";
      }
      estado.datos.origen_direccion = mensaje;
      estado.paso = "origen_localidad";
      return "Perfecto. ¿De qué localidad es el origen?";
    }

    if (estado.paso === "origen_localidad") {
      if (!esLocalidadValida(mensaje)) {
        return "La localidad de origen no me queda clara. ¿Podés confirmarla?";
      }
      estado.datos.origen_localidad = mensaje;
      estado.paso = "destino_direccion";
      return "Genial. ¿Cuál es la dirección de destino?";
    }

    if (estado.paso === "destino_direccion") {
      if (!esDireccionValida(mensaje)) {
        return "La dirección de destino parece incompleta. ¿Podés detallarla un poco más?";
      }
      estado.datos.destino_direccion = mensaje;
      estado.paso = "destino_localidad";
      return "¿Y la localidad de destino?";
    }

    if (estado.paso === "destino_localidad") {
      if (!esLocalidadValida(mensaje)) {
        return "La localidad de destino no me queda clara. ¿Podés confirmarla?";
      }
      estado.datos.destino_localidad = mensaje;
      estado.paso = "telefono_remitente";
      return "Perfecto. ¿Cuál es el teléfono de quien envía?";
    }

    if (estado.paso === "telefono_remitente") {
      if (!esTelefonoValido(mensaje)) {
        return "Ese teléfono no me parece válido. ¿Podés escribir solo números, sin espacios ni guiones?";
      }
      estado.datos.telefono_remitente = mensaje;
      estado.paso = "telefono_destinatario";
      return "¿Y el teléfono de quien recibe?";
    }

    if (estado.paso === "telefono_destinatario") {
      if (!esTelefonoValido(mensaje)) {
        return "Ese teléfono no me parece válido. Probá de nuevo solo con números.";
      }
      estado.datos.telefono_destinatario = mensaje;
      estado.paso = "detalles";
      return "¿Querés agregar detalles sobre las direcciones? (piso, dpto, oficina, clínica, timbre, etc.)";
    }

    if (estado.paso === "detalles") {
      estado.datos.detalles = mensaje;
      const resumen = mensajeFinalEnvio(estado.datos);
      estado = { paso: null, tipo: null, datos: {} };
      return resumen;
    }
  }

  // -------------------------
  // FLUJO PARA RETIROS
  // -------------------------
  if (estado.tipo === "retiro") {

    if (estado.paso === "retiro_direccion") {
      if (!esDireccionValida(mensaje)) {
        return "La dirección de retiro parece incompleta. ¿Podés detallarla un poco más?";
      }
      estado.datos.retiro_direccion = mensaje;
      estado.paso = "retiro_localidad";
      return "Perfecto. ¿De qué localidad debemos retirar?";
    }

    if (estado.paso === "retiro_localidad") {
      if (!esLocalidadValida(mensaje)) {
        return "La localidad de retiro no me queda clara. ¿Podés confirmarla?";
      }
      estado.datos.retiro_localidad = mensaje;
      estado.paso = "retiro_nombre";
      return "¿A nombre de quién retiramos?";
    }

    if (estado.paso === "retiro_nombre") {
      estado.datos.retiro_nombre = mensaje;
      estado.paso = "retiro_detalles";
      return "¿El lugar de retiro tiene detalles? (piso, dpto, oficina, sector, nombre del local, clínica, sanatorio, etc.)";
    }

    if (estado.paso === "retiro_detalles") {
      estado.datos.retiro_detalles = mensaje;
      estado.paso = "entrega_direccion";
      return "Perfecto. ¿A qué dirección debemos entregar?";
    }

    if (estado.paso === "entrega_direccion") {
      if (!esDireccionValida(mensaje)) {
        return "La dirección de entrega parece incompleta. ¿Podés detallarla un poco más?";
      }
      estado.datos.entrega_direccion = mensaje;
      estado.paso = "entrega_localidad";
      return "¿Y la localidad de entrega?";
    }

    if (estado.paso === "entrega_localidad") {
      if (!esLocalidadValida(mensaje)) {
        return "La localidad de entrega no me queda clara. ¿Podés confirmarla?";
      }
      estado.datos.entrega_localidad = mensaje;
      estado.paso = "telefono_entrega";
      return "¿Tenés un número de teléfono de contacto para la entrega?";
    }

    if (estado.paso === "telefono_entrega") {
      if (!esTelefonoValido(mensaje)) {
        return "Ese teléfono no me parece válido. Probá de nuevo solo con números.";
      }
      estado.datos.telefono_entrega = mensaje;
      estado.paso = "entrega_detalles";
      return "¿Querés agregar detalles sobre la entrega? (piso, dpto, oficina, timbre, etc.)";
    }

    if (estado.paso === "entrega_detalles") {
      estado.datos.entrega_detalles = mensaje;
      const resumen = mensajeFinalRetiro(estado.datos);
      estado = { paso: null, tipo: null, datos: {} };
      return resumen;
    }
  }

  return "Estoy siguiendo un proceso paso a paso. Si querés empezar de nuevo, escribí *cancelar*.";
}


// ======================================================
// SISTEMA DE CHAT (BOTÓN + MENSAJES)
// ======================================================

const chatBox = document.getElementById("chat-box");

function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (text === "") return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    const respuesta = responderBot(text);
    addMessage(respuesta, "bot");
  }, 600);
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}



