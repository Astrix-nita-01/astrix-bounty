import {
  logs,
  contract,
  reset,
  stateCache,
  contractEnv,
  setContractImport,
  finalizeTransaction,
} from "@vsc.eco/contract-testing-utils";
import { expect } from "chai";

const beforeAll = globalThis.beforeAll || globalThis.before;
const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("astrix-bounty-profile", () => {
  beforeEach(reset);

  it("should create profile for user", () => {
    // Set up sender context
    contractEnv["msg.sender"] = "john";

    // Create the profile
    const profileData1 = {
      skills: ["skill1", "skill2"],
      projects: [{ 
        title: "project1", 
        description: "This is a project description", 
        link: "https://project1.com"
      }],
      description: "This is a profile description",
      profilepicture: "profilepicture"
    };

    const result1 = contract.crecreateProfile(JSON.stringify(profileData1));
    
    // Verify the return value
    expect(result1).to.equal(
      JSON.stringify({
        code: 0,
        msg: "PROFILE_CREATED"
      })
    );

    // Finalize the transaction to ensure state is updated
    finalizeTransaction();

    expect(logs).to.deep.equal([
      "sender: john",
    ]);

    const storedProfile1 = stateCache.get(`userprofile/john`);
    console.log(storedProfile1);
    expect(storedProfile1).to.not.be.empty;
    expect(JSON.parse(storedProfile1)).to.deep.equal({ username: 'john', ...profileData1});
  });

  it("should create profile for user with empty skills and projects array", () => {
    // Set up sender context
    contractEnv["msg.sender"] = "jane";

    // Profile with empty skills and projects array
    const profileData2 = {
      skills: [],
      projects: [],
      description: "This is a profile description",
      profilepicture: "profilepicture"
    };

    const result2 = contract.crecreateProfile(JSON.stringify(profileData2));

    console.log("result2: ", result2);
    
    // Verify the return value
    expect(result2).to.equal(
      JSON.stringify({
        code: 0,
        msg: "PROFILE_CREATED"
      })
    );

    // Finalize the transaction to ensure state is updated
    finalizeTransaction();

    expect(logs).to.deep.equal([
      "sender: jane"
    ]);

    const storedProfile2 = stateCache.get(`userprofile/jane`);
    console.log("profile with empty skills and projects: ", storedProfile2);
    expect(storedProfile2).to.not.be.empty;
    expect(JSON.parse(storedProfile2)).to.deep.equal({ username: 'jane', ...profileData2});
  });

  it("should fail to create profile with invalid data", () => {
    // Set up sender context
    contractEnv["msg.sender"] = "john";


    // Test case 1: Missing required fields
    const invalidData1 = {
      skills: ["skill1", "skill2"],
      // missing projects, description, profilepicture
    };
    
    expect(contract.crecreateProfile(JSON.stringify(invalidData1))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "MISSING_REQUIRED_FIELDS"
      })
    );

    // Test case 2: Missing skills
    const invalidData2 = {
      projects: [{
        title: "project1",
        description: "project dsc",
        link: "link"
      }],
      description: "desc",
      profilepicture: "pic"
      // missing skills
    };
    
    expect(contract.crecreateProfile(JSON.stringify(invalidData2))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "MISSING_REQUIRED_FIELDS"
      })
    );

    // Test case 3: Invalid projects structure
    const invalidData3 = {
      skills: ["skill1"],
      projects: [{ 
        // missing required project fields
        title: "project1"
        // missing description and link
      }],
      description: "desc",
      profilepicture: "pic"
    };

    expect(contract.crecreateProfile(JSON.stringify(invalidData3))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "INVALID_PROJECT_DATA"
      })
    );

    // Test case 4: no project data
    const invalidData4 = {
      skills: ["skill1"],
      description: "desc",
      profilepicture: "pic"
    };

    expect(contract.crecreateProfile(JSON.stringify(invalidData4))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "PROJECTS_FIELD_MISSING"
      })
    );

    // Verify no profiles were stored
    finalizeTransaction();
    const storedProfile = stateCache.get(`userprofile/john`);
    console.log("stored: ", storedProfile);
    expect(storedProfile).to.be.undefined;
  });

  it("should get profile for user", async () => {
      // Set up sender context
    contractEnv["msg.sender"] = "john";
      
      const profileData = {
        skills: ["skill1", "skill2"],
        projects: [{ 
          title: "project1", 
          description: "This is a project description", 
          link: "https://project1.com"
        }],
        description: "This is a profile description",
        profilepicture: "profilepicture"
      };

      // Create profile first
      contract.crecreateProfile(JSON.stringify(profileData));
      finalizeTransaction();

      // Now try to get the profile
      const result = contract.getProfile(JSON.stringify({ username: "john" }));
      
      const parsedResult = JSON.parse(result);
      expect(parsedResult.code).to.equal(0);
      expect(parsedResult.msg).to.equal("PROFILE_FOUND");
      expect(parsedResult.profile).to.deep.equal({
        username: "john",
        ...profileData
      });
  });

  it("should not get profile for user", async () => {
      // Test case 1: Non-existent user
      const result1 = contract.getProfile(JSON.stringify({ 
        username: "nonexistent" 
      }));

      console.log("nonexistent: ", result1);
      
      expect(result1).to.equal(
        JSON.stringify({
          code: 1,
          msg: "PROFILE_NOT_FOUND"
        })
      );

      // Test case 2: Missing username field
      const result2 = contract.getProfile(JSON.stringify({}));
      
      expect(result2).to.equal(
        JSON.stringify({
          code: 1,
          msg: "MISSING_REQUIRED_FIELDS"
        })
      );

      // Test case 3: Empty username
      const result3 = contract.getProfile(JSON.stringify({ 
        username: "" 
      }));
      
      expect(result3).to.equal(
        JSON.stringify({
          code: 1,
          msg: "PROFILE_NOT_FOUND"
        })
      );

      // Verify no state changes occurred
      finalizeTransaction();

      expect(stateCache.get(`userprofile/nonexistent`)).to.be.undefined;
  });

  it("should update existing profile", async () => {
    // First create a profile
    contractEnv["msg.sender"] = "john";
    
    const initialProfile = {
      skills: ["skill1"],
      projects: [{ 
        title: "project1", 
        description: "Initial description", 
        link: "https://project1.com"
      }],
      description: "Initial profile description",
      profilepicture: "initial.jpg"
    };

    contract.crecreateProfile(JSON.stringify(initialProfile));
    await finalizeTransaction();

    // Now update the profile
    const updatedData = {
      skills: ["skill2", "skill3"],
      projects: [{ 
        title: "project2", 
        description: "Updated description", 
        link: "https://project2.com"
      }],
      description: "Updated profile description",
      profilepicture: "updated.jpg"
    };

    const result = contract.updateProfile(JSON.stringify(updatedData));
    
    expect(result).to.equal(
      JSON.stringify({
        code: 0,
        msg: "PROFILE_UPDATED"
      })
    );

    await finalizeTransaction();

    // Verify the profile was updated
    const storedProfile = stateCache.get(`userprofile/john`);
    expect(JSON.parse(storedProfile)).to.deep.equal({
      username: "john",
      ...updatedData
    });
  });

  it("should fail to update non-existent profile", () => {
    contractEnv["msg.sender"] = "john";
    
    const updateData = {
      skills: ["skill1"],
      projects: [{
        title: "project1", 
        description: "Description", 
        link: "https://link.com"
      }],
      description: "Description",
      profilepicture: "pic.jpg"
    };

    expect(contract.updateProfile(JSON.stringify(updateData))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "PROFILE_NOT_FOUND"
      })
    );
  });

  it("should fail to update with invalid data", () => {
    // First create a valid profile
    contractEnv["msg.sender"] = "john";
    const initialProfile = {
      skills: ["skill1"],
      projects: [{ 
        title: "project1", 
        description: "Description", 
        link: "https://link.com"
      }],
      description: "Description",
      profilepicture: "pic.jpg"
    };
    contract.crecreateProfile(JSON.stringify(initialProfile));
    finalizeTransaction();

    // Test case 1: Missing required fields
    const invalidData1 = {
      skills: ["skill1"]
      // missing other required fields
    };
    
    expect(contract.updateProfile(JSON.stringify(invalidData1))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "MISSING_REQUIRED_FIELDS"
      })
    );

    // Test case 2: Invalid project structure
    const invalidData2 = {
      skills: ["skill1"],
      projects: [{ 
        title: "project1"
        // missing description and link
      }],
      description: "Description",
      profilepicture: "pic.jpg"
    };

    expect(contract.updateProfile(JSON.stringify(invalidData2))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "INVALID_PROJECT_DATA"
      })
    );

    // Verify profile wasn't changed
    const storedProfile = stateCache.get(`userprofile/john`);
    expect(JSON.parse(storedProfile)).to.deep.equal({
      username: "john",
      ...initialProfile
    });
  });

  it("should fail with unauthorized access", () => {
    contractEnv["msg.sender"] = "";  // Empty sender
    
    const updateData = {
      skills: ["skill1"],
      projects: [{ 
        title: "project1", 
        description: "Description", 
        link: "https://link.com"
      }],
      description: "Description",
      profilepicture: "pic.jpg"
    };

    expect(contract.updateProfile(JSON.stringify(updateData))).to.equal(
      JSON.stringify({
        code: 1,
        msg: "UNAUTHORIZED_ACCESS"
      })
    );
  });

  it("should get own profile successfully", async () => {
    // First create a profile
    contractEnv["msg.sender"] = "john"
    
    const profileData = {
      skills: ["skill1", "skill2"],
      projects: [{ 
        title: "project1", 
        description: "This is a project description", 
        link: "https://project1.com"
      }],
      description: "This is a profile description",
      profilepicture: "profilepicture"
    };

    // Create profile
    contract.crecreateProfile(JSON.stringify(profileData));
    finalizeTransaction();

    // Get own profile
    const result = contract.getOwnProfile();
    const parsedResult = JSON.parse(result);
    
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("PROFILE_FOUND");
    expect(parsedResult.profile).to.deep.equal({
      username: "john",
      ...profileData
    });
  });

  it("should fail with unauthorized access", () => {
    // Test with empty sender
    contractEnv["msg.sender"] = ""
    
    const result = contract.getOwnProfile();
    
    expect(result).to.equal(
      JSON.stringify({
        code: 1,
        msg: "UNAUTHORIZED_ACCESS"
      })
    );
  });

  it("should fail when profile does not exist", () => {
    // Set a sender without profile
    contractEnv["msg.sender"] = ""
    
    const result = contract.getOwnProfile();
    
    expect(result).to.equal(
      JSON.stringify({
        code: 1,
        msg: "UNAUTHORIZED_ACCESS"
      })
    );
  });
});


