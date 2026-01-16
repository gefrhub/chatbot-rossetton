const chatBox = document.getElementById("chat-box");

function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    setTimeout(() => {
        botResponse(text);
    }, 600);
}

function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function botResponse(userText) {
    let response = "No entendí eso, ¿podrías reformularlo?";

    userText = userText.toLowerCase();

    if (userText.includes("hola")) response = "Hola muchas gracias por tu consulta, ¿en qué puedo ayudarte?";
    if (userText.includes("precio")) response = "Nuestros precios varían según distancia y tipo de envío.";
    if (userText.includes(" hacen_envío")) response = "Realizamos envíos y retiros en Santo Tome , Santa Fe y alrededores.";
    if (userText.includes("horario")) response = "Trabajamos lunes viernes de 9 a 18 hs y sabados de 9 a 12hs.";
    if (userText.includes("contacto")) response = "Podés escribirnos por WhatsApp o desde este asistente.";
    if (userText.includes("vehiculos")) response= "Hacemos envios en motos , y tambien tenemos un auto, pero para envios en auto no siempre tenemos disponibilidad , tenes que coordinar con tiempo. ";
   addMessage(response, "bot");
}