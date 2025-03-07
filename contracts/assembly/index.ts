import { JSON } from "assemblyscript-json/assembly";
import { db, console, TxOutput, getEnv } from "@vsc.eco/sdk/assembly";


class ProjectsPayload {
  // @ts-ignore
  title: String;
  // @ts-ignore
  description: String;
  // @ts-ignore
  link: String;
}

class createProfilePayload {
  // @ts-ignore
  skills: String[];
  // @ts-ignore
  projects: ProjectsPayload[];
  // @ts-ignore
  description: String;
  // @ts-ignore
  profilepicture: String;
}

export function crecreateProfile(payload: String): String {
  const sender = getEnv().msg_sender;
  
  if (!sender || sender.toString() === "") {
    return new TxOutput()
      .exitCode(1)
      .msg("UNAUTHORIZED_ACCESS")
      .done();
  }

  console.log(`sender: ${sender}`);

  let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

  // Validate required fields exist
  if (!jsonObj.getString("description") || 
      !jsonObj.getString("profilepicture") || 
      !jsonObj.getArr("skills")) {
    return new TxOutput()
      .exitCode(1)
      .msg("MISSING_REQUIRED_FIELDS")
      .done();
  }

  // Validate skills array
  const skillsArr = jsonObj.getArr("skills")!;

  const skills: String[] = skillsArr._arr.map<String>((value) => {
    return value.toString();
  });

  const projectsArr = jsonObj.getArr("projects");
  
  // Validate projects array exists
  if (!projectsArr) {
    return new TxOutput()
      .exitCode(1)
      .msg("PROJECTS_FIELD_MISSING")
      .done();
  }

  // Validate each project
  for (let i = 0; i < projectsArr._arr.length; i++) {
    const projObj = <JSON.Obj>projectsArr._arr[i];
    
    // Check required fields
    if (!projObj.getString("title") || 
        !projObj.getString("description") || 
        !projObj.getString("link")) {
      return new TxOutput()
        .exitCode(1)
        .msg("INVALID_PROJECT_DATA")
        .done();
    }
  }

  const projects: ProjectsPayload[] = projectsArr._arr.map<ProjectsPayload>((value) => {
    const projObj = <JSON.Obj>value;
    return {
      title: projObj.getString("title")!.toString(),
      description: projObj.getString("description")!.toString(),
      link: projObj.getString("link")!.toString(),
    };
  });

  const createProfilePayload: createProfilePayload = {
    skills: skills,
    description: jsonObj.getString("description")!._str,
    profilepicture: jsonObj.getString("profilepicture")!._str,
    projects: projects,
  };

  const profileObj = new JSON.Obj();
  profileObj.set("username", sender);
  profileObj.set("description", createProfilePayload.description);
  profileObj.set("profilepicture", createProfilePayload.profilepicture);
  
  // Create skills array
  const skillsJsonArr = new JSON.Arr();
  for (let i = 0; i < createProfilePayload.skills.length; i++) {
    skillsJsonArr.push(JSON.from(createProfilePayload.skills[i]));
  }
  profileObj.set("skills", skillsJsonArr);

  // Create projects array
  const projectsJsonArr = new JSON.Arr();
  for (let i = 0; i < createProfilePayload.projects.length; i++) {
    const project = new JSON.Obj();
    project.set("title", createProfilePayload.projects[i].title);
    project.set("description", createProfilePayload.projects[i].description);
    project.set("link", createProfilePayload.projects[i].link);
    projectsJsonArr.push(project);
  }
  profileObj.set("projects", projectsJsonArr);

  db.setObject(
    `userprofile/${sender}`,
    profileObj.stringify()
  );

  return new TxOutput().exitCode(0).msg("PROFILE_CREATED").done();
}

class updateProfilePayload {
  // @ts-ignore
  skills: String[];
  // @ts-ignore
  projects: ProjectsPayload[];
  // @ts-ignore
  description: String;
  // @ts-ignore
  profilepicture: String;
}

