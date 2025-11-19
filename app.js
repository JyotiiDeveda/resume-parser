require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// Enable cors support to accept cross origin requests
app.use(cors({ origin: '*', optionsSuccessStatus: 200, maxAge: 600 }));

app.use('/health', async (_req, res) => {
  try {
    //  get current time from DB to check connectivity
    const [results] = await sequelize.query('SELECT NOW() as current_time');
    const currentTime = results[0].current_time;

    return res.send({
      message: 'Application runing successfully!',
      uptime: process.uptime(),
      database: currentTime
    });
  } catch (error) {
    console.log(`Error in health check API :: ${error}`);
    return res.send({
      statusCode: 400,
      success: false,
      message: 'Application health check failed!'
    });
  }
});

// 404 Error Handling
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    data: {},
    message: 'Invalid endpoint'
  });
});

module.exports = app;
