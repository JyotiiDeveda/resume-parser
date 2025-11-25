// gemini.client.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateDurationYears } = require('../helpers/commonFunctions.helper');
const { summarizeWorkExperiencePrompt } = require('../constants/prompts.constant');
const mimetypesConstant = require('../constants/mimetypes.constant');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash'
});

const extractInfo = async function (prompt) {
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: mimetypesConstant.MODEL_RESPONSE_MIME_TYPE
    }
  });
  const extractedRes = response.response.text();

  try {
    const json = extractedRes.replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse JSON:', extractedRes);
    throw e;
  }
};

const extractResumeWorkExperience = async function (inputText) {
  const prompt = summarizeWorkExperiencePrompt(inputText);

  const extractedRes = await extractInfo(prompt);
  // calculate duration years
  extractedRes.companies.forEach(c => {
    if (c.time_period) c.duration_years = calculateDurationYears(c.time_period);

    c.roles?.forEach(r => {
      if (r?.time_period) r.duration_years = calculateDurationYears(r.time_period);
    });

    c.projects?.forEach(p => {
      if (p?.time_period) p.duration_years = calculateDurationYears(p.time_period);
    });
  });

  extractedRes.all_projects_flat?.forEach(p => {
    if (p?.time_period) p.duration_years = calculateDurationYears(p.time_period);
  });
  return extractedRes;
};

module.exports = { extractInfo, extractResumeWorkExperience };