describe("astrix-bounty-prompts", () => {
  beforeEach(reset);

  it("should create a new prompt successfully", async () => {
    contractEnv["msg.sender"] = "john"
    
    const promptData = {
        title: "Web3 Development Project",
        description: "Need a developer for blockchain project",
        category: "Blockchain",
        promptFile: "requirements.pdf",
        budgetRange: "$1000-$2000",
        skillsRequired: ["Solidity", "JavaScript", "Web3"]
    };

    const result = contract.postPrompt(JSON.stringify(promptData));
    const parsedResult = JSON.parse(result);
    
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("PROMPT_CREATED");
    
    const promptId = parsedResult.promptId;

    finalizeTransaction();

    // Verify prompt storage
    const prompts = stateCache.get("prompts");
    const parsedPrompts = JSON.parse(prompts);

    const requiredPrompt = parsedPrompts.find((prompt) => {
      return prompt.creator === "john";
    })

    console.log("requiredPrompt: ", requiredPrompt);
    
    expect(requiredPrompt).to.deep.equal({
      creator: "john",
      promptId: promptId,
      title: promptData.title,
      description: promptData.description,
      category: promptData.category,
      promptFile: promptData.promptFile,
      budgetRange: promptData.budgetRange,
      skillsRequired: promptData.skillsRequired
    });
  });

  it("should fail with unauthorized access", () => {
      contractEnv["msg.sender"] = "";
      
      const promptData = {
          title: "Test Project",
          description: "Test Description",
          category: "Test",
          promptFile: "test.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
      };

      expect(contract.postPrompt(JSON.stringify(promptData))).to.equal(
          JSON.stringify({
              code: 1,
              msg: "UNAUTHORIZED_ACCESS"
          })
      );
  });

  it("should fail with missing required fields", () => {
      contractEnv["msg.sender"] = "john";
      
      const invalidData1 = {
          title: "Test Project"
          // Missing other required fields
      };

      expect(contract.postPrompt(JSON.stringify(invalidData1))).to.equal(
          JSON.stringify({
              code: 1,
              msg: "MISSING_REQUIRED_FIELDS"
          })
      );

      const invalidData2 = {
          title: "Test Project",
          description: "Test Description",
          category: "Test",
          budgetRange: "$100-$200",
          skillsRequired: [] // Empty skills array
      };

      expect(contract.postPrompt(JSON.stringify(invalidData2))).to.equal(
          JSON.stringify({
              code: 1,
              msg: "SKILLS_REQUIRED"
          })
      );
  });

  // it("should create multiple prompts with unique IDs", async () => {
  //     contractEnv["msg.sender"] = "john";
      
  //     const promptData1 = {
  //         title: "Project 1",
  //         description: "Description 1",
  //         category: "Category 1",
  //         promptFile: "file1.pdf",
  //         budgetRange: "$100-$200",
  //         skillsRequired: ["Skill1"]
  //     };

  //     const promptData2 = {
  //         title: "Project 2",
  //         description: "Description 2",
  //         category: "Category 2",
  //         promptFile: "file2.pdf",
  //         budgetRange: "$300-$400",
  //         skillsRequired: ["Skill2"]
  //     };

  //     contract.postPrompt(JSON.stringify(promptData1));
  //     finalizeTransaction();
      
  //     contract.postPrompt(JSON.stringify(promptData2));
  //     finalizeTransaction();

  //     // Verify both prompts were stored with unique IDs
  //     const storedPrompts = stateCache.get("prompts");
  //     const parsedStoredPrompts = JSON.parse(storedPrompts);
  //     console.log("Stored prompts: ", parsedStoredPrompts);
  //     expect(parsedStoredPrompts.length).to.equal(2);

      
  //     const prompt1 = parsedStoredPrompts[0];
  //     const prompt2 = parsedStoredPrompts[1];
      
  //     expect(prompt1.title).to.equal(promptData1.title);
  //     expect(prompt2.title).to.equal(promptData2.title);
  //     expect(prompt1.promptId).to.not.equal(prompt2.promptId);
  // });

  it("should get prompt by ID", async () => {
    // First create a prompt
    contractEnv["msg.sender"] = "john";
    
    const promptData = {
        title: "Test Project",
        description: "Test Description",
        category: "Test Category",
        promptFile: "test.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1", "Skill2"]
    };

    // Create prompt and get its ID
    const createResult = contract.postPrompt(JSON.stringify(promptData));
    const { promptId } = JSON.parse(createResult);
    finalizeTransaction();

    // Get prompt by ID
    const result = contract.getPromptById(JSON.stringify({ promptId }));
    const parsedResult = JSON.parse(result);
    
    // Verify response
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("PROMPT_FOUND");
    expect(parsedResult.prompt).to.deep.include({
        creator: "john",
        ...promptData
    });
    expect(parsedResult.prompt.promptId).to.equal(promptId);
  });

  it("should fail with invalid prompt ID", () => {
    const result = contract.getPromptById(JSON.stringify({
      promptId: "nonexistent_id"
    }));
    
    expect(result).to.equal(JSON.stringify({
        code: 1,
        msg: "NO_PROMPT_FOUND"
    }));
  });

  it("should get all prompts", async () => {
    contractEnv["msg.sender"] = "john";
    
    // Create multiple prompts
    const promptData1 = {
        title: "Project 1",
        description: "Description 1",
        category: "Category 1",
        promptFile: "file1.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1"]
    };

    const promptData2 = {
        title: "Project 2",
        description: "Description 2",
        category: "Category 2",
        promptFile: "file2.pdf",
        budgetRange: "$300-$400",
        skillsRequired: ["Skill2"]
    };

    // Create prompts
    contract.postPrompt(JSON.stringify(promptData1));
    await finalizeTransaction();
    
    contract.postPrompt(JSON.stringify(promptData2));
    await finalizeTransaction();

    // Get all prompts
    const result = contract.getAllPrompta();
    const parsedResult = JSON.parse(result);
    
    // Verify response
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("PROMPTS_FOUND");
    expect(parsedResult.prompts.length).to.equal(2);
    
    // Verify prompt contents
    const prompts = parsedResult.prompts;
    expect(prompts[0].title).to.equal(promptData1.title);
    expect(prompts[1].title).to.equal(promptData2.title);
  });

  it("should return empty array when no prompts exist", () => {
      const result = contract.getAllPrompta();
      const parsedResult = JSON.parse(result);
      
      expect(parsedResult.code).to.equal(0);
      expect(parsedResult.msg).to.equal("NO_PROMPTS");
      expect(parsedResult.prompts.length).to.equal(0);
  });

  it("should update existing prompt successfully", async () => {
    // First create a prompt
    contractEnv["msg.sender"] = "john";
    
    const initialPrompt = {
        title: "Initial Project",
        description: "Initial Description",
        category: "Initial Category",
        promptFile: "initial.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1"]
    };

    // Create prompt and get its ID
    const createResult = contract.postPrompt(JSON.stringify(initialPrompt));
    const { promptId } = JSON.parse(createResult);
    await finalizeTransaction();

    // Update the prompt
    const updateData = {
        promptId: promptId,
        title: "Updated Project",
        description: "Updated Description",
        category: "Updated Category",
        promptFile: "updated.pdf",
        budgetRange: "$300-$400",
        skillsRequired: ["Skill2", "Skill3"]
    };

    const updateResult = contract.updatePrompt(JSON.stringify(updateData));
    const parsedUpdateResult = JSON.parse(updateResult);
    
    expect(parsedUpdateResult.code).to.equal(0);
    expect(parsedUpdateResult.msg).to.equal("PROMPT_UPDATED");

    // Verify the update
    const getResult = contract.getPromptById(JSON.stringify({ promptId }));
    const parsedGetResult = JSON.parse(getResult);
    const updatedPrompt = parsedGetResult.prompt;
    
    expect(updatedPrompt.title).to.equal(updateData.title);
    expect(updatedPrompt.description).to.equal(updateData.description);
    expect(updatedPrompt.category).to.equal(updateData.category);
    expect(updatedPrompt.promptFile).to.equal(updateData.promptFile);
    expect(updatedPrompt.budgetRange).to.equal(updateData.budgetRange);
    expect(updatedPrompt.skillsRequired).to.deep.equal(updateData.skillsRequired);
  });

  it("should fail to update with missing prompt ID", () => {
      contractEnv["msg.sender"] = "john";
      
      const updateData = {
          title: "Updated Project",
          description: "Updated Description",
          category: "Category",
          promptFile: "file.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
          // Missing promptId
      };

      const result = contract.updatePrompt(JSON.stringify(updateData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "MISSING_PROMPT_ID"
      }));
  });

  it("should fail to update with missing required fields", () => {
      contractEnv["msg.sender"] = "john";
      
      const updateData = {
          promptId: "some_id",
          // Missing other required fields
          skillsRequired: ["Skill1"]
      };

      const result = contract.updatePrompt(JSON.stringify(updateData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "MISSING_REQUIRED_FIELDS"
      }));
  });

  it("should fail to update with empty skills array", async () => {
      // First create a prompt
      contractEnv["msg.sender"] = "john";
      
      const createResult = contract.postPrompt(JSON.stringify({
          title: "Project",
          description: "Description",
          category: "Category",
          promptFile: "file.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
      }));
      const { promptId } = JSON.parse(createResult);
      await finalizeTransaction();

      // Try to update with empty skills
      const updateData = {
          promptId: promptId,
          title: "Updated Project",
          description: "Updated Description",
          category: "Category",
          promptFile: "file.pdf",
          budgetRange: "$100-$200",
          skillsRequired: [] // Empty skills array
      };

      const result = contract.updatePrompt(JSON.stringify(updateData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "SKILLS_REQUIRED"
      }));
  });

  it("should fail to update other user's prompt", async () => {
      // Create prompt as john
      contractEnv["msg.sender"] = "john";
      const createResult = contract.postPrompt(JSON.stringify({
          title: "Project",
          description: "Description",
          category: "Category",
          promptFile: "file.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
      }));
      const { promptId } = JSON.parse(createResult);
      await finalizeTransaction();

      // Try to update as jane
      contractEnv["msg.sender"] = "jane";
      const updateData = {
          promptId: promptId,
          title: "Updated Project",
          description: "Updated Description",
          category: "Category",
          promptFile: "file.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
      };

      const result = contract.updatePrompt(JSON.stringify(updateData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "UNAUTHORIZED_ACCESS"
      }));
  });

  it("should fail to update non-existent prompt", () => {
      contractEnv["msg.sender"] = "john";
      
      const updateData = {
          promptId: "nonexistent_id",
          title: "Updated Project",
          description: "Updated Description",
          category: "Category",
          promptFile: "file.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
      };

      const result = contract.updatePrompt(JSON.stringify(updateData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "NO_PROMPTS_FOUND"
      }));
  });
});

