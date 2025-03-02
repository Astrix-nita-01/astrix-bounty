/* eslint-disable */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable func-names */

const assert = require('assert');
const { MongoClient } = require('mongodb');
const { Base64 } = require('js-base64');

const { CONSTANTS } = require('../libs/Constants');
const { Database } = require('../libs/Database');
const blockchain = require('../plugins/Blockchain');
const { Transaction } = require('../libs/Transaction');
const { setupContractPayload } = require('../libs/util/contractUtil');
const { Fixture, conf } = require('../libs/util/testing/Fixture');
const { TableAsserts } = require('../libs/util/testing/TableAsserts');
const { assertError } = require('../libs/util/testing/Asserts');

const contractPayload = setupContractPayload('astrixbounty', './contracts/astrixbounty.js');

const fixture = new Fixture();
const tableAsserts = new TableAsserts(fixture);

// smart contract
describe('Astrixbounty Smart Contract', function () {
    this.timeout(20000);

    before((done) => {
        new Promise(async (resolve) => {
            client = await MongoClient.connect(conf.databaseURL, { useNewUrlParser: true, useUnifiedTopology: true });
            db = await client.db(conf.databaseName);
            await db.dropDatabase();
            resolve();
        })
        .then(() => {
            done();
        });
    });

    after((done) => {
        new Promise(async (resolve) => {
            await client.close();
            resolve();
        })
        .then(() => {
            done();
        });
    });

    beforeEach((done) => {
        new Promise(async (resolve) => {
            db = await client.db(conf.databaseName);
            resolve();
        })
        .then(() => {
            done();
        });
    });

    afterEach((done) => {
            // runs after each test in this block
            new Promise(async (resolve) => {
            fixture.tearDown();
            await db.dropDatabase();
            resolve();
        })
        .then(() => {
            done();
        });
    });

    it('should not create userprofile', (done) => {
        new Promise(async (resolve) => {

            await fixture.setUp();

            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ "isSignedWithActiveKey": false, "profilepicture": "myprofilepicture", "description": "this is a profile description", "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }, { title: "project2", description: "project2 description", link: "project2.com" }], "skills": ["skill1", "skill2"] })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ "isSignedWithActiveKey": true, "profilepicture": 1, "description": "this is a profile description", "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }, { title: "project2", description: "project2 description", link: "project2.com" }], "skills": ["skill1", "skill2"] })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ "isSignedWithActiveKey": true, "profilepicture": "myprofilepicture", "description": 156, "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }, { title: "project2", description: "project2 description", link: "project2.com" }], "skills": ["skill1", "skill2"] })));

            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };

            await fixture.sendBlock(block);

            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            assertError(txs[1], 'you must use a custom_json signed with your active key');
            assertError(txs[2], 'invalid params');
            assertError(txs[3], 'invalid params');

            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should create userprofile', (done) => {
        new Promise(async (resolve) => {

            await fixture.setUp();

            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ "isSignedWithActiveKey": true, "profilepicture": "myprofilepicture", "description": "this is a profile description", "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }, { title: "project2", description: "project2 description", link: "project2.com" }], "skills": ["skill1", "skill2"] })));

            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };

            await fixture.sendBlock(block);

            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            await tableAsserts.assertNoErrorInLastBlock();

            const eventLog = JSON.parse(res.transactions[1].logs);
            const userUpdateEvent = eventLog.events.find(x => x.event === 'userprofile_created');
            assert.equal(userUpdateEvent.data.user, 'ali-h');

            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not create userprofile as it already exist', (done) => {
        new Promise(async (resolve) => {

            await fixture.setUp();

            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ "isSignedWithActiveKey": true, "profilepicture": "myprofilepicture", "description": "this is a profile description", "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }, { title: "project2", description: "project2 description", link: "project2.com" }], "skills": ["skill1", "skill2"] })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ "isSignedWithActiveKey": true, "profilepicture": "myprofilepicture", "description": "this is a profile description 2", "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }, { title: "project2", description: "project2 description", link: "project2.com" }], "skills": ["skill1", "skill2"] })));

            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };

            await fixture.sendBlock(block);

            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            const eventLog = JSON.parse(txs[2].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'error');
            assert.equal(userGetEvent.data.error, 'user already has a profile');

            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should update userprofile', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill1", "skill2"] 
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'updateProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getProfile', JSON.stringify({ 
                "username": "ali-h" 
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            const eventLog = JSON.parse(res.transactions[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'userprofile');
            assert.equal(userGetEvent.data.user, 'ali-h');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not update userprofile', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'updateProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            const eventLog = JSON.parse(res.transactions[1].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'error');
            assert.equal(userGetEvent.data.error, 'user does not have a profile');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should return senders userprofile', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getOwnProfile'));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(res.transactions[2].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'userprofile');
            assert.equal(userGetEvent.data.user, 'ali-h');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should post prompt as user exists', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[2].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            assert.equal(userGetEvent.data.title, 'This is prompt title');
            assert.equal(userGetEvent.data.description, 'This is prompt description');
            assert.equal(userGetEvent.data.category, 'category1');
            assert.equal(userGetEvent.data.promptFile, 'promptfile');
            assert.equal(userGetEvent.data.budgetRange[0], 100);
            assert.equal(userGetEvent.data.budgetRange[1], 200);
            assert.equal(userGetEvent.data.skillsRequired[0], 'skill1');
            assert.equal(userGetEvent.data.skillsRequired[1], 'skill2');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not post prompt as user does not exists', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[1].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'error');
            assert.equal(userGetEvent.data.error, 'user does not have a profile');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should post and get that prompt by promptId', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[2].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getPrompt', JSON.stringify({ 
                "promptId": promptId
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            
            const eventLog2 = JSON.parse(txs2[0].logs);
            const userGetEvent2 = eventLog2.events.find(x => x.event === 'prompt');
            
            assert.equal(userGetEvent2.data.user, 'ali-h');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should post but not get that prompt by promptId as invalid params', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[2].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getPrompt', JSON.stringify({ 
                "promptId": "1"
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            
            assertError(txs2[0], 'invalid params');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not get prompt as it does not exist', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getPrompt', JSON.stringify({ 
                "promptId": 1
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;
            
            assertError(txs[2], 'prompt does not exist');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should post and get all prompts', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getAllPrompts'));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'all_prompts');
            
            assert.equal(userGetEvent.data[0].user, 'ali-h');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not get any prompt as there is no prompts available', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getAllPrompts'));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;

            assertError(txs[2], 'no prompts found');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not be able to update prompt as user is not the owner', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'updatePrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category2",
                "promptFile": "promptfile2",
                "budgetRange": [200, 400],
                "skillsRequired": ["skill10", "skill6"]
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            
            assertError(txs2[0], 'user is not the prompt owner');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should be able to update prompt as user is the owner', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'updatePrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "title": "This is updated prompt title",
                "description": "This is prompt description",
                "category": "category2",
                "promptFile": "promptfile2",
                "budgetRange": [200, 400],
                "skillsRequired": ["skill10", "skill6"]
            })));
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getPrompt', JSON.stringify({ 
                "promptId": promptId
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            
            const eventLog2 = JSON.parse(txs2[1].logs);
            const userGetEvent2 = eventLog2.events.find(x => x.event === 'prompt');

            assert.equal(userGetEvent2.data.title, 'This is updated prompt title');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should be a successful application', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "coverletter": "I want to apply for this prompt",
                "resume": "myresume",
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            console.log(txs2);
            
            const eventLog2 = JSON.parse(txs2[0].logs);
            const userGetEvent2 = eventLog2.events.find(x => x.event === 'application_created');

            assert.equal(userGetEvent2.data.user, 'roonie');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not be a successful application as prompt does not exist', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": 1,
                "coverletter": "I want to apply for this prompt",
                "resume": "myresume",
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            console.log(txs2);

            assertError(txs2[0], 'prompt does not exist');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not be a successful application as user is the owner of the prompt', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "coverletter": "I want to apply for this prompt",
                "resume": "myresume",
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            console.log(txs2);

            assertError(txs2[0], 'user is the owner of this prompt');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not be a successful application as user has already applied for this prompt', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "coverletter": "I want to apply for this prompt",
                "resume": "myresume",
            })));
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "coverletter": "I want to apply for this prompt twice",
                "resume": "myresume2",
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            console.log(txs2);
            
            assertError(txs2[1], 'user has already applied for this prompt');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should get all applications', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "coverletter": "I want to apply for this prompt",
                "resume": "myresume",
            })));
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getAllApplications', JSON.stringify({ 
                "promptId": promptId
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            console.log(txs2);
            
            const eventLog2 = JSON.parse(txs2[1].logs);
            const userGetEvent2 = eventLog2.events.find(x => x.event === 'all_applications');

            assert.equal(userGetEvent2.data[0].user, 'roonie');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not get any applications as there is no application', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getAllApplications', JSON.stringify({ 
                "promptId": promptId
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            
            assertError(txs2[0], 'no applications found');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should get the application by promptId and applicationId', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);
            

            const refBlockNumber2 = fixture.getNextRefBlockNumber();
            const transactions2 = [];
            transactions2.push(new Transaction(refBlockNumber2, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'applyToPromt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "promptId": promptId,
                "coverletter": "I want to apply for this prompt",
                "resume": "myresume",
            })));
            
            const block2 = {
                refHiveBlockNumber: refBlockNumber2,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:01:00',
                transactions: transactions2,
            };

            
            await fixture.sendBlock(block2);
    
            const res2 = await fixture.database.getLatestBlockInfo();
            const txs2 = res2.transactions;
            console.log(txs2);
            
            const eventLog2 = JSON.parse(txs2[0].logs);
            const userGetEvent2 = eventLog2.events.find(x => x.event === 'application_created');

            const applicationId = userGetEvent2.data._id;

            const refBlockNumber3 = fixture.getNextRefBlockNumber();
            const transactions3 = [];
            transactions3.push(new Transaction(refBlockNumber3, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getApplication', JSON.stringify({ 
                "applicationId": applicationId,
                "promptId": promptId,
            })));
            
            const block3 = {
                refHiveBlockNumber: refBlockNumber3,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:02:00',
                transactions: transactions3,
            };

            
            await fixture.sendBlock(block3);
    
            const res3 = await fixture.database.getLatestBlockInfo();
            const txs3 = res3.transactions;

            console.log("txs3: ", txs3);

            const eventLog3 = JSON.parse(txs3[0].logs);
            const userGetEvent3 = eventLog3.events.find(x => x.event === 'application');

            assert(userGetEvent3.data.user, 'roonie');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });

    it('should not get the application by promptId and applicationId as application does not exist', (done) => {
        new Promise(async (resolve) => {
            await fixture.setUp();
    
            const refBlockNumber = fixture.getNextRefBlockNumber();
            const transactions = [];
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), CONSTANTS.HIVE_ENGINE_ACCOUNT, 'contract', 'deploy', JSON.stringify(contractPayload)));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture", 
                "description": "this is a profile description", 
                "projects": [{ title: "project1", description: "project1 description", link: "project1.com" }], 
                "skills": ["skill4", "skill3"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'roonie', 'astrixbounty', 'createProfile', JSON.stringify({ 
                "isSignedWithActiveKey": true, 
                "profilepicture": "myprofilepicture20",
                "description": "this is another profile description", 
                "projects": [{ title: "project20", description: "project20 description", link: "project20.com" }], 
                "skills": ["skill6", "skill8"]
            })));
            transactions.push(new Transaction(refBlockNumber, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'postPrompt', JSON.stringify({ 
                "isSignedWithActiveKey": true,
                "title": "This is prompt title",
                "description": "This is prompt description",
                "category": "category1",
                "promptFile": "promptfile",
                "budgetRange": [100, 200],
                "skillsRequired": ["skill1", "skill2"]
            })));
    
            const block = {
                refHiveBlockNumber: refBlockNumber,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:00:00',
                transactions,
            };
    
            await fixture.sendBlock(block);
    
            const res = await fixture.database.getLatestBlockInfo();
            const txs = res.transactions;


            const eventLog = JSON.parse(txs[3].logs);
            const userGetEvent = eventLog.events.find(x => x.event === 'prompt_created');
            
            const promptId = userGetEvent.data._id;
            console.log("promptId: ", promptId);

            const refBlockNumber3 = fixture.getNextRefBlockNumber();
            const transactions3 = [];
            transactions3.push(new Transaction(refBlockNumber3, fixture.getNextTxId(), 'ali-h', 'astrixbounty', 'getApplication', JSON.stringify({ 
                "applicationId": 1,
                "promptId": promptId,
            })));
            
            const block3 = {
                refHiveBlockNumber: refBlockNumber3,
                refHiveBlockId: 'ABCD1',
                prevRefHiveBlockId: 'ABCD2',
                timestamp: '2018-06-01T00:02:00',
                transactions: transactions3,
            };

            
            await fixture.sendBlock(block3);
    
            const res3 = await fixture.database.getLatestBlockInfo();
            const txs3 = res3.transactions;

            console.log("txs3: ", txs3);

            assertError(txs3[0], 'application does not exist');
    
            resolve();
        })
        .then(() => {
            fixture.tearDown();
            done();
        });
    });
});
