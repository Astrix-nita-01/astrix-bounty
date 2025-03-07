import * as fs from "fs/promises";
import * as asc from "assemblyscript/dist/asc.js";

import { fileURLToPath } from "url";
import * as Path from "path";

import * as IPFS from "kubo-rpc-client";
import { Client, PrivateKey } from "@hiveio/dhive";

import * as kubo from "go-ipfs";
import { spawn } from "child_process";
import "dotenv/config";
import type { IPFSHTTPClient } from "kubo-rpc-client/dist/src/types";
import type { Message, SignedMessage } from "@libp2p/interface-pubsub";
import { BlsCircuit, BlsCircuitGenerator, decodeBase64 } from "./bls-did.js";
import * as mktemp from "mktemp";
import { encodePayload } from "dag-jose-utils";
import { bech32 } from "bech32";
import { fetch } from "cross-fetch";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const __dirname = Path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = Path.join(__dirname, "../assembly/index.ts");
  await deployContract(scriptPath);
}

const VSC_NODE_URL = process.env.VSC_NODE_HOST || "https://api.vsc.eco";

const IPFS_HOST = process.env.IPFS_HOST || "/ip4/127.0.0.1/tcp/5001";
const HIVE_API = process.env.HIVE_HOST || "https://hive-api.web3telekom.xyz";
const VSC_NETWORK_ID =
  process.env.VSC_NETWORK_ID || "testnet/0bf2e474-6b9e-4165-ad4e-a0d78968d20c";
const HIVE_ACCOUNT_ACTIVE_PRIVATE_KEY =
  process.env.HIVE_ACCOUNT_ACTIVE_PRIVATE_KEY;
const HIVE_ACCOUNT_USERNAME = process.env.HIVE_ACCOUNT_USERNAME;
const MAX_CONTRACT_SIZE = 240_000; // in bytes

if (!HIVE_ACCOUNT_ACTIVE_PRIVATE_KEY) {
  throw new Error(
    "HIVE_ACCOUNT_ACTIVE_PRIVATE_KEY is a required environment variable"
  );
}

if (!HIVE_ACCOUNT_USERNAME) {
  throw new Error("HIVE_ACCOUNT_USERNAME is a required environment variable");
}

const FILE_UPLOAD_REQUEST_TOPIC = `${VSC_NETWORK_ID}-file-upload-request`;
const FILE_UPLOAD_REQUEST_DATA_TOPIC = `${VSC_NETWORK_ID}-file-upload-request-data`;
const FILE_UPLOAD_RESPONSE_TOPIC = `${VSC_NETWORK_ID}-file-upload-response`;

const FILE_UPLOAD_REQUIRED_VERIFIERS = 6;

const HiveClient = new Client(
  process.env.HIVE_HOST || [
    HIVE_API,
    "https://api.deathwing.me",
    "https://anyx.io",
    "https://api.openhive.network",
    "https://rpc.ausbit.dev",
  ]
);

