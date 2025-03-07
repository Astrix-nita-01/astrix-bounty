import bls, { init } from "@chainsafe/bls/switchable";
// import bls from "@chainsafe/bls";
import type { PublicKey, SecretKey, Signature } from "@chainsafe/bls/types";
import BitSet from "bitset";
import { CID } from "kubo-rpc-client";
import { encodePayload } from "dag-jose-utils";
// import {
//   encodeBase64Url,
//   decodeBase64,
//   encodeBase64,
// } from "dids/dist/utils.js";
import "dids";
import * as u8a from "uint8arrays";
import { parse } from "did-resolver";

// dids/dist/utils.js
import { decode } from "codeco";
import { uint8ArrayAsBase64pad, uint8ArrayAsBase64url } from "@didtools/codecs";

export function encodeBase64(bytes: Uint8Array) {
  return uint8ArrayAsBase64pad.encode(bytes);
}
export function encodeBase64Url(bytes: Uint8Array) {
  return uint8ArrayAsBase64url.encode(bytes);
}
export function decodeBase64(s: string) {
  return decode(uint8ArrayAsBase64pad, s);
}
// dids/dist/utils.js END

export enum SignatureType {
  JWS = "JWS",
  HIVE = "HIVE",
  BLS = "DID-BLS",
  BLS_AGG = "DID-BLS-AGG",
}

export interface SignatureIndividual {
  //Separate between JWS, HIVE, and custom BLS signatures
  t: SignatureType;
  //Aka Protected
  // i.e {"alg": "EdDSA", "kid": "did:key:...#did:key:..."}
  p?: string;
  s: string; // Base64 signature
}

export interface SignaturePacked {
  // 'hive:beeab0de000000000000000000000000:hiveio'

  signatures: Array<SignatureIndividual>;
}

/**
 * Light implementation of BLS DIDs
 * Not standard compliant
 * G1 BLS curves
 */
export class BlsDID {
  private privKey: SecretKey | undefined;
  pubKey: PublicKey;

  constructor({ privKey, pubKey }: { privKey?: SecretKey; pubKey: PublicKey }) {
    this.privKey = privKey;
    this.pubKey = pubKey;
  }

  get id() {
    const publicKey = this.pubKey.toBytes();
    const bytes = new Uint8Array(publicKey.length + 2);
    bytes[0] = 0xea; // ed25519 multicodec
    // The multicodec is encoded as a varint so we need to add this.
    // See js-multicodec for a general implementation
    bytes[1] = 0x01;
    bytes.set(publicKey, 2);
    return `did:key:z${u8a.toString(bytes, "base58btc")}`;
  }

  async verify({
    msg,
    sig,
  }: {
    msg: Uint8Array | string;
    sig: Uint8Array | string;
  }) {
    let signature: Signature;
    if (typeof sig === "string") {
      signature = bls.Signature.fromBytes(decodeBase64(sig));
    } else {
      signature = bls.Signature.fromBytes(sig);
    }
    if (typeof msg === "string") {
      msg = decodeBase64(msg);
    } else {
      msg = msg;
    }
    return signature.verify(this.pubKey, msg);
  }

  async sign(msg: Record<string, any>): Promise<string> {
    if (!this.privKey) {
      throw new Error("No private key!");
    }
    const encodedPayload = await encodePayload(msg);

    return encodeBase64(this.privKey.sign(encodedPayload.cid.bytes).toBytes());
  }

  async signRaw(msg: Buffer | Uint8Array) {
    return {
      s: encodeBase64(this.privKey.sign(msg).toBytes()),
      p: Buffer.from(
        JSON.stringify({
          pub: this.id,
        })
      ).toString("base64url"),
    };
  }

  async signPacked(msg: Record<string, any>) {
    if (!this.privKey) {
      throw new Error("No private key!");
    }
    const encodedPayload = await encodePayload(msg);

    const signature = encodeBase64(
      this.privKey.sign(encodedPayload.cid.bytes).toBytes()
    );

    return {
      link: encodedPayload.cid,
      signature,
    };
  }

  async signObject<Message extends Record<string, any>>(
    msg: Message
  ): Promise<Message & SignaturePacked> {
    if (!this.privKey) {
      throw new Error("No private key!");
    }
    const encodedPayload = await encodePayload(msg);

    const signature = encodeBase64(
      this.privKey.sign(encodedPayload.cid.bytes).toBytes()
    );

    return {
      ...msg,
      signatures: [
        {
          t: SignatureType.BLS,
          p: Buffer.from(
            JSON.stringify({
              pub: this.id,
            })
          ).toString("base64url"),
          s: signature,
        },
      ],
    };
  }

  static fromSeed(seed: Uint8Array) {
    return new BlsDID({
      privKey: bls.SecretKey.fromKeygen(seed),
      pubKey: bls.SecretKey.fromKeygen(seed).toPublicKey(),
    });
  }

  static fromString(did: string) {
    const parseDid = parse(did);
    const pubKey = u8a.fromString(parseDid.id.slice(1), "base58btc").slice(2);

    return new BlsDID({
      pubKey: bls.PublicKey.fromBytes(pubKey),
    });
  }
}

/**
 * Aggregated bls signatures with mapping
 */
export class BlsCircuit {
  did: BlsDID;
  sig: Signature;
  msg: { hash: Uint8Array } | { data: string };
  aggPubKeys: Map<string, boolean>;
  // bitSet: BitSet
  constructor(msg: { hash: Uint8Array } | { data: string }) {
    this.msg = msg;

    this.aggPubKeys = new Map();
  }

  add(data: { did: string; sig: string }) {
    return this.addMany([data]);
  }

