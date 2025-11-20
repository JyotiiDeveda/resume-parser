const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const driveUtils = require('../utils/drive');
const mimeTypeConstants = require('../constants/mimetypes.constant');
const { PassThrough } = require('stream');

const drive = driveUtils.getDriveClient();

const downloadFile = async function (file) {
  const { id: fileId, mimeType } = file;

  let fileStream;

  if (mimeType === mimeTypeConstants.GOOGLE_DOC_MIME) {
    // EXPORT Google Docs → .docx
    fileStream = await drive.files.export(
      {
        fileId,
        mimeType: mimeTypeConstants.EXPORT_GOOGLE_DOC_TO_DOCX // export to .docx
      },
      { responseType: 'stream' }
    );
  } else {
    // NORMAL BINARY FILE → DIRECT DOWNLOAD
    fileStream = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  }

  return fileStream.data;
};

const downloadAndExtractContent = async function (file) {
  const stream = await downloadFile(file);

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  if (file.mimeType === mimeTypeConstants.PDF_MIME) {
    const data = await pdf(buffer);
    return data.text;
  } else if ([mimeTypeConstants.DOCX_MIME, mimeTypeConstants.GOOGLE_DOC_MIME].includes(file.mimeType)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    throw new Error('Unsupported file type: ' + file.mimeType);
  }
};

const readDrive = async function (folderId, timeBefore) {
  let query = `'${folderId}' in parents`;

  if (timeBefore) query += ` and modifiedTime > '${timeBefore}'`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, modifiedTime)'
  });

  const files = res.data.files;

  if (!files.length) {
    console.log('No new or updated files.');
    return [];
  }

  return files;
};

const generateSummaryXlsxBuffer = function ({ fullName, experienceYears, seniority, jdMatches }) {
  const data = [
    ['Candidate', fullName],
    ['Experience Years', experienceYears],
    ['Seniority', seniority],
    [],
    ['Job Description', 'Score'],
    ...jdMatches.map(jd => [jd.title, jd.score])
  ];

  const ws = xlsx.utils.aoa_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Summary');

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const uploadXlsxToDrive = async function (buffer, fileName, folderId) {
  const stream = new PassThrough();
  stream.end(buffer);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: stream
    },
    fields: 'id',
    supportsAllDrives: true
  });

  console.log(`Successfully uploaded file ${fileName} to folder ${folderId}`);
  return file;
};

module.exports = {
  readDrive,
  downloadAndExtractContent,
  generateSummaryXlsxBuffer,
  uploadXlsxToDrive
};