export function updateProfile(payload: String): String {
    // Get sender address
    const sender = getEnv().msg_sender;
    
    if (!sender || sender.toString() === "") {
      return new TxOutput()
        .exitCode(1)
        .msg("UNAUTHORIZED_ACCESS")
        .done();
    }

    // Check if profile exists
    const existingProfile = db.getObject(`userprofile/${sender}`);
    if (existingProfile === "null") {
      return new TxOutput()
        .exitCode(1)
        .msg("PROFILE_NOT_FOUND")
        .done();
    }

    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate required fields exist
    if (!jsonObj.getString("description") || 
        !jsonObj.getString("profilepicture") || 
        !jsonObj.getArr("skills")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_REQUIRED_FIELDS")
        .done();
    }

    // Validate skills array
    const skillsArr = jsonObj.getArr("skills")!;
    const skills: String[] = skillsArr._arr.map<String>((value) => {
      return value.toString();
    });

    // Validate projects
    const projectsArr = jsonObj.getArr("projects");
    if (!projectsArr) {
      return new TxOutput()
        .exitCode(1)
        .msg("PROJECTS_FIELD_MISSING")
        .done();
    }

    // Validate each project
    for (let i = 0; i < projectsArr._arr.length; i++) {
      const projObj = <JSON.Obj>projectsArr._arr[i];
      if (!projObj.getString("title") || 
          !projObj.getString("description") || 
          !projObj.getString("link")) {
        return new TxOutput()
          .exitCode(1)
          .msg("INVALID_PROJECT_DATA")
          .done();
      }
    }

    // Map projects data
    const projects: ProjectsPayload[] = projectsArr._arr.map<ProjectsPayload>((value) => {
      const projObj = <JSON.Obj>value;
      return {
        title: projObj.getString("title")!.toString(),
        description: projObj.getString("description")!.toString(),
        link: projObj.getString("link")!.toString(),
      };
    });

    // Create update payload
    const updateProfilePayload: updateProfilePayload = {
      skills: skills,
      description: jsonObj.getString("description")!._str,
      profilepicture: jsonObj.getString("profilepicture")!._str,
      projects: projects,
    };

    // Create JSON object for storage
    const profileObj = new JSON.Obj();
    profileObj.set("username", sender);
    profileObj.set("description", updateProfilePayload.description);
    profileObj.set("profilepicture", updateProfilePayload.profilepicture);
    
    // Create skills array
    const skillsJsonArr = new JSON.Arr();
    for (let i = 0; i < updateProfilePayload.skills.length; i++) {
      skillsJsonArr.push(JSON.from(updateProfilePayload.skills[i]));
    }
    profileObj.set("skills", skillsJsonArr);

    // Create projects array
    const projectsJsonArr = new JSON.Arr();
    for (let i = 0; i < updateProfilePayload.projects.length; i++) {
      const project = new JSON.Obj();
      project.set("title", updateProfilePayload.projects[i].title);
      project.set("description", updateProfilePayload.projects[i].description);
      project.set("link", updateProfilePayload.projects[i].link);
      projectsJsonArr.push(project);
    }
    profileObj.set("projects", projectsJsonArr);

    // Update profile in database
    db.setObject(
      `userprofile/${sender}`,
      profileObj.stringify()
    );

    return new TxOutput().exitCode(0).msg("PROFILE_UPDATED").done();
}

class getProfilePayload {
  // @ts-ignore
  username: String
}

export function getProfile(payload: String): String {
    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate required fields exist
    if (!jsonObj.getString("username")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_REQUIRED_FIELDS")
        .done();
    }

    const getProfilePayload: getProfilePayload = {
      username: jsonObj.getString("username")!._str
    };

    const profile = db.getObject(`userprofile/${getProfilePayload.username}`);

    // return profile not found if profile does not exists
    if(profile === "null") {
      return new TxOutput()
        .exitCode(1)
        .msg("PROFILE_NOT_FOUND")
        .done();
    }

    // Create response object with profile data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "PROFILE_FOUND");
    responseObj.set("profile", JSON.parse(profile));

    return responseObj.stringify();
}