  async addMany(
    data: Array<{ did: string; sig: string }>
  ): Promise<{ errors: string[] }> {
    let publicKeys = [];
    let sigs = [];
    let errors = [];
    for (let e of data) {
      const did = BlsDID.fromString(e.did);
      let sig = bls.Signature.fromBytes(Buffer.from(e.sig, "base64url"));

      let msg: Uint8Array;
      if ("hash" in this.msg) {
        msg = this.msg.hash;
      } else {
        msg = (await encodePayload(this.msg.data as any)).cid.bytes;
      }
      if (sig.verify(did.pubKey, msg)) {
        this.aggPubKeys.set(did.id, true);
        publicKeys.push(did.pubKey);
        sigs.push(sig);
      } else {
        errors.push(`INVALID_SIG for ${did.id}`);
        // throw new Error(`INVALID_SIG for ${did.id}`)
      }
    }

    if (this.did) {
      publicKeys.push(this.did.pubKey);
    }
    if (this.sig) {
      sigs.push(this.sig);
    }

    const pubKey = bls.PublicKey.aggregate([...publicKeys]);

    const sig = bls.Signature.aggregate([...sigs]);

    this.did = new BlsDID({
      pubKey,
    });
    this.sig = sig;

    return {
      errors,
    };
  }

  async verify(msg: Uint8Array) {
    return this.sig.verify(this.did.pubKey, msg);
  }

  async verifySig(data: { sig: string; pub: string }) {
    let msg: Uint8Array;
    if ("hash" in this.msg) {
      msg = this.msg.hash;
    } else {
      msg = (await encodePayload(this.msg.data as any)).cid.bytes;
    }
    const did = BlsDID.fromString(data.pub);
    return bls.Signature.fromBytes(decodeBase64(data.sig)).verify(
      did.pubKey,
      msg
    );
  }

  verifyPubkeys(pubKeys: Array<string>): boolean {
    let aggPub = bls.PublicKey.aggregate(
      pubKeys.map((e) => {
        return BlsDID.fromString(e).pubKey;
      })
    );
    const did = new BlsDID({
      pubKey: aggPub,
    });
    return did.id === this.did.id;
  }

  setAgg(pubKeys: Array<string>) {
    let aggPub = bls.PublicKey.aggregate(
      pubKeys.map((e) => {
        return BlsDID.fromString(e).pubKey;
      })
    );
    const did = new BlsDID({
      pubKey: aggPub,
    });
    this.did = did;
  }

  serialize(circuitMap: Array<string>) {
    let bitset = new BitSet();
    for (let str in circuitMap) {
      if (this.aggPubKeys.get(circuitMap[str])) {
        bitset.set(Number(str), 1);
      }
    }
    function d2h(d) {
      var h = d.toString(16);
      return h.length % 2 ? "0" + h : h;
    }
    if (!this.sig) {
      throw new Error("No Valid BLS Signature");
    }
    return {
      sig: Buffer.from(this.sig.toBytes()).toString("base64url"),
      // did: this.did.id,
      //BitVector
      bv: Buffer.from(d2h(bitset.toString(16)), "hex").toString("base64url"),
    };
  }

  static deserialize(
    signedPayload: ({ hash: Uint8Array } | { data: string }) & {
      signature: { bv: string; sig: string };
    },
    keyset: Array<string>
  ) {
    const signature = signedPayload.signature;
    delete signedPayload.signature;

    console.log(signature);
    const bs = BitSet.fromHexString(
      Buffer.from(signature.bv, "base64url").toString("hex")
    );

    console.log(bs);
    const pubKeys = new Map();
    const pubKeyArray: string[] = [];
    for (let keyIdx in keyset) {
      if (bs.get(Number(keyIdx)) === 1) {
        pubKeys.set(keyset[keyIdx], true);
        pubKeyArray.push(keyset[keyIdx]);
      }
    }

    let circuit = new BlsCircuit(signedPayload);
    circuit.aggPubKeys = pubKeys;
    circuit.setAgg(pubKeyArray);
    circuit.sig = bls.Signature.fromBytes(
      Buffer.from(signature.sig, "base64url")
    );

    return circuit;
  }
}

export class BlsCircuitGenerator {
  constructor(
    private readonly members: {
      account: string;
      key: string;
    }[]
  ) {}

  generate(msg: { hash: Uint8Array } | { data: string }): PartialBlsCircuit {
    return new PartialBlsCircuit(msg, this.members);
  }

  updateMembers(
    members: {
      account: string;
      key: string;
    }[]
  ) {
    this.members.splice(0, this.members.length);
    this.members.push(...members);
  }

  get circuitMap() {
    return this.members.map((e) => {
      return e.key;
    });
  }
}

export class PartialBlsCircuit {
  private circuit: BlsCircuit;
  constructor(
    msg: { hash: Uint8Array } | { data: string },
    private members: {
      account: string;
      key: string;
    }[]
  ) {
    this.circuit = new BlsCircuit(msg);
  }

  finalize(): BlsCircuit {
    return this.circuit;
  }

  get circuitMap() {
    return this.members.map((e) => {
      return e.key;
    });
  }

  async addAndVerify(pub: string, sig: string): Promise<boolean> {
    if (
      !this.members.find((e) => {
        return e.key === pub;
      })
    ) {
      return false;
    }

    const verifiedSig = await this.circuit.verifySig({
      sig: sig,
      pub: pub,
    });

    if (verifiedSig) {
      await this.circuit.add({
        did: pub,
        sig,
      });
      return true;
    }
    return false;
  }
}

void (async () => {
  await init("blst-native");
})();

export async function initBls() {
  await init("blst-native");
}
