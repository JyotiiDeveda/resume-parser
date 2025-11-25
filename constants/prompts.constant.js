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

const summarizeResumePrompt = function (text) {
  return `
    You are an information extraction engine.
    Your task is to Split the following resume based on the content into clearly separated sections:
    education, skills, work_experiece.

    ### STRICT RULES:
    1. Identify the persons full name.
    2. Identify education-related content (degrees, universities, years).
    3. Identify skills (technical skills, tools, technologies).
    4. Identify and place ALL work-related content under "work_experience".  
      This MUST include:
      - Companies
      - Roles / titles
      - Date ranges
      - Responsibilities and bullet points
      - **All project-related content**, even if written under a separate “Projects”, “Key Projects”, or “Project Experience” section. If the resume contains a dedicated “Projects” section, MERGE its raw text into "work_experience" instead of creating a separate section.
      - Include project titles, descriptions, dates, bullets as-is.
      
    5. If any section is missing, return an empty string "" for that key.

    6. DO NOT modify any content. Preserve exact text including formatting, spacing, bullet points, and order.

    7. IMPORTANT:
      - DO NOT rewrite, summarize, paraphrase, correct, or alter any text.
      - DO NOT remove years, dates, bullet points, company names.
      - DO NOT add any explanation or additional text.
    
    ### OUTPUT FORMAT:
      1. Provide the output in JSON format without any additional text, without any explanation
      2. No explanation or extra text before or after the JSON.
      {
        "full_name": "Name Here",
        "education": "…raw text exactly as in the resume…",
        "skills": "…raw text exactly as in the resume…",
        "work_experience": "…raw text exactly as in the resume…"
      }

    Now extract the information from this Resume Content:
    ${text}
`;
};

const summarizeWorkExperiencePrompt = function (text) {
  return `
    You are an expert resume information extraction engine.
    Input will be ONLY the "work_experience" section of a resume.

    Your task is to extract structured work experience data with this hierarchy:
    company → roles → (optional) projects.

    ### STRICT RULES:

    1. Identify every company the candidate has worked for.

    2. For each company, extract:
      - company_name (as written)
      - time_period (the overall duration listed with the company)
      - role_or_position: the primary role mentioned at the company level (if present)
      - roles: an array of all roles performed at the company.
            Each role object MUST contain:
            {
              "role_name": "",
              "time_period": "",
              "skills_used": []
            }

    3. IMPORTANT:
      - Do NOT treat bullet points or achievements as projects.
      - Only extract projects if the resume clearly includes actual project names or project sections.
      - If no real projects exist, return an empty array for "projects".

    4. Skills:
      - Extract only real skill names (technologies, tools, frameworks).
      - Deduplicate skills inside each role.
      - Do NOT include generic words like “lead”, “team”, “architecture”, “system”, etc.

    5. Output format must EXACTLY match the structure below.
      - No extra keys.
      - No missing keys.
      - STRICT valid JSON.

    6. PROJECT SECTION RULE:
      - If the text contains a section heading like:
          "Projects" "Personal Projects", "Internship Project, "Project Work, "Self Projects"
            then ALL items under this section must be treated as PROJECTS.

      - Any project section whose heading refers to the user themself (e.g., "personal", "self", "learning", "practice, "portfolio",
        or any similar phrasing indicating the work belongs to the user) MUST NOT be assigned to any company. 

      - A project:
          * Does NOT include job titles like Intern, Developer, Engineer.
          * Does NOT include company attributes like location (city, state).
          * May follow a section labelled Projects / Personal Projects.

      - NEVER classify items under these headers as companies.

    ### OUTPUT FORMAT:
    {
      "companies": [
        {
          "company_name": "",
          "role_or_position": "",
          "time_period": "",
          "roles": [
            {
              "role_name": "",
              "time_period": "",
              "skills_used": []
            }
          ],
          "projects": [
            {
              "project_name": "",
              "time_period": "",
              "skills_used": []
            }
          ]
        }
      ],
      "all_projects_flat": [
        {
          "project_name": "",
          "company_name": "",
          "role_or_position": "",
          "time_period": "",
          "skills_used": []  
        }
      ]
    }

    Now extract the information from this work experience text:

    """${text}"""
  `;
};

module.exports = {
  jobRolePrompt,
  resumeExtractPrompt,
  summarizeResumePrompt,
  summarizeWorkExperiencePrompt
};
