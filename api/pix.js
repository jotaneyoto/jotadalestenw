export default async function handler(req, res) {
  // 1. Configurações de Permissão (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { amount, buyerName } = req.body;

    // Tenta pegar a chave da Vercel. Se não tiver, use a fixa para teste (descomente a linha de baixo)
    let SECRET_KEY = process.env.ABACASH_SECRET;
    // SECRET_KEY = "SUA_CHAVE_ABACASH_AQUI"; 

    if (!SECRET_KEY) {
        return res.status(500).json({ error: "Chave ABACASH_SECRET não configurada na Vercel" });
    }

    // SEU PRODUTO
    const MEUS_PRODUTOS = ["s2dwjdf1t"]; 
    const produtoSorteado = MEUS_PRODUTOS[Math.floor(Math.random() * MEUS_PRODUTOS.length)];

    // 🔥 CONFIGURAÇÃO LIMPA (SEM DADOS)
    // Estamos enviando APENAS o necessário.
    const bodyToSend = {
        action: "create",
        product_id: produtoSorteado,
        amount: Number(amount),
        customer: {
          name: buyerName || "Cliente"
          // CPF, EMAIL e TELEFONE foram removidos propositalmente
        }
    };

    console.log("Enviando para Abacash (Modo Sem Dados):", JSON.stringify(bodyToSend));

    const response = await fetch("https://app.abacash.com/api/payment.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SECRET_KEY}`
      },
      body: JSON.stringify(bodyToSend)
    });

    const jsonResponse = await response.json();
    console.log("Resposta Abacash:", JSON.stringify(jsonResponse));

    // Lê a resposta para encontrar o QR Code
    const pixData = jsonResponse.data || {};
    // A Abacash às vezes manda 'qr_code', às vezes 'pix_code'
    const code = pixData.qr_code || pixData.pix_code || jsonResponse.qr_code;
    const urlImage = pixData.qr_image_url || pixData.qrcode_image || jsonResponse.qr_image_url;

    if (code) {
        return res.status(200).json({
            // O frontend precisa de 'qr_code_text' para desenhar o QR Code
            qr_code_text: code, 
            qrCodeUrl: urlImage,
            transaction_id: jsonResponse.id || pixData.id
        });
    }

    // Se falhar, retorna o erro detalhado
    return res.status(400).json({ 
        error: "Erro na operadora", 
        detail: jsonResponse.message || "Seu produto pode estar exigindo CPF no painel." 
    });

  } catch (error) {
    console.error("Erro Fatal:", error);
    return res.status(500).json({ error: "Erro interno", detail: error.message });
  }
}