export function getOwnProfile(): String {
    // Get sender address
    const sender = getEnv().msg_sender;
    
    if (!sender || sender.toString() === "") {
      return new TxOutput()
        .exitCode(1)
        .msg("UNAUTHORIZED_ACCESS")
        .done();
    }

    const profile = db.getObject(`userprofile/${sender}`);

    // return profile not found if profile does not exists
    if(profile === "null") {
      return new TxOutput()
        .exitCode(1)
        .msg("PROFILE_NOT_FOUND")
        .done();
    }

    // Create response object with profile data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "PROFILE_FOUND");
    responseObj.set("profile", JSON.parse(profile));

    return responseObj.stringify();
}

class createPromptPayload {
  // @ts-ignore
  title: String;
  // @ts-ignore
  description: String;
  // @ts-ignore
  category: String;
  // @ts-ignore
  promptFile: String;
  // @ts-ignore
  budgetRange: String;
  // @ts-ignore
  skillsRequired: String[];
}

export function postPrompt(payload: String): String {
    // Get sender address
    const sender = getEnv().msg_sender;
    
    if (!sender || sender.toString() === "") {
        return new TxOutput()
          .exitCode(1)
          .msg("UNAUTHORIZED_ACCESS")
          .done();
    }

    // Parse and validate payload
    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate required fields
    if (!jsonObj.getString("title") || 
        !jsonObj.getString("description") || 
        !jsonObj.getString("category") ||
        !jsonObj.getString("budgetRange") ||
        !jsonObj.getArr("skillsRequired")) {
        return new TxOutput()
            .exitCode(1)
            .msg("MISSING_REQUIRED_FIELDS")
            .done();
    }

    // Validate skillsRequired array
    const skillsArr = jsonObj.getArr("skillsRequired")!;
    if (skillsArr._arr.length === 0) {
      return new TxOutput()
        .exitCode(1)
        .msg("SKILLS_REQUIRED")
        .done();
    }

    const skills: String[] = skillsArr._arr.map<String>((value) => {
      return value.toString();
    });

    // Create prompt payload
    const promptPayload: createPromptPayload = {
      title: jsonObj.getString("title")!._str,
      description: jsonObj.getString("description")!._str,
      category: jsonObj.getString("category")!._str,
      promptFile: jsonObj.getString("promptFile")!._str,
      budgetRange: jsonObj.getString("budgetRange")!._str,
      skillsRequired: skills
    };

    // Create JSON object for storage
    const promptObj = new JSON.Obj();
    promptObj.set("creator", sender);
    promptObj.set("title", promptPayload.title);
    promptObj.set("description", promptPayload.description);
    promptObj.set("category", promptPayload.category);
    promptObj.set("promptFile", promptPayload.promptFile);
    promptObj.set("budgetRange", promptPayload.budgetRange);
    
    // Create skills array
    const skillsJsonArr = new JSON.Arr();
    for (let i = 0; i < promptPayload.skillsRequired.length; i++) {
      skillsJsonArr.push(JSON.from(promptPayload.skillsRequired[i]));
    }
    promptObj.set("skillsRequired", skillsJsonArr);

    /// Generate unique ID for the prompt
    const promptId = `${sender}_${getEnv().anchor_timestamp}`;
    promptObj.set("promptId", promptId);

    // Get existing prompts array or create new one
    const existingPrompts = db.getObject('prompts');
    let promptsArray = new JSON.Arr();
    
    if (existingPrompts && existingPrompts !== "null") {
        // If prompts exist, parse them
        promptsArray = <JSON.Arr>JSON.parse(existingPrompts);
    }

    // Add new prompt to array
    promptsArray.push(promptObj);

    // Store updated prompts array
    db.setObject(
      'prompts',
      promptsArray.stringify()
    );

    // Create response object with profile data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "PROMPT_CREATED");
    responseObj.set("promptId", promptId);

    return responseObj.stringify();
}

