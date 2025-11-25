const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const driveUtils = require('../utils/drive');
const mimeTypeConstants = require('../constants/mimetypes.constant');
const { PassThrough } = require('stream');
const { Document, Packer, Paragraph, TextRun } = require('docx');

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

const generateXlsxBuffer = function ({ fullName, experienceYears, seniority, jdMatches }) {
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

const uploadFileToDrive = async function (buffer, fileName, folderId, mimeType) {
  const stream = new PassThrough();
  stream.end(buffer);

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: stream
    },
    fields: 'id',
    supportsAllDrives: true
  });

  console.log(`Successfully uploaded file ${fileName} to folder ${folderId}`);
  return file;
};

const generateDocument = async function (resumeData) {
  const docSections = [];

  const heading = text =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 32 })],
      spacing: { after: 200 }
    });

  const para = text =>
    new Paragraph({
      children: [new TextRun({ text, size: 24 })],
      spacing: { after: 100 }
    });

  if (resumeData.full_name) {
    docSections.push(
      new Paragraph({
        children: [new TextRun({ text: resumeData.full_name, bold: true, size: 40 })],
        spacing: { after: 300 }
      })
    );
  }

  if (resumeData.education) {
    docSections.push(heading('Education'));
    docSections.push(para(resumeData.education));
  }

  if (resumeData.skills) {
    docSections.push(heading('Skills'));
    docSections.push(para(resumeData.skills));
  }

  if (resumeData.companies?.length > 0) {
    docSections.push(heading('Companies'));

    resumeData.companies.forEach((company, index) => {
      docSections.push(para(`${index + 1}. ${company.company_name || 'Unknown Company'}`));

      if (company.roles?.length > 0) {
        docSections.push(para('Roles:'));
        company.roles.forEach(role => {
          docSections.push(para(`• ${role.role_name || 'Unknown Role'}`));
          if (role.time_period) docSections.push(para(`   Time Period: ${role.time_period}`));
          if (role.duration_years) docSections.push(para(`   Duration: ${role.duration_years}`));
          if (role.skills_used?.length > 0) docSections.push(para(`   Skills: ${role.skills_used.join(', ')}`));
        });
      } else {
        docSections.push(para('No roles listed.'));
      }

      if (company.projects?.length > 0) {
        docSections.push(para('Projects:'));
        company.projects.forEach(proj => {
          docSections.push(para(`• ${proj.project_name || 'Unnamed Project'}`));
          if (proj.time_period) docSections.push(para(`   Time Peroid: ${proj.time_period}`));
          if (proj.duration_years) docSections.push(para(`   Duration: ${proj.duration_years}`));
          if (proj.description) docSections.push(para(`   Description: ${proj.description}`));
          if (proj.skills_used?.length > 0) docSections.push(para(`   Skills: ${proj.skills_used.join(', ')}`));
        });
      } else {
        docSections.push(para('No projects listed.'));
      }

      docSections.push(new Paragraph(''));
    });
  }

  if (resumeData.all_projects_flat?.length > 0) {
    docSections.push(heading('All Projects (Flat List)'));

    resumeData.all_projects_flat.forEach((proj, idx) => {
      docSections.push(para(`${idx + 1}. ${proj.project_name || 'Unnamed Project'}`));
      if (proj.company_name) docSections.push(para(`   Company: ${proj.company_name}`));
      if (proj.time_period) docSections.push(para(`   Time Period: ${proj.time_period}`));
      if (proj.duration_years) docSections.push(para(`   Duration: ${proj.duration_years}`));
      if (proj.role_or_position) docSections.push(para(`     Role: ${proj.role_or_position}`));
      if (proj.skills_used?.length > 0) docSections.push(para(`   Skills: ${proj.skills_used.join(', ')}`));
    });
  }

  const doc = new Document({
    sections: [{ children: docSections }]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
};

module.exports = {
  readDrive,
  downloadAndExtractContent,
  generateXlsxBuffer,
  uploadFileToDrive,
  generateDocument
};
