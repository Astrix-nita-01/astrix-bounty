/* eslint-disable no-constant-condition */
/* eslint-disable no-sequences */
/* eslint-disable no-await-in-loop */
/* global actions, api */

// const UTILITY_TOKEN_SYMBOL = 'BEE';
// const UTILITY_TOKEN_PRECISION = 8;
// const CONTRACT_NAME = 'astrixbounty';

actions.createSSC = async () => {
  const tableExists = await api.db.tableExists('userprofile');
  if (tableExists === false) {
    await api.db.createTable('userprofile', ['user']);
    await api.db.createTable('prompts', ['user']);
    await api.db.createTable('application', ['user', 'promptId']);
    await api.db.createTable('params');

    const params = {};
    params.feePerTransaction = '0.1';
    params.maxTransactionsPerBlock = 50;
    params.maxAirdropsPerBlock = 1;
    await api.db.insert('params', params);
  }
};

actions.updateParams = async (payload) => {
  if (api.assert(api.sender === api.owner, 'not authorized')) {
    const {
      feePerTransaction,
      maxTransactionsPerBlock,
      maxAirdropsPerBlock,
    } = payload;

    const params = await api.db.findOne('params', {});

    if (feePerTransaction) {
      if (!api.assert(typeof feePerTransaction === 'string' && !api.BigNumber(feePerTransaction).isNaN() && api.BigNumber(feePerTransaction).gte(0), 'invalid feePerTransaction')) return;
      params.feePerTransaction = feePerTransaction;
    }
    if (maxTransactionsPerBlock) {
      if (!api.assert(Number.isInteger(maxTransactionsPerBlock) && maxTransactionsPerBlock >= 1, 'invalid maxTransactionsPerBlock')) return;
      params.maxTransactionsPerBlock = maxTransactionsPerBlock;
    }
    if (maxAirdropsPerBlock) {
      if (!api.assert(Number.isInteger(maxAirdropsPerBlock) && maxAirdropsPerBlock >= 1, 'invalid maxAirdropsPerBlock')) return;
      params.maxAirdropsPerBlock = maxAirdropsPerBlock;
    }

    await api.db.update('params', params);
  }
};

actions.createProfile = async (payload) => {
  const {
    skills,
    projects,
    description,
    profilepicture,
    isSignedWithActiveKey,
  } = payload;

  if (api.assert(isSignedWithActiveKey === true, 'you must use a custom_json signed with your active key')
        && api.assert(
          profilepicture && typeof profilepicture === 'string'
            && description && typeof description === 'string'
            && projects && Array.isArray(projects)
            && skills && Array.isArray(skills),
          'invalid params',
        )) {
    // Checking if user profile already exists
    const userProfile = await api.db.findOne('userprofile', { user: api.sender });

    if (api.assert(userProfile === null, 'user already has a profile' && !userProfile)) {
      // Create new profile if it doesn't exist
      const newUserProfile = await api.db.insert('userprofile', {
        user: api.sender,
        profilepicture,
        description,
        projects,
        skills,
      });

      api.emit('userprofile_created', { user: newUserProfile.user, exists: !userProfile });
    } else {
      api.emit('error', { error: 'user already has a profile' });
      return { success: false };
    }
  }
  return { success: true };
};

actions.updateProfile = async (payload) => {
  const {
    skills,
    projects,
    description,
    profilepicture,
    isSignedWithActiveKey,
  } = payload;

  if (api.assert(isSignedWithActiveKey === true, 'you must use a custom_json signed with your active key')
            && api.assert(
              profilepicture && typeof profilepicture === 'string'
                && description && typeof description === 'string'
                && projects && Array.isArray(projects)
                && skills && Array.isArray(skills),
              'invalid params',
            )) {
    // Checking if user profile exists
    const userProfile = await api.db.findOne('userprofile', { user: api.sender });

    if (api.assert(userProfile, 'user does not have a profile') && userProfile) {
      // Update existing profile
      userProfile.profilepicture = profilepicture;
      userProfile.description = description;
      userProfile.projects = projects;
      userProfile.skills = skills;

      await api.db.update('userprofile', userProfile);
      api.emit('userprofile_updated', { success: true });
    } else {
      api.emit('error', { error: 'user does not have a profile' });
      return { success: false };
    }


    return { success: false };
  }
  return { success: false };
};

actions.getOwnProfile = async () => {
  const userProfile = await api.db.findOne('userprofile', { user: api.sender });
  // Check if user profile exists
  if (!api.assert(userProfile, 'user profile does not exist')) {
    return { success: false };
  }

  if (userProfile) {
    api.emit('userprofile', userProfile);
    return { userprofile: userProfile, success: true };
  }

  return { success: false };
};

actions.getProfile = async (payload) => {
  const { username } = payload;

  if (api.assert(username && typeof username === 'string', 'invalid params')) {
    const userProfile = await api.db.findOne('userprofile', { user: username });

    // Check if user profile exists
    if (!api.assert(userProfile, 'user profile does not exist')) {
      return { userprofile: userProfile, success: false };
    }

    if (userProfile) {
      api.emit('userprofile', {
        user: userProfile.user,
        description: userProfile.description,
        skills: userProfile.skills,
        projects: userProfile.projects,
      });
      return { userprofile: userProfile, success: true };
    }
    return { success: false };
  }

  return { success: false };
};

