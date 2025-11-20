const cron = require('node-cron');
const { subDays, subHours, subMinutes } = require('date-fns');
const resumeService = require('../services/resume.service');
const jobDescriptionService = require('../services/jobDescription.service');

const readDriveAndGenerateResumeSummary = function () {
  const scheduleExpression = process.env.POLLING_SCHEDULER_TIME;
  console.log('scheduleExpression: ', scheduleExpression);

  if (!scheduleExpression) {
    console.log(`Invalid cron expression "POLLING_SCHEDULER_TIME": ${scheduleExpression}`);
    return;
  }

  cron.schedule(
    scheduleExpression,
    async () => {
      const jobLabel = 'readDriveAndGenerateResumeSummary';
      try {
        console.log(`[${jobLabel}] started at ${new Date().toISOString()}`);
        const now = new Date();
        const timeBefore = subDays(now, 1).toISOString(); // subtract 5 days

        await jobDescriptionService.parseJDAndSaveEmbeddings(timeBefore);
        await resumeService.parseResumesAndGenerateSummary(timeBefore);
        console.log(`[${jobLabel}] completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.log(`[${jobLabel}] failed: ${error.message}`, {
          stack: error.stack
        });
      }
    },
    {
      timezone: 'Asia/Kolkata'
    }
  );
};

module.exports = {
  readDriveAndGenerateResumeSummary
};
