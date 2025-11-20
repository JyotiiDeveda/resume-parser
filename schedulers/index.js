const fs = require('fs');
const path = require('path');

const start = () => {
  //  register scheduler in batches for production but not for development/staging
  const fileSuffix = process.env.APP_ENV === 'production' ? `${process.env.SCHEDULER_BATCH}.scheduler.js` : '.scheduler.js';
  const schedulersDirectory = path.resolve('schedulers');
  const files = fs.readdirSync(schedulersDirectory);
  for (const file of files) {
    const fullPath = `${schedulersDirectory}/${file}`;
    if (fs.existsSync(fullPath) && fullPath.endsWith(fileSuffix)) {
      const schedulers = require(`./${file}`);
      for (const scheduler in schedulers) {
        if (Object.hasOwnProperty.call(schedulers, scheduler)) {
          const schedulerFunction = schedulers[scheduler];
          try {
            schedulerFunction();
          } catch (err) {
            console.log('Scheduler error:', schedulerFunction, err);
          }
        }
      }
    }
  }
};

module.exports = {
  start
};
