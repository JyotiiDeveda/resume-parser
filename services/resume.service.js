const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const mimeTypeConstants = require('../constants/mimetypes.constant');
const ollamaService = require('./ollama.service');
const driveService = require('./drive.service');
const filesHelper = require('../helpers/files.helper');
const prompts = require('../constants/prompts.constant');
const commonFunctionsHelper = require('../helpers/commonFunctions.helper');
const geminiService = require('./gemini.service');

const getSeneorityLevel = async function (experienceYears) {
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

const getResumeJDVectorMetrics = async function (resumeVec) {
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
};

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

const parseResumesAndGenerateMatchingScore = async function (folderId, timeBefore) {
  const files = await driveService.readDrive(folderId, timeBefore);

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

        const buffer = filesHelper.generateXlsxBuffer({
          fullName: resumeExtract.full_name,
          experienceYears: resumeExtract.experience_years,
          seniority: seniorityLevel,
          jdMatches
        });

        const fileName = `${resumeExtract.full_name.replace(/\s+/g, '_')}_matching_score.xlsx`;
        await driveService.uploadFileToDrive(buffer, fileName, process.env.RP_SUMMARY_FOLDER_ID, mimeTypeConstants.GOOGLE_SHEET_MIME);
      } catch (err) {
        console.error('Failed to parse resume: ', file.name, err);
      }
    },
    5
  );
};

const parseResumeAndGenerateSummary = async function (folderId, timeBefore) {
  const files = await driveService.readDrive(folderId, timeBefore);

  await commonFunctionsHelper.processInBatchesWithLimit(
    files,
    async file => {
      try {
        const resumeText = await driveService.downloadAndExtractContent(file);
        const resumeExtractPrompt = prompts.summarizeResumePrompt(resumeText);
        const resumeExtract = await geminiService.extractInfo(resumeExtractPrompt);

        const workExperience = await geminiService.extractResumeWorkExperience(resumeExtract?.work_experience);

        const buffer = await filesHelper.generateDocument({
          full_name: resumeExtract.full_name,
          education: resumeExtract.education,
          skills: resumeExtract.skills,
          ...workExperience
        });
        const fileName = `${resumeExtract.full_name.replace(/\s+/g, '_')}_summary.docx`;

        await driveService.uploadFileToDrive(buffer, fileName, process.env.RP_SUMMARY_FOLDER_ID, mimeTypeConstants.DOCX_MIME);
      } catch (error) {
        console.error('Error summarizing resumes:', error);
      }
    },
    5
  );
};

module.exports = {
  parseResumesAndGenerateMatchingScore,
  calculateMatchingScore,
  parseResumeAndGenerateSummary
};
