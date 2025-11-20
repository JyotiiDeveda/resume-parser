const jobRolePrompt = function (text) {
  return `
    You are an extraction engine. Extract the job role from the given text.
    Rules
    The role should be a job title such as "Python Engineer", "Backend Developer", "ML Engineer".
    If multiple roles appear, choose the one that is the main hiring position.
    Output only valid JSON, with no explanation, no extra text, no code blocks with this structure:
    {
      "role": "rolename"
    }
    here is the job description : ${text}
    `;
};

const resumeExtractPrompt = function (text) {
  return `
    From the given resume text, extract the candidate's full name and the total professional work experience in years. 
    While calculating the experience, count only actual professional work experience. Do not include education dates such 
    as school, college, or university timelines. Do not include training periods, certifications, bootcamps, academic projects, 
    or internship periods unless the internship is clearly full-time employment. If different experience ranges overlap, 
    consider them only once. If month-level dates are available, convert them into years approximately. If the resume lists 
    roles without dates, infer the experience from seniority and progression, but keep the estimation conservative. 
    Ignore any self-declared total experience mentioned in the summary unless it aligns with the work timeline. 
    If the resume does not provide clear work dates, estimate conservatively. If the resume suggests the candidate is a fresher, return 0.
    Return the output strictly without any additional text, without any explanation, any extra text or code blocks in the given structure:
    {
     "full_name": "Name Here",
     "experience_years": number
    }
    Resume text:
    ${text}
  `;
};

module.exports = {
  jobRolePrompt,
  resumeExtractPrompt
};
