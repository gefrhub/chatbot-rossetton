async function enviarAlServidor(textoUsuario) {
  const respuesta = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: textoUsuario })
  });

  const data = await respuesta.json();

  if (data.error) {
    return "Error: " + data.error;
  }

  return data.reply;
}
