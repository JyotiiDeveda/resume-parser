const { Document, Packer, Paragraph, TextRun } = require('docx');

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
  generateXlsxBuffer,
  generateDocument
};