async function deployContract(contractPath: string) {
  try {
    let ipfsInstalled = false;
    const ipfs = IPFS.create({ url: IPFS_HOST });
    try {
      await ipfs.version();
      ipfsInstalled = true;
    } catch {}
    console.log("initializing IPFS");
    const ipfsProcess = ipfsInstalled
      ? console.log("using local IPFS installation")
      : startIPFS();

    try {
      const basename = Path.basename(contractPath);

      const manifestPath = Path.join(
        Path.dirname(contractPath),
        basename.slice(0, basename.length - ".ts".length) + ".manifest.json"
      );

      const path = contractPath;

      console.log("reading contract manifest");
      const manifestData = JSON.parse(
        (await fs.readFile(manifestPath, { encoding: "utf8" })).toString()
      );

      console.log("compiling contract to wasm");
      const result = await compileAS({
        scriptPath: path,
      });
      if (result.err) {
        throw new Error(`ERROR on compiling to WASM - ${result.err}`);
      }

      if (result.binary.length > MAX_CONTRACT_SIZE) {
        throw new Error(
          `ERROR compiled result must be smaller than 240KB. Total size: ${result.binary.length}`
        );
      }

      console.log("uploading contract to IPFS");

      while (!ipfsInstalled) {
        try {
          await ipfs.version();
          break;
        } catch {}
      }

      const cid = await ipfs.dag.put(result.binary);

      const encoder = new TextEncoder();

      const resultListener = fetchDataAvailibilityProof(ipfs, cid);

      const request: { cid: string } = { cid: cid.toString() };
      await ipfs.pubsub.publish(
        FILE_UPLOAD_REQUEST_TOPIC,
        encoder.encode(JSON.stringify(request))
      );

      await sleep(12000);
      await ipfs.pubsub.publish(FILE_UPLOAD_REQUEST_DATA_TOPIC, result.binary);

      console.log("waiting for data availability proof");

      const proofInfo = await resultListener;

      console.log("got data availability proof");

      console.log("anchoring contract to Hive");

      const broadcastResult = await HiveClient.broadcast.json(
        {
          required_auths: [HIVE_ACCOUNT_USERNAME],
          required_posting_auths: [],
          id: "vsc.create_contract",
          json: JSON.stringify({
            __v: "0.1",
            net_id: VSC_NETWORK_ID,
            name: manifestData.name,
            code: cid.toString(),
            description: manifestData.description,
            storage_proof: {
              hash: proofInfo.data,
              signature: proofInfo.signature,
            },
          }),
        },
        PrivateKey.fromString(HIVE_ACCOUNT_ACTIVE_PRIVATE_KEY)
      );

      console.log();
      console.log(
        "your contract is deployed to Hive in transaction: ",
        broadcastResult.id
      );
      console.log("https://hivexplorer.com/tx/" + broadcastResult.id);

      console.log();
      console.log("Your contract code IPFS CID:", cid.toString());

      const contractIdHash = (
        await encodePayload({
          ref_id: broadcastResult.id,
          index: "0", // create-contract op is always first since it's the only op in the transaction
        })
      ).cid;

      const bech32Addr = bech32.encode(
        "vs4",
        bech32.toWords(contractIdHash.bytes)
      );

      console.log();
      console.log("Your contract address is:", bech32Addr);
    } catch (e) {
      console.error("runtime err:", e.message);
    }
    if (!ipfsInstalled) {
      await ipfs.stop();
      await ipfsProcess;
    }
  } catch (e) {
    console.error("init err:", e.message);
  }
}

async function waitForContractPin(
  ipfsClient: IPFS.IPFSHTTPClient,
  cid: IPFS.CID
) {
  const providers = new Set<string>();
  const status = setInterval(() => {
    console.log("total providers", providers.size);
  }, 15000);
  while (true) {
    for await (const data of ipfsClient.dht.findProvs(cid)) {
      // check if cid is pinned
      if (data.name === "PROVIDER") {
        for (const provider of data.providers) {
          providers.add(provider.id.toString());
        }
        if (providers.size > 10) {
          console.log("Contract is pinned");
          clearInterval(status);
          return;
        }
      }
    }
  }
}

function startIPFS(): Promise<void> {
  const tempDir = mktemp.createDirSync("vsc-contract-deploy-ipfs-XXXXXXX");
  // TODO use a temp directory set IPFS_PATH env var for ipfs repo location
  // await fs.rm(Path.join(os.homedir(), ".ipfs"), {
  //   recursive: true,
  //   force: true,
  // });
  const ipfs = spawn(
    kubo.path(),
    ["daemon", "--init", "--enable-pubsub-experiment"],
    {
      env: { ...process.env, IPFS_PATH: tempDir },
    }
  );
  // ipfs.stdout.pipe(process.stdout);
  // ipfs.stderr.pipe(process.stderr);
  // ipfs.on("close", (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });

  // await sleep(40000);
  // process.exit(0);

  const cleanup = async (code: number) => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
    process.exit(code);
  };

  process.on("SIGINT", () => cleanup(0));
  process.on("SIGTERM", () => cleanup(0));
  process.on("beforeExit", cleanup);

  return new Promise((r) => {
    ipfs.on("exit", () => {
      fs.rm(tempDir, { recursive: true, force: true });
      r();
    });
  });
}