export function updatePrompt(payload: String): String {
    // Get sender address
    const sender = getEnv().msg_sender;
    
    if (!sender || sender.toString() === "") {
      return new TxOutput()
        .exitCode(1)
        .msg("UNAUTHORIZED_ACCESS")
        .done();
    }

    // Parse and validate payload
    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate promptId exists
    if (!jsonObj.getString("promptId")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_PROMPT_ID")
        .done();
    }

    // Validate required fields
    if (!jsonObj.getString("title") || 
      !jsonObj.getString("description") || 
      !jsonObj.getString("category") ||
      !jsonObj.getString("budgetRange") ||
      !jsonObj.getArr("skillsRequired")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_REQUIRED_FIELDS")
        .done();
    }

    // Get existing prompts
    const existingPrompts = db.getObject('prompts');
    if (!existingPrompts || existingPrompts === "null") {
      return new TxOutput()
        .exitCode(1)
        .msg("NO_PROMPTS_FOUND")
        .done();
    }

    // Parse prompts array
    const promptsArray = <JSON.Arr>JSON.parse(existingPrompts);
    
    // Find prompt index and verify ownership
    let promptIndex = -1;
    const promptId = jsonObj.getString("promptId")!._str;
    
    for (let i = 0; i < promptsArray._arr.length; i++) {
      const prompt = <JSON.Obj>promptsArray._arr[i];
      if (prompt.getString("promptId")!._str === promptId) {
        // Verify ownership
        if (prompt.getString("creator")!._str !== sender.toString()) {
          return new TxOutput()
            .exitCode(1)
            .msg("UNAUTHORIZED_ACCESS")
            .done();
        }
        promptIndex = i;
        break;
      }
    }

    if (promptIndex === -1) {
      return new TxOutput()
        .exitCode(1)
        .msg("PROMPT_NOT_FOUND")
        .done();
    }

    // Validate skillsRequired array
    const skillsArr = jsonObj.getArr("skillsRequired")!;
    if (skillsArr._arr.length === 0) {
      return new TxOutput()
        .exitCode(1)
        .msg("SKILLS_REQUIRED")
        .done();
    }

    const skills: String[] = skillsArr._arr.map<String>((value) => {
      return value.toString();
    });

    // Create updated prompt object
    const updatedPromptObj = new JSON.Obj();
    updatedPromptObj.set("promptId", promptId);
    updatedPromptObj.set("creator", sender);
    updatedPromptObj.set("title", jsonObj.getString("title")!._str);
    updatedPromptObj.set("description", jsonObj.getString("description")!._str);
    updatedPromptObj.set("category", jsonObj.getString("category")!._str);
    updatedPromptObj.set("promptFile", jsonObj.getString("promptFile")!._str);
    updatedPromptObj.set("budgetRange", jsonObj.getString("budgetRange")!._str);
    
    // Create skills array
    const skillsJsonArr = new JSON.Arr();
    for (let i = 0; i < skills.length; i++) {
        skillsJsonArr.push(JSON.from(skills[i]));
    }
    updatedPromptObj.set("skillsRequired", skillsJsonArr);

    // Update prompt in array
    promptsArray._arr[promptIndex] = updatedPromptObj;

    // Store updated prompts array
    db.setObject(
        'prompts',
        promptsArray.stringify()
    );

    // Create response object
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "PROMPT_UPDATED");
    responseObj.set("promptId", promptId);

    return responseObj.stringify();
}

class getPromptByIdPayload {
  // @ts-ignore
  promptId: String
}

