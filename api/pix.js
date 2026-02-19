export default async function handler(req, res) {
  // Configurações de Permissão (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { amount, buyerName } = req.body;
    
    // Tenta pegar a chave da Vercel.
    let SECRET_KEY = process.env.ABACASH_SECRET;
    
    if (!SECRET_KEY) {
        // Fallback de segurança se a variável de ambiente falhar
        // Coloque sua chave aqui se precisar testar direto:
        // SECRET_KEY = "SUA_CHAVE_AQUI"; 
        return res.status(500).json({ error: "Chave ABACASH não configurada" });
    }

    const MEUS_PRODUTOS = ["s2dwjdf1t"]; 
    const produtoSorteado = MEUS_PRODUTOS[Math.floor(Math.random() * MEUS_PRODUTOS.length)];

    // ENVIO SEM DADOS (Conforme funcionou no seu Log)
    const bodyToSend = {
        action: "create",
        product_id: produtoSorteado,
        amount: Number(amount),
        customer: {
          name: buyerName || "Cliente"
        }
    };

    console.log("Gerando PIX (Modo Anônimo)...");

    const response = await fetch("https://app.abacash.com/api/payment.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SECRET_KEY}`
      },
      body: JSON.stringify(bodyToSend)
    });

    const jsonResponse = await response.json();
    console.log("Sucesso Abacash:", JSON.stringify(jsonResponse));

    // Lógica para pegar o código onde quer que ele esteja
    const pixData = jsonResponse.data || {};
    const code = pixData.qr_code || pixData.pix_code || jsonResponse.qr_code;
    const urlImage = pixData.qr_image_url || pixData.qrcode_image || jsonResponse.qr_image_url;

    if (code) {
        return res.status(200).json({
            // Manda com TODOS os nomes para o HTML não se perder
            qr_code_text: code,  // Para HTML versão Dice
            copiaecola: code,    // Para HTML versão antiga
            code: code,          // Garantia extra
            qrCodeUrl: urlImage,
            transaction_id: jsonResponse.id || pixData.id || pixData.payment_id
        });
    }

    return res.status(400).json({ 
        error: "Erro na operadora", 
        detail: jsonResponse.message 
    });

  } catch (error) {
    console.error("Erro Fatal:", error);
    return res.status(500).json({ error: "Erro interno", detail: error.message });
  }
}