interface CompileResult {
  binary: Uint8Array | null;
  err: string | null;
}

async function compileAS(args: { scriptPath: string }): Promise<CompileResult> {
  const { scriptPath } = args;

  var stdout = asc.createMemoryStream();
  const compileResult = await asc.main(
    [
      "input.ts",
      // "-b",
      "-o",
      "--optimize",
      "--Osize",
      "--exportRuntime",
      "--runPasses",
      "asyncify",
    ],
    {
      stdout: stdout,
      readFile: async (filename: string, baseDir: string) => {
        // console.log(filename, baseDir)
        try {
          if (filename === "input.ts") {
            return (await fs.readFile(scriptPath)).toString();
          }
          return (await fs.readFile(filename)).toString();
        } catch {
          return null;
        }
      },
    }
  );

  if (compileResult.error) {
    console.log(compileResult.error);
    console.log(compileResult.stderr.toString());
    return {
      err: compileResult.stderr.toString(),
      binary: null,
    };
  }

  const binary = stdout.toBuffer();

  return {
    binary,
    err: null,
  };
}

type FileUploadResponseInfo =
  | { type: "error"; cid: string; error: string }
  | {
      type: "success";
      cid: string;
      signature: { s: string; p: string };
    }
  | {
      type: "proof";
      data: string;
      signature: { sig: string; bv: string };
      // epochDefinitionHiveBlock: number; // just some metadata for the client to aid verification
      cid: string;
    };

function parseFileUploadResponseInfo(data: string): FileUploadResponseInfo {
  const parsed: unknown = JSON.parse(data);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid File Upload Response");
  }
  if ("type" in parsed) {
    if (parsed.type === "error") {
      if (
        "error" in parsed &&
        typeof parsed.error === "string" &&
        "cid" in parsed &&
        typeof parsed.cid === "string"
      ) {
        return { type: "error", cid: parsed.cid, error: parsed.error };
      }
    } else if (parsed.type === "success") {
      if (
        "cid" in parsed &&
        "signature" in parsed &&
        typeof parsed.cid === "string" &&
        typeof parsed.signature === "object" &&
        parsed.signature !== null &&
        "s" in parsed.signature &&
        "p" in parsed.signature &&
        typeof parsed.signature.s === "string" &&
        typeof parsed.signature.p === "string"
      ) {
        return {
          type: "success",
          cid: parsed.cid,
          signature: { s: parsed.signature.s, p: parsed.signature.p },
        };
      }
    } else if (parsed.type === "proof") {
      if (
        "data" in parsed &&
        "signature" in parsed &&
        "cid" in parsed &&
        typeof parsed.data === "string" &&
        typeof parsed.signature === "object" &&
        parsed.signature !== null &&
        "sig" in parsed.signature &&
        "bv" in parsed.signature &&
        typeof parsed.signature.sig === "string" &&
        typeof parsed.signature.bv === "string" &&
        typeof parsed.cid === "string"
      ) {
        return {
          type: "proof",
          data: parsed.data,
          signature: { sig: parsed.signature.sig, bv: parsed.signature.bv },
          cid: parsed.cid,
        };
      }
    }
  }
  throw new Error("Invalid File Upload Response");
}

main();

function ignoreUnsignedMessages(
  handler: (msg: SignedMessage) => void
): (msg: Message) => void {
  return (msg) => {
    if (msg.type === "unsigned") {
      return;
    }
    return handler(msg);
  };
}