export function getPromptById(payload: String): String {
    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate required fields exist
    if (!jsonObj.getString("promptId")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_REQUIRED_FIELDS")
        .done();
    }

    const getPromptPayload: getPromptByIdPayload = {
      promptId: jsonObj.getString("promptId")!._str
    };

    // Get all prompts
    const existingPrompts = db.getObject('prompts');
    if (!existingPrompts || existingPrompts === "null") {
      return new TxOutput()
      .exitCode(1)
      .msg("NO_PROMPT_FOUND")
      .done();
    }

    // Parse prompts array
    const promptsArray = <JSON.Arr>JSON.parse(existingPrompts);
    
    // Find prompt with matching ID
    let foundPrompt: JSON.Obj | null = null;
    for (let i = 0; i < promptsArray._arr.length; i++) {
      const prompt = <JSON.Obj>promptsArray._arr[i];
      if (prompt.getString("promptId")!._str === getPromptPayload.promptId) {
        foundPrompt = prompt;
        break;
      }
    }

    // Return error if prompt not found
    if (!foundPrompt) {
      return new TxOutput()
        .exitCode(1)
        .msg("PROMPT_NOT_FOUND")
        .done();
    }

    // Create response object with prompt data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "PROMPT_FOUND");
    responseObj.set("prompt", foundPrompt);

    return responseObj.stringify();
}

export function getAllPrompta(): String {
    // Get all prompts from database
    const existingPrompts = db.getObject('prompts');
    
    // If no prompts exist, return empty array
    if (!existingPrompts || existingPrompts === "null") {
        const responseObj = new JSON.Obj();
        responseObj.set("code", 0);
        responseObj.set("msg", "NO_PROMPTS");
        responseObj.set("prompts", new JSON.Arr());
        return responseObj.stringify();
    }

    // Parse prompts array
    const promptsArray = <JSON.Arr>JSON.parse(existingPrompts);

    // Create response object with prompts data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "PROMPTS_FOUND");
    responseObj.set("prompts", promptsArray);

    return responseObj.stringify();
}

class apllyToPromptPayload {
  // @ts-ignore
  coverletter: String;
  // @ts-ignore
  promptId: String;
  // @ts-ignore
  resume: String;
}

export function applyToPrompt(payload: String): String {
    // Get sender address
    const sender = getEnv().msg_sender;
    
    if (!sender || sender.toString() === "") {
      return new TxOutput()
        .exitCode(1)
        .msg("UNAUTHORIZED_ACCESS")
        .done();
    }

    // Parse and validate payload
    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate required fields
    if (!jsonObj.getString("promptId") || 
      !jsonObj.getString("coverletter") || 
      !jsonObj.getString("resume")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_REQUIRED_FIELDS")
        .done();
    }

    // Create application payload
    const applicationPayload: apllyToPromptPayload = {
      promptId: jsonObj.getString("promptId")!._str,
      coverletter: jsonObj.getString("coverletter")!._str,
      resume: jsonObj.getString("resume")!._str
    };

    // Verify prompt exists
    const existingPrompts = db.getObject('prompts');
    if (!existingPrompts || existingPrompts === "null") {
      return new TxOutput()
        .exitCode(1)
        .msg("NO_PROMPTS_FOUND")
        .done();
    }

    // Find prompt
    const promptsArray = <JSON.Arr>JSON.parse(existingPrompts);
    let promptExists = false;
    let promptCreator = "";
    
    for (let i = 0; i < promptsArray._arr.length; i++) {
      const prompt = <JSON.Obj>promptsArray._arr[i];
      if (prompt.getString("promptId")!._str === applicationPayload.promptId) {
        promptExists = true;
        promptCreator = prompt.getString("creator")!._str;
        break;
      }
    }

    if (!promptExists) {
      return new TxOutput()
        .exitCode(1)
        .msg("PROMPT_NOT_FOUND")
        .done();
    }

    // Prevent creator from applying to their own prompt
    if (promptCreator === sender.toString()) {
      return new TxOutput()
        .exitCode(1)
        .msg("CANNOT_APPLY_TO_OWN_PROMPT")
        .done();
    }

    // Create application object with unique ID
    const applicationId = `${sender}_${applicationPayload.promptId}_${getEnv().anchor_timestamp}`;
    const applicationObj = new JSON.Obj();
    applicationObj.set("applicationId", applicationId);
    applicationObj.set("applicant", sender);
    applicationObj.set("promptId", applicationPayload.promptId);
    applicationObj.set("coverletter", applicationPayload.coverletter);
    applicationObj.set("resume", applicationPayload.resume);
    applicationObj.set("timestamp", getEnv().anchor_timestamp);
    applicationObj.set("status", "APPLIED");

    // Get all applications array
    const existingApplications = db.getObject('applications');
    let applicationsArray = new JSON.Arr();
    
    if (existingApplications && existingApplications !== "null") {
        applicationsArray = <JSON.Arr>JSON.parse(existingApplications);
        
        // Check if user has already applied to this prompt
        for (let i = 0; i < applicationsArray._arr.length; i++) {
            const application = <JSON.Obj>applicationsArray._arr[i];
            if (application.getString("applicant")!._str === sender.toString() && 
                application.getString("promptId")!._str === applicationPayload.promptId) {
                return new TxOutput()
                    .exitCode(1)
                    .msg("ALREADY_APPLIED")
                    .done();
            }
        }
    }

    // Add new application to array
    applicationsArray.push(applicationObj);

    // Store updated applications array
    db.setObject(
        'applications',
        applicationsArray.stringify()
    );

    // Create response object
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "APPLICATION_SUBMITTED");
    responseObj.set("promptId", applicationPayload.promptId);
    responseObj.set("applicationId", applicationId);

    return responseObj.stringify();
}

