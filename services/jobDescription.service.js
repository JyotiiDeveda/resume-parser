const driveService = require('./drive.service');
const ollamaService = require('./ollama.service');
const prompts = require('../constants/prompts.constant');
const { JobDescription } = require('../models');
const { processInBatchesWithLimit } = require('../helpers/commonFunctions.helper');

const parseJDAndSaveEmbeddings = async function (timeBefore) {
  const files = await driveService.readDrive(process.env.JD_FOLDER_ID, timeBefore);
  await processInBatchesWithLimit(
    files,
    async file => {
      try {
        const textContent = await driveService.downloadAndExtractContent(file);
        const embedding = await ollamaService.generateEmbedding(textContent);

        const prompt = prompts.jobRolePrompt(textContent);
        const jobRole = await ollamaService.extractInfo(prompt).catch(err => {
          console.error('Failed to extract job role:', err);
          throw err;
        });

        const defaultPayload = {
          job_role: jobRole.role,
          embedding,
          content: textContent
        };

        const [, created] = await JobDescription.findOrCreate({
          where: {
            file_id: file.id
          },
          defaults: defaultPayload
        });

        if (!created) {
          await JobDescription.update(defaultPayload, {
            where: {
              file_id: file.id
            }
          });
        }
      } catch (err) {
        console.error('Failed to extract:', file.name, err);
      }
    },
    5
  );
};

module.exports = {
  parseJDAndSaveEmbeddings
};