function fetchDataAvailibilityProof(
  ipfs: IPFSHTTPClient,
  cid: IPFS.CID
): Promise<FileUploadResponseInfo & { type: "proof" }> {
  return new Promise(async (resolve, reject) => {
    const cidString = cid.toString();
    const decoder = new TextDecoder();
    let errorCount = 0;
    const errorTimeout = setTimeout(async () => {
      await ipfs.pubsub.unsubscribe(FILE_UPLOAD_RESPONSE_TOPIC, handler);
      reject(new Error("Timeout fetching data availability proof"));
    }, 60000);

    const multisig = new BlsCircuitGenerator(await getEpochMembers());
    // TODO listen to epoch change events and update the multisig accordingly

    const sigCid = await ipfs.dag.put(
      {
        type: "data-availability",
        cid: cid.toString(),
      },
      { onlyHash: true }
    );
    const bls = {
      circuit: multisig.generate({ hash: sigCid.bytes }),
      sigCid: sigCid.bytes,
    };

    const handler = ignoreUnsignedMessages(async (msg) => {
      try {
        const respInfo: FileUploadResponseInfo = parseFileUploadResponseInfo(
          decoder.decode(msg.data)
        );

        if (respInfo.cid !== cidString) {
          return;
        }

        if (respInfo.type === "error") {
          if (++errorCount >= FILE_UPLOAD_REQUIRED_VERIFIERS) {
            await ipfs.pubsub.unsubscribe(FILE_UPLOAD_RESPONSE_TOPIC, handler);
            clearTimeout(errorTimeout);
            reject(new Error(respInfo.error));
          }
          return;
        }

        if (respInfo.type === "proof") {
          // legacy ignore
          return;

          // const msgCid = IPFS.CID.parse(respInfo.data);

          // const signedData = await ipfs.dag.get(msgCid);
          // if (
          //   signedData.value.cid !== cidString ||
          //   signedData.value.type !== "data-availablity"
          // ) {
          //   // signed data is incorrect
          //   return;
          // }

          // // TODO fetch circuitMap from epoch block on Hive
          // const circuitMap: string[] = await getCircuitMap();
          // const msg = msgCid.bytes;
          // const proof = BlsCircuit.deserialize(
          //   {
          //     hash: msg,
          //     signature: respInfo.signature,
          //   },
          //   circuitMap
          // );
          // if (
          //   proof.aggPubKeys.size >= FILE_UPLOAD_REQUIRED_VERIFIERS &&
          //   (await proof.verify(msg))
          // ) {
          //   // got a valid proof return it
          //   await ipfs.pubsub.unsubscribe(FILE_UPLOAD_RESPONSE_TOPIC, handler);
          //   resolve(respInfo);
          // }
        }

        // validate signature
        // if invalid then ignore this message
        const valid = await bls.circuit.addAndVerify(
          JSON.parse(
            Buffer.from(respInfo.signature.p, "base64url").toString("utf-8")
          ).pub,
          respInfo.signature.s
        );
        if (!valid) {
          console.log(`recieved invalid sig for ${respInfo.cid}... ignoring`);
          return;
        }

        const circuit = bls.circuit.finalize();
        if (circuit.aggPubKeys.size >= FILE_UPLOAD_REQUIRED_VERIFIERS) {
          console.log("got enough signatures... finalizing proof");
          const sig = circuit.serialize(bls.circuit.circuitMap);
          const data = await ipfs.dag.put(
            {
              type: "data-availability",
              cid: respInfo.cid,
            },
            { onlyHash: true }
          );
          const resp: FileUploadResponseInfo = {
            type: "proof",
            data: data.toString(),
            signature: sig,
            cid: respInfo.cid,
          };
          clearTimeout(errorTimeout);
          await ipfs.pubsub.unsubscribe(FILE_UPLOAD_RESPONSE_TOPIC, handler);
          resolve(resp);
          return;
        }
      } catch (e) {
        console.error("this is likely a bug. please report this message", e);
      }
    });
    await ipfs.pubsub.subscribe(FILE_UPLOAD_RESPONSE_TOPIC, handler);
  });
}

type RawResponse = {
  data: {
    activeWitnessNodes: {
      key: string;
      account: string;
    }[];
  };
};

async function getEpochMembers() {
  const res = await fetch(`${VSC_NODE_URL}/api/v1/graphql`, {
    headers: {
      accept:
        "application/graphql-response+json, application/json, multipart/mixed",
      "content-type": "application/json",
    },
    body: '{"query":"{\\n  activeWitnessNodes\\n}","extensions":{}}',
    method: "POST",
  });
  const memberPairs: RawResponse = await res.json();
  return memberPairs.data.activeWitnessNodes;
}