class getApplicationByIdPayload {
  // @ts-ignore
  promptId: String;
  // @ts-ignore
  applicationId: String;
}

export function getApplicationById(payload: String): String {
    // Parse and validate payload
    let jsonObj: JSON.Obj = <JSON.Obj>JSON.parse(payload);

    // Validate required fields
    if (!jsonObj.getString("promptId") || !jsonObj.getString("applicationId")) {
      return new TxOutput()
        .exitCode(1)
        .msg("MISSING_REQUIRED_FIELDS")
        .done();
    }

    const applicationPayload: getApplicationByIdPayload = {
      promptId: jsonObj.getString("promptId")!._str,
      applicationId: jsonObj.getString("applicationId")!._str
    };

    // Get all applications
    const existingApplications = db.getObject('applications');
    if (!existingApplications || existingApplications === "null") {
      return new TxOutput()
        .exitCode(1)
        .msg("NO_APPLICATIONS_FOUND")
        .done();
    }

    // Parse applications array
    const applicationsArray = <JSON.Arr>JSON.parse(existingApplications);
    
    // Find application with matching IDs
    let foundApplication: JSON.Obj | null = null;
    for (let i = 0; i < applicationsArray._arr.length; i++) {
      const application = <JSON.Obj>applicationsArray._arr[i];
      if (application.getString("promptId")!._str === applicationPayload.promptId && 
        application.getString("applicationId")!._str === applicationPayload.applicationId) {
        foundApplication = application;
        break;
      }
    }

    // Return error if application not found
    if (!foundApplication) {
      return new TxOutput()
        .exitCode(1)
        .msg("APPLICATION_NOT_FOUND")
        .done();
    }

    // Create response object with application data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "APPLICATION_FOUND");
    responseObj.set("application", foundApplication);

    return responseObj.stringify();
}

export function getAllApplications(): String {
    // Get all applications from database
    const existingApplications = db.getObject('applications');
    
    // If no applications exist, return empty array
    if (!existingApplications || existingApplications === "null") {
        const responseObj = new JSON.Obj();
        responseObj.set("code", 0);
        responseObj.set("msg", "NO_APPLICATIONS");
        responseObj.set("applications", new JSON.Arr());
        return responseObj.stringify();
    }

    // Parse applications array
    const applicationsArray = <JSON.Arr>JSON.parse(existingApplications);

    // Create response object with applications data
    const responseObj = new JSON.Obj();
    responseObj.set("code", 0);
    responseObj.set("msg", "APPLICATIONS_FOUND");
    responseObj.set("applications", applicationsArray);

    return responseObj.stringify();
}