actions.postPrompt = async (payload) => {
  const {
    title,
    description,
    category,
    promptFile,
    budgetRange,
    skillsRequired,
    isSignedWithActiveKey,
  } = payload;

  if (api.assert(isSignedWithActiveKey === true, 'you must use a custom_json signed with your active key')
        && api.assert(title && typeof title === 'string'
        && description && typeof description === 'string'
        && promptFile && typeof promptFile === 'string'
        && category && typeof category === 'string'
        && budgetRange && Array.isArray(budgetRange), 'invalid params')
        && skillsRequired && Array.isArray(skillsRequired), 'invalid params') {
    // Checking if user profile exists
    const userProfile = await api.db.findOne('userprofile', { user: api.sender });

    if (api.assert(userProfile, 'user does not have a profile') && userProfile) {
      // Create entry in prompts table
      const newPrompt = await api.db.insert('prompts', {
        user: api.sender, title, description, category, promptFile, budgetRange, skillsRequired,
      });
      api.emit('prompt_created', newPrompt);
    } else {
      api.emit('error', { error: 'user does not have a profile' });
      return { success: false };
    }

    return { success: true };
  }
  return { success: false };
};

actions.getAllPrompts = async () => {
  const prompts = await api.db.find('prompts', {});
  // check if prompts exist
  if (api.assert(prompts.length > 0, 'no prompts found')) {
    api.emit('all_prompts', prompts);
    return { success: true };
  }

  return { success: false };
};

actions.getPrompt = async (payload) => {
  const { promptId } = payload;

  if (api.assert(promptId && typeof promptId === 'number', 'invalid params')) {
    // Get the prompt from the prompts table
    const prompt = await api.db.findOne('prompts', { _id: promptId });

    // Check if prompt exists
    if (api.assert(prompt, 'prompt does not exist') && prompt) {
      api.emit('prompt', prompt);
      return { success: true };
    }
  }

  return { success: false };
};

actions.updatePrompt = async (payload) => {
  const {
    promptId,
    title,
    description,
    category,
    promptFile,
    budgetRange,
    skillsRequired,
    isSignedWithActiveKey,
  } = payload;

  if (api.assert(isSignedWithActiveKey === true, 'you must use a custom_json signed with your active key')
        && api.assert(title && typeof title === 'string'
        && promptId && typeof promptId === 'number'
        && description && typeof description === 'string'
        && promptFile && typeof promptFile === 'string'
        && category && typeof category === 'string'
        && budgetRange && Array.isArray(budgetRange), 'invalid params')
        && skillsRequired && Array.isArray(skillsRequired), 'invalid params') {
    // Get the prompt from the prompts table
    const prompt = await api.db.findOne('prompts', { _id: promptId });

    // Check if prompt exists
    if (api.assert(prompt, 'prompt does not exist') && prompt) {
      // Check if the user is the prompt owner
      if (api.assert(prompt.user === api.sender, 'user is not the prompt owner') && prompt.user === api.sender) {
        // Update existing entry in prompts table
        prompt.title = title;
        prompt.description = description;
        prompt.category = category;
        prompt.promptFile = promptFile;
        prompt.budgetRange = budgetRange;
        prompt.skillsRequired = skillsRequired;
        await api.db.update('prompts', prompt);
        api.emit('prompt_updated', { success: true });
      }
    } else {
      api.emit('error', { error: 'prompt does not exist' });
    }
  }
};

actions.applyToPromt = async (payload) => {
  const {
    coverletter,
    promptId,
    resume,
    isSignedWithActiveKey,
  } = payload;

  if (api.assert(isSignedWithActiveKey === true, 'you must use a custom_json signed with your active key')
        && api.assert(coverletter && typeof coverletter === 'string'
        && promptId && typeof promptId === 'number'
        && resume && typeof resume === 'string', 'invalid params')) {
    // Check if prompt exists
    const prompt = await api.db.findOne('prompts', { _id: promptId });

    if (api.assert(prompt, 'prompt does not exist') && prompt) {
      // Check if the user is not the prompt owner
      if (api.assert(prompt.user !== api.sender, 'user is the owner of this prompt') && prompt.user !== api.sender) {
        // Checking if user has already applied to this prompt
        const existingApplication = await api.db.findOne('application', { user: api.sender, promptId });
        if (api.assert(!existingApplication, 'user has already applied for this prompt') && !existingApplication) {
          // Create entry in application table
          const application = await api.db.insert('application', {
            user: api.sender, promptId, coverletter, resume,
          });
          api.emit('application_created', application);
        }
      }
    }
  }
};

actions.getAllApplications = async (payload) => {
  const {
    promptId,
  } = payload;

  if (api.assert(promptId && typeof promptId === 'number', 'invalid params')) {
    // Get all applications for a prompt
    const applications = await api.db.find('application', { promptId });
    // Check if applications exist
    if (api.assert(applications.length > 0, 'no applications found')) {
      api.emit('all_applications', applications);
    }
  }
};

actions.getApplication = async (payload) => {
  const {
    promptId,
    applicationId,
  } = payload;

  if (api.assert(promptId && typeof promptId === 'number'
        && applicationId && typeof applicationId === 'number', 'invalid params')) {
    // Get the application from the application table
    const application = await api.db.findOne('application', { _id: applicationId, promptId });
    // Check if application exists
    if (api.assert(application, 'application does not exist') && application) {
      api.emit('application', application);
      return { success: true };
    }
  }

  return { success: false };
};