describe("astrix-bounty-application", () => {
  beforeEach(reset);

  it("should submit application successfully", async () => {
    // First create a prompt as john
    contractEnv["msg.sender"] = "john";
    
    const promptData = {
        title: "Test Project",
        description: "Test Description",
        category: "Test Category",
        promptFile: "test.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1", "Skill2"]
    };

    const createResult = contract.postPrompt(JSON.stringify(promptData));
    const { promptId } = JSON.parse(createResult);
    finalizeTransaction();

    // Submit application as jane
    contractEnv["msg.sender"] = "jane";
    
    const applicationData = {
        promptId: promptId,
        coverletter: "I am interested in this project",
        resume: "myresume.pdf"
    };

    const result = contract.applyToPrompt(JSON.stringify(applicationData));
    const parsedResult = JSON.parse(result);
    
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("APPLICATION_SUBMITTED");
    expect(parsedResult.promptId).to.equal(promptId);
    expect(parsedResult.applicationId).to.contain("jane_" + promptId);

    // Verify application was stored
    const applications = JSON.parse(stateCache.get("applications"));
    expect(applications.length).to.equal(1);
    
    const storedApp = applications[0];
    expect(storedApp.applicant).to.equal("jane");
    expect(storedApp.promptId).to.equal(promptId);
    expect(storedApp.coverletter).to.equal(applicationData.coverletter);
    expect(storedApp.resume).to.equal(applicationData.resume);
    expect(storedApp.status).to.equal("APPLIED");
  });

  it("should fail when applying to own prompt", async () => {
    // Create prompt as john
    contractEnv["msg.sender"] = "john";
    
    const promptData = {
        title: "Test Project",
        description: "Description",
        category: "Category",
        promptFile: "test.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1"]
    };

    const createResult = contract.postPrompt(JSON.stringify(promptData));
    const { promptId } = JSON.parse(createResult);
    finalizeTransaction();

    // Try to apply to own prompt
    const applicationData = {
        promptId: promptId,
        coverletter: "My application",
        resume: "resume.pdf"
    };

    const result = contract.applyToPrompt(JSON.stringify(applicationData));
    expect(result).to.equal(JSON.stringify({
        code: 1,
        msg: "CANNOT_APPLY_TO_OWN_PROMPT"
    }));
  });

  it("should fail with missing required fields", () => {
      contractEnv["msg.sender"] = "jane";
      
      const invalidData = {
          promptId: "some_id"
          // Missing coverletter and resume
      };

      const result = contract.applyToPrompt(JSON.stringify(invalidData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "MISSING_REQUIRED_FIELDS"
      }));
  });

  it("should fail when applying to non-existent prompt", () => {
      contractEnv["msg.sender"] = "jane";
      
      const applicationData = {
          promptId: "nonexistent_id",
          coverletter: "My application",
          resume: "resume.pdf"
      };

      const result = contract.applyToPrompt(JSON.stringify(applicationData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "NO_PROMPTS_FOUND"
      }));
  });

  it("should prevent duplicate applications", async () => {
      // Create prompt as john
      contractEnv["msg.sender"] = "john";
      const createResult = contract.postPrompt(JSON.stringify({
          title: "Test Project",
          description: "Description",
          category: "Category",
          promptFile: "test.pdf",
          budgetRange: "$100-$200",
          skillsRequired: ["Skill1"]
      }));
      const { promptId } = JSON.parse(createResult);
      finalizeTransaction();

      // Submit first application as jane
      contractEnv["msg.sender"] = "jane";
      const applicationData = {
          promptId: promptId,
          coverletter: "First application",
          resume: "resume.pdf"
      };

      contract.applyToPrompt(JSON.stringify(applicationData));
      finalizeTransaction();

      // Try to submit second application
      const result = contract.applyToPrompt(JSON.stringify(applicationData));
      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "ALREADY_APPLIED"
      }));
  });

  it("should get application by ID successfully", async () => {
    // First create a prompt as john
    contractEnv["msg.sender"] = "john";
    const createPromptResult = contract.postPrompt(JSON.stringify({
        title: "Test Project",
        description: "Test Description",
        category: "Test Category",
        promptFile: "test.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1"]
    }));
    const { promptId } = JSON.parse(createPromptResult);
    await finalizeTransaction();

    // Submit application as jane
    contractEnv["msg.sender"] = "jane";
    const applicationData = {
        promptId: promptId,
        coverletter: "Test Cover Letter",
        resume: "resume.pdf"
    };

    const applyResult = contract.applyToPrompt(JSON.stringify(applicationData));
    const { applicationId } = JSON.parse(applyResult);
    await finalizeTransaction();

    // Get application by ID
    const result = contract.getApplicationById(JSON.stringify({ 
        promptId, 
        applicationId 
    }));
    const parsedResult = JSON.parse(result);

    // Verify response
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("APPLICATION_FOUND");
    expect(parsedResult.application.promptId).to.equal(promptId);
    expect(parsedResult.application.applicationId).to.equal(applicationId);
    expect(parsedResult.application.applicant).to.equal("jane");
    expect(parsedResult.application.coverletter).to.equal(applicationData.coverletter);
    expect(parsedResult.application.resume).to.equal(applicationData.resume);
    expect(parsedResult.application.status).to.equal("APPLIED");
  });

  it("should fail with missing fields", () => {
      const result1 = contract.getApplicationById(JSON.stringify({
          promptId: "some_prompt_id"
          // Missing applicationId
      }));
      
      expect(result1).to.equal(JSON.stringify({
          code: 1,
          msg: "MISSING_REQUIRED_FIELDS"
      }));

      const result2 = contract.getApplicationById(JSON.stringify({
          applicationId: "some_app_id"
          // Missing promptId
      }));

      expect(result2).to.equal(JSON.stringify({
          code: 1,
          msg: "MISSING_REQUIRED_FIELDS"
      }));
  });

  it("should fail with non-existent application", () => {
      const result = contract.getApplicationById(JSON.stringify({
          promptId: "nonexistent_prompt",
          applicationId: "nonexistent_app"
      }));

      expect(result).to.equal(JSON.stringify({
          code: 1,
          msg: "NO_APPLICATIONS_FOUND"
      }));
  });

  it("should get all applications successfully", async () => {
    // First create a prompt as john
    contractEnv["msg.sender"] = "john";
    const createResult = contract.postPrompt(JSON.stringify({
        title: "Test Project",
        description: "Test Description",
        category: "Test Category",
        promptFile: "test.pdf",
        budgetRange: "$100-$200",
        skillsRequired: ["Skill1"]
    }));
    const { promptId } = JSON.parse(createResult);
    await finalizeTransaction();

    // Submit applications from different users
    const applicants = ["jane", "alice", "bob"];
    for (let i = 0; i < applicants.length; i++) {
        contractEnv["msg.sender"] = applicants[i];
        await contract.applyToPrompt(JSON.stringify({
            promptId: promptId,
            coverletter: `Cover letter from ${applicants[i]}`,
            resume: `${applicants[i]}_resume.pdf`
        }));
        await finalizeTransaction();
    }

    // Get all applications
    const result = contract.getAllApplications();
    const parsedResult = JSON.parse(result);
    
    // Verify response
    expect(parsedResult.code).to.equal(0);
    expect(parsedResult.msg).to.equal("APPLICATIONS_FOUND");
    expect(parsedResult.applications.length).to.equal(3);
    
    // Verify each application
    const applications = parsedResult.applications;
    for (let i = 0; i < applications.length; i++) {
        expect(applications[i].promptId).to.equal(promptId);
        expect(applications[i].applicant).to.equal(applicants[i]);
        expect(applications[i].status).to.equal("APPLIED");
    }
  });

  it("should return empty array when no applications exist", () => {
      const result = contract.getAllApplications();
      const parsedResult = JSON.parse(result);
      
      expect(parsedResult.code).to.equal(0);
      expect(parsedResult.msg).to.equal("NO_APPLICATIONS");
      expect(parsedResult.applications.length).to.equal(0);
  });
});