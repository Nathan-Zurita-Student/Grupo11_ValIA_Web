const Groq = require('groq-sdk');

// POST /api/vision/extract-date
// Usa Groq Vision (tier gratuito) para extrair data de validade de uma foto de embalagem.
async function extractDate(req, res, next) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'GROQ_API_KEY não configurada no servidor.' });
    }

    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: image },
            },
            {
              type: 'text',
              text: `Você é um leitor especializado em datas de validade de embalagens brasileiras.
Encontre a data de VALIDADE (não fabricação).
Palavras-chave: VAL, VALIDADE, VENCE, VENCIMENTO, BEST BEFORE, USE BY, EXP.
Retorne SOMENTE a data no formato AAAA-MM-DD.
Se for MM/AAAA, use o último dia do mês (ex: 02/2026 → 2026-02-28).
Se não houver data de validade visível, retorne: null`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '';

    // Extrai padrão AAAA-MM-DD de qualquer lugar na resposta
    const match = raw.match(/(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))/);
    if (!match) return res.json({ date: null });

    const year = Number(match[1].slice(0, 4));
    if (year < 2024 || year > 2040) return res.json({ date: null });

    return res.json({ date: match[1] });
  } catch (err) {
    next(err);
  }
}

module.exports = { extractDate };
