const axios = require('axios');

const generateEmbedding = async function (text) {
  let MAX_RETRIES = 10;

  while (true) {
    try {
      const res = await axios.post(`${process.env.OLLAMA_HOST_URL}/embed`, {
        model: process.env.OLLAMA_MODEL,
        input: text
      });

      let emb = res.data.embedding || res.data.embeddings;
      if (Array.isArray(emb) && Array.isArray(emb[0])) emb = emb[0];
      return emb;
    } catch (err) {
      if (!MAX_RETRIES) throw err;
      MAX_RETRIES -= 1;
      await new Promise(r => setTimeout(r, 500));
    }
  }
};

const extractInfo = async function (text) {
  const res = await axios.post(`${process.env.OLLAMA_HOST_URL}/generate`, {
    model: 'llama3',
    prompt: text,
    stream: false
  });

  const raw = res.data?.response?.trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse model output:', raw);
    throw err;
  }

  return parsed;
};

module.exports = {
  generateEmbedding,
  extractInfo
};
