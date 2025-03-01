/* eslint-disable no-constant-condition */
/* eslint-disable no-sequences */
/* eslint-disable no-await-in-loop */
/* global actions, api */

// const UTILITY_TOKEN_SYMBOL = 'BEE';
// const UTILITY_TOKEN_PRECISION = 8;
// const CONTRACT_NAME = 'astrixbounty';

actions.createSSC = async () => {
  const tableExists = await api.db.tableExists("userprofile");
  if (tableExists === false) {
    await api.db.createTable("userprofile", ["user"]);
    await api.db.createTable("prompts", ["user"]);
    await api.db.createTable("application", ["user", "promptId"]);
    await api.db.createTable("params");

    const params = {};
    params.feePerTransaction = "0.1";
    params.maxTransactionsPerBlock = 50;
    params.maxAirdropsPerBlock = 1;
    await api.db.insert("params", params);
  }
};

actions.updateParams = async (payload) => {
  if (api.assert(api.sender === api.owner, "not authorized")) {
    const { feePerTransaction, maxTransactionsPerBlock, maxAirdropsPerBlock } =
      payload;

    const params = await api.db.findOne("params", {});

    if (feePerTransaction) {
      if (
        !api.assert(
          typeof feePerTransaction === "string" &&
            !api.BigNumber(feePerTransaction).isNaN() &&
            api.BigNumber(feePerTransaction).gte(0),
          "invalid feePerTransaction"
        )
      )
        return;
      params.feePerTransaction = feePerTransaction;
    }
    if (maxTransactionsPerBlock) {
      if (
        !api.assert(
          Number.isInteger(maxTransactionsPerBlock) &&
            maxTransactionsPerBlock >= 1,
          "invalid maxTransactionsPerBlock"
        )
      )
        return;
      params.maxTransactionsPerBlock = maxTransactionsPerBlock;
    }
    if (maxAirdropsPerBlock) {
      if (
        !api.assert(
          Number.isInteger(maxAirdropsPerBlock) && maxAirdropsPerBlock >= 1,
          "invalid maxAirdropsPerBlock"
        )
      )
        return;
      params.maxAirdropsPerBlock = maxAirdropsPerBlock;
    }

    await api.db.update("params", params);
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

  if (
    api.assert(
      isSignedWithActiveKey === true,
      "you must use a custom_json signed with your active key"
    ) &&
    api.assert(
      profilepicture &&
        typeof profilepicture === "string" &&
        description &&
        typeof description === "string" &&
        projects &&
        Array.isArray(projects) &&
        skills &&
        Array.isArray(skills),
      "invalid params"
    )
  ) {
    // Checking if user profile already exists
    const userProfile = await api.db.findOne("userprofile", {
      user: api.sender,
    });

    if (
      api.assert(
        userProfile === null,
        "user already has a profile" && !userProfile
      )
    ) {
      // Create new profile if it doesn't exist
      const newUserProfile = await api.db.insert("userprofile", {
        user: api.sender,
        profilepicture,
        description,
        projects,
        skills,
      });

      api.emit("userprofile_created", {
        user: newUserProfile.user,
        exists: !userProfile,
      });
    } else {
      api.emit("error", { error: "user already has a profile" });
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

  if (
    api.assert(
      isSignedWithActiveKey === true,
      "you must use a custom_json signed with your active key"
    ) &&
    api.assert(
      profilepicture &&
        typeof profilepicture === "string" &&
        description &&
        typeof description === "string" &&
        projects &&
        Array.isArray(projects) &&
        skills &&
        Array.isArray(skills),
      "invalid params"
    )
  ) {
    // Checking if user profile already exists
    const userProfile = await api.db.findOne("userprofile", {
      user: api.sender,
    });

    if (
      api.assert(userProfile, "user does not have a profile") &&
      userProfile
    ) {
      // Update existing profile
      userProfile.profilepicture = profilepicture;
      userProfile.description = description;
      userProfile.projects = projects;
      userProfile.skills = skills;

      await api.db.update("userprofile", userProfile);
      api.emit("userprofile_updated", { success: true });
    } else {
      api.emit("error", { error: "user does not have a profile" });
      return { success: false };
    }

    return { success: false };
  }
  return { success: false };
};

actions.getOwnProfile = async () => {
  const userProfile = await api.db.findOne("userprofile", { user: api.sender });
  // Check if user profile exists
  if (!api.assert(userProfile, "user profile does not exist")) {
    return { success: false };
  }

  if (userProfile) {
    api.emit("userprofile", userProfile);
    return { userprofile: userProfile, success: true };
  }

  return { success: false };
};

actions.getProfile = async (payload) => {
  const { username } = payload;

  if (api.assert(username && typeof username === "string", "invalid params")) {
    const userProfile = await api.db.findOne("userprofile", { user: username });

    // Check if user profile exists
    if (!api.assert(userProfile, "user profile does not exist")) {
      return { userprofile: userProfile, success: false };
    }

    if (userProfile) {
      api.emit("userprofile", {
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

// Need to fix from here onwards

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

  if (
    (api.assert(
      isSignedWithActiveKey === true,
      "you must use a custom_json signed with your active key"
    ) &&
      api.assert(
        title &&
          typeof title === "string" &&
          description &&
          typeof description === "string" &&
          promptFile &&
          typeof promptFile === "string" &&
          category &&
          typeof category === "string" &&
          budgetRange &&
          Array.isArray(budgetRange),
        "invalid params"
      ) &&
      skillsRequired &&
      Array.isArray(skillsRequired),
    "invalid params")
  ) {
    // Create entry in prompts table
    const newPrompt = await api.db.insert("prompts", {
      user: api.sender,
      title,
      description,
      category,
      promptFile,
      budgetRange,
      skillsRequired,
    });

    api.emit("prompt_created", newPrompt);
  }
};

actions.getAllPrompts = async () => {
  const prompts = await api.db.findInTable("prompts", {});
  return { prompts };
};

actions.getPrompt = async (payload) => {
  const { promptId } = payload;

  if (api.assert(promptId && typeof promptId === "string", "invalid params")) {
    const prompt = await api.db.findOne("prompts", { _id: promptId });
    return { prompt };
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

  if (
    (api.assert(
      isSignedWithActiveKey === true,
      "you must use a custom_json signed with your active key"
    ) &&
      api.assert(
        title &&
          typeof title === "string" &&
          promptId &&
          typeof promptId === "string" &&
          description &&
          typeof description === "string" &&
          promptFile &&
          typeof promptFile === "string" &&
          category &&
          typeof category === "string" &&
          budgetRange &&
          Array.isArray(budgetRange),
        "invalid params"
      ) &&
      skillsRequired &&
      Array.isArray(skillsRequired),
    "invalid params")
  ) {
    // Check if the user is the prompt owner
    const prompt = await api.db.findOne("prompts", { _id: promptId });

    if (prompt.user !== api.sender) {
      // Update existing entry in prompts table
      const updatedPrompt = await api.db.update(
        "prompts",
        { _id: promptId },
        {
          title,
          description,
          category,
          promptFile,
          budgetRange,
          skillsRequired,
        }
      );

      api.emit("prompt_updated", updatedPrompt);
    }
  }
};

actions.applyToPromt = async (payload) => {
  const { coverletter, promptId, resume, isSignedWithActiveKey } = payload;

  if (
    api.assert(
      isSignedWithActiveKey === true,
      "you must use a custom_json signed with your active key"
    ) &&
    api.assert(
      coverletter &&
        typeof coverletter === "string" &&
        promptId &&
        typeof promptId === "string" &&
        resume &&
        typeof resume === "string",
      "invalid params"
    )
  ) {
    // Check if the user is not the prompt owner
    const prompt = await api.db.findOne("prompts", { _id: promptId });
    if (prompt.user !== api.sender) {
      // Checking if user has already applied to this prompt
      const existingApplication = await api.db.findOne("application", {
        user: api.sender,
        promptId,
      });

      if (existingApplication === null) {
        // Create entry in application table
        const application = await api.db.insert("application", {
          user: api.sender,
          promptId,
          coverletter,
          resume,
        });

        api.emit("application_created", application);
      }
    }
  }
};

actions.getAllApplications = async (payload) => {
  const { promptId } = payload;

  if (api.assert(promptId && typeof promptId === "string", "invalid params")) {
    const applications = await api.db.findInTable("application", { promptId });
    return { applications };
  }

  return { success: false };
};

actions.getApplication = async (payload) => {
  const { promptId, applicationId } = payload;

  if (
    api.assert(
      promptId &&
        typeof promptId === "string" &&
        applicationId &&
        typeof applicationId === "string",
      "invalid params"
    )
  ) {
    const application = await api.db.findOne("application", {
      _id: applicationId,
      promptId,
    });
    return { application };
  }

  return { success: false };
};
