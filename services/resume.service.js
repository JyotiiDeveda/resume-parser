const ollamaService = require('./ollama.service');
const driveService = require('./drive.service');
const prompts = require('../constants/prompts.constant');
const commonFunctionsHelper = require('../helpers/commonFunctions.helper');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

const getSeneorityLevel = async experienceYears => {
  switch (true) {
    case experienceYears >= 7:
      return 'Lead';
      break;
    case experienceYears >= 5:
      return 'SR2';
      break;
    case experienceYears >= 3:
      return 'SR1';
      break;
    default:
      return 'Junior';
  }
};

async function getResumeJDVectorMetrics(resumeVec) {
  const query = `
    SELECT
      jd.id,
      jd.job_role,
      1 - (jd.embedding <=> $1::vector) AS cosine_similarity,
      (jd.embedding <-> $1::vector) AS euclidean_distance,
      l1_distance(jd.embedding, $1::vector) AS manhattan_distance
    FROM job_descriptions jd
    ORDER BY cosine_similarity DESC
  `;

  const results = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    bind: [`[${resumeVec.join(',')}]`]
  });

  return results;
}

const calculateMatchingScore = async function (resumeVec) {
  const dbMetrics = await getResumeJDVectorMetrics(resumeVec);

  const results = dbMetrics.map(m => {
    const cos = Number(m.cosine_similarity); // already between -1 & 1
    const eu = Number(m.euclidean_distance); // lower is better
    const man = Number(m.manhattan_distance); // lower is better

    const euNorm = 1 / (1 + eu);
    const manNorm = 1 / (1 + man);

    const finalScore = cos * 0.7 + euNorm * 0.2 + manNorm * 0.1;

    return {
      title: m.job_role,
      score: finalScore
    };
  });

  return results;
};

const parseResumesAndGenerateSummary = async function (timeBefore) {
  const files = await driveService.readDrive(process.env.RESUME_FOLDER_ID, timeBefore);

  await commonFunctionsHelper.processInBatchesWithLimit(
    files,
    async file => {
      try {
        const resumeText = await driveService.downloadAndExtractContent(file);
        const resumeEmbedding = await ollamaService.generateEmbedding(resumeText);

        const resumeExtractPrompt = prompts.resumeExtractPrompt(resumeText);
        const resumeExtract = await ollamaService.extractInfo(resumeExtractPrompt).catch(err => {
          console.error('Failed to extract job role:', err);
          throw err;
        });
        const seniorityLevel = await getSeneorityLevel(resumeExtract.experience_years);
        console.log('resumeExtract: ', resumeExtract);

        const jdMatches = await calculateMatchingScore(resumeEmbedding);

        const buffer = driveService.generateSummaryXlsxBuffer({
          fullName: resumeExtract.full_name,
          experienceYears: resumeExtract.experience_years,
          seniority: seniorityLevel,
          jdMatches
        });

        const fileName = `${resumeExtract.full_name.replace(/\s+/g, '_')}_summary.xlsx`;
        await driveService.uploadXlsxToDrive(buffer, fileName, process.env.RP_SUMMARY_FOLDER_ID);
      } catch (err) {
        console.error('Failed to parse resume: ', file.name, err);
      }
    },
    5
  );
};

module.exports = {
  parseResumesAndGenerateSummary,
  calculateMatchingScore
};
