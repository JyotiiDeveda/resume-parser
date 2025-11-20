const app = require('./app');
const { sequelize } = require('./models/index');
require('dotenv').config();
const schedulers = require('./schedulers');

const startServer = async function () {
  await sequelize.authenticate();

  if (process.env.SCHEDULERS === 'true') {
    schedulers.start();
    console.log('... Schedulers ✔');
  }

  app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT}`);
  });

  app.get('/', (req, res) => {
    res.send('Hello World');
  });
};

startServer();
