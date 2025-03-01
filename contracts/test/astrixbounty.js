/* eslint-disable */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable func-names */

const assert = require("assert");
const { MongoClient } = require("mongodb");
const { Base64 } = require("js-base64");

const { CONSTANTS } = require("../libs/Constants");
const { Database } = require("../libs/Database");
const blockchain = require("../plugins/Blockchain");
const { Transaction } = require("../libs/Transaction");
const { setupContractPayload } = require("../libs/util/contractUtil");
const { Fixture, conf } = require("../libs/util/testing/Fixture");
const { TableAsserts } = require("../libs/util/testing/TableAsserts");
const { assertError } = require("../libs/util/testing/Asserts");

const contractPayload = setupContractPayload(
  "astrixbounty",
  "./contracts/astrixbounty.js"
);

const fixture = new Fixture();
const tableAsserts = new TableAsserts(fixture);

// smart contract
describe("Astrixbounty Smart Contract", function () {
  this.timeout(20000);

  before((done) => {
    new Promise(async (resolve) => {
      client = await MongoClient.connect(conf.databaseURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      db = await client.db(conf.databaseName);
      await db.dropDatabase();
      resolve();
    }).then(() => {
      done();
    });
  });

  after((done) => {
    new Promise(async (resolve) => {
      await client.close();
      resolve();
    }).then(() => {
      done();
    });
  });

  beforeEach((done) => {
    new Promise(async (resolve) => {
      db = await client.db(conf.databaseName);
      resolve();
    }).then(() => {
      done();
    });
  });

  afterEach((done) => {
    // runs after each test in this block
    new Promise(async (resolve) => {
      fixture.tearDown();
      await db.dropDatabase();
      resolve();
    }).then(() => {
      done();
    });
  });

  it("should not create userprofile", (done) => {
    new Promise(async (resolve) => {
      await fixture.setUp();

      const refBlockNumber = fixture.getNextRefBlockNumber();
      const transactions = [];

      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          CONSTANTS.HIVE_ENGINE_ACCOUNT,
          "contract",
          "deploy",
          JSON.stringify(contractPayload)
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: false,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
              {
                title: "project2",
                description: "project2 description",
                link: "project2.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: 1,
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
              {
                title: "project2",
                description: "project2 description",
                link: "project2.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: 156,
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
              {
                title: "project2",
                description: "project2 description",
                link: "project2.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );

      const block = {
        refHiveBlockNumber: refBlockNumber,
        refHiveBlockId: "ABCD1",
        prevRefHiveBlockId: "ABCD2",
        timestamp: "2018-06-01T00:00:00",
        transactions,
      };

      await fixture.sendBlock(block);

      const res = await fixture.database.getLatestBlockInfo();
      const txs = res.transactions;

      assertError(
        txs[1],
        "you must use a custom_json signed with your active key"
      );
      assertError(txs[2], "invalid params");
      assertError(txs[3], "invalid params");

      resolve();
    }).then(() => {
      fixture.tearDown();
      done();
    });
  });

  it("should create userprofile", (done) => {
    new Promise(async (resolve) => {
      await fixture.setUp();

      const refBlockNumber = fixture.getNextRefBlockNumber();
      const transactions = [];
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          CONSTANTS.HIVE_ENGINE_ACCOUNT,
          "contract",
          "deploy",
          JSON.stringify(contractPayload)
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
              {
                title: "project2",
                description: "project2 description",
                link: "project2.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );

      const block = {
        refHiveBlockNumber: refBlockNumber,
        refHiveBlockId: "ABCD1",
        prevRefHiveBlockId: "ABCD2",
        timestamp: "2018-06-01T00:00:00",
        transactions,
      };

      await fixture.sendBlock(block);

      const res = await fixture.database.getLatestBlockInfo();
      const txs = res.transactions;

      await tableAsserts.assertNoErrorInLastBlock();

      const eventLog = JSON.parse(res.transactions[1].logs);
      const userUpdateEvent = eventLog.events.find(
        (x) => x.event === "userprofile_created"
      );
      assert.equal(userUpdateEvent.data.user, "ali-h");

      resolve();
    }).then(() => {
      fixture.tearDown();
      done();
    });
  });

  it("should not create userprofile as it already exist", (done) => {
    new Promise(async (resolve) => {
      await fixture.setUp();

      const refBlockNumber = fixture.getNextRefBlockNumber();
      const transactions = [];
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          CONSTANTS.HIVE_ENGINE_ACCOUNT,
          "contract",
          "deploy",
          JSON.stringify(contractPayload)
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
              {
                title: "project2",
                description: "project2 description",
                link: "project2.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description 2",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
              {
                title: "project2",
                description: "project2 description",
                link: "project2.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );

      const block = {
        refHiveBlockNumber: refBlockNumber,
        refHiveBlockId: "ABCD1",
        prevRefHiveBlockId: "ABCD2",
        timestamp: "2018-06-01T00:00:00",
        transactions,
      };

      await fixture.sendBlock(block);

      const res = await fixture.database.getLatestBlockInfo();
      const txs = res.transactions;

      const eventLog = JSON.parse(txs[2].logs);
      const userGetEvent = eventLog.events.find((x) => x.event === "error");
      assert.equal(userGetEvent.data.error, "user already has a profile");

      resolve();
    }).then(() => {
      fixture.tearDown();
      done();
    });
  });

  it("should update userprofile", (done) => {
    new Promise(async (resolve) => {
      await fixture.setUp();

      const refBlockNumber = fixture.getNextRefBlockNumber();
      const transactions = [];
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          CONSTANTS.HIVE_ENGINE_ACCOUNT,
          "contract",
          "deploy",
          JSON.stringify(contractPayload)
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
            ],
            skills: ["skill1", "skill2"],
          })
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "updateProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
            ],
            skills: ["skill4", "skill3"],
          })
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "getProfile",
          JSON.stringify({
            username: "ali-h",
          })
        )
      );

      const block = {
        refHiveBlockNumber: refBlockNumber,
        refHiveBlockId: "ABCD1",
        prevRefHiveBlockId: "ABCD2",
        timestamp: "2018-06-01T00:00:00",
        transactions,
      };

      await fixture.sendBlock(block);

      const res = await fixture.database.getLatestBlockInfo();
      const txs = res.transactions;

      const eventLog = JSON.parse(res.transactions[3].logs);
      const userGetEvent = eventLog.events.find(
        (x) => x.event === "userprofile"
      );
      assert.equal(userGetEvent.data.user, "ali-h");

      resolve();
    }).then(() => {
      fixture.tearDown();
      done();
    });
  });

  it("should not update userprofile", (done) => {
    new Promise(async (resolve) => {
      await fixture.setUp();

      const refBlockNumber = fixture.getNextRefBlockNumber();
      const transactions = [];
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          CONSTANTS.HIVE_ENGINE_ACCOUNT,
          "contract",
          "deploy",
          JSON.stringify(contractPayload)
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "updateProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
            ],
            skills: ["skill4", "skill3"],
          })
        )
      );

      const block = {
        refHiveBlockNumber: refBlockNumber,
        refHiveBlockId: "ABCD1",
        prevRefHiveBlockId: "ABCD2",
        timestamp: "2018-06-01T00:00:00",
        transactions,
      };

      await fixture.sendBlock(block);

      const res = await fixture.database.getLatestBlockInfo();
      const txs = res.transactions;

      const eventLog = JSON.parse(res.transactions[1].logs);
      const userGetEvent = eventLog.events.find((x) => x.event === "error");
      assert.equal(userGetEvent.data.error, "user does not have a profile");

      resolve();
    }).then(() => {
      fixture.tearDown();
      done();
    });
  });

  it("should return senders userprofile", (done) => {
    new Promise(async (resolve) => {
      await fixture.setUp();

      const refBlockNumber = fixture.getNextRefBlockNumber();
      const transactions = [];
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          CONSTANTS.HIVE_ENGINE_ACCOUNT,
          "contract",
          "deploy",
          JSON.stringify(contractPayload)
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "createProfile",
          JSON.stringify({
            isSignedWithActiveKey: true,
            profilepicture: "myprofilepicture",
            description: "this is a profile description",
            projects: [
              {
                title: "project1",
                description: "project1 description",
                link: "project1.com",
              },
            ],
            skills: ["skill4", "skill3"],
          })
        )
      );
      transactions.push(
        new Transaction(
          refBlockNumber,
          fixture.getNextTxId(),
          "ali-h",
          "astrixbounty",
          "getOwnProfile"
        )
      );

      const block = {
        refHiveBlockNumber: refBlockNumber,
        refHiveBlockId: "ABCD1",
        prevRefHiveBlockId: "ABCD2",
        timestamp: "2018-06-01T00:00:00",
        transactions,
      };

      await fixture.sendBlock(block);

      const res = await fixture.database.getLatestBlockInfo();
      const txs = res.transactions;

      console.log(txs);

      const eventLog = JSON.parse(res.transactions[2].logs);
      const userGetEvent = eventLog.events.find(
        (x) => x.event === "userprofile"
      );
      assert.equal(userGetEvent.data.user, "ali-h");

      resolve();
    }).then(() => {
      fixture.tearDown();
      done();
    });
  });
});
