const { google } = require('googleapis');

function getDriveClient() {
  const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [process.env.GOOGLE_AUTH_SCOPES]
  });

  return google.drive({ version: 'v3', auth });
}

module.exports = {
  getDriveClient
};
