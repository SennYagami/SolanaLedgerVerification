import { TransactionSignature } from "@solana/web3.js";
import { randomBytes } from "crypto";
import { NETWORK_CONFIG } from "../../solana.config";
const fs = require("fs");
const path = require("path");
import * as web3 from "@solana/web3.js";

// get contract addresses path
function getContractAddressesPath() {
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  return path.join(__dirname, "..", "..", "contractAddress", `contract-addresses-${network}.json`);
}

export async function getAddr(label: string): Promise<web3.PublicKey> {
  const addrs = await readAddresses();

  // check whether include
  if (!addrs[label]) {
    throw new Error("address not found");
  }

  return new web3.PublicKey(addrs[label]);
}

export async function readContractAddress(): Promise<Record<string, string>> {
  const path = getContractAddressesPath();
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path));
  }
  return {};
}

export async function sendTxn(txnPromise: Promise<TransactionSignature>, label?: string) {
  console.info(`Sending ${label}...`);
  const txn = await txnPromise;
  await txnPromise;

  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  // get explorer from config
  const scanUrl = config.explorer;

  console.info(`... Sent! ${scanUrl}tx/${txn}${config.explorerParam ? config.explorerParam : ""}`);
  return txn;
}

// function decode args
export function decodeArgsFromInput(): Record<string, string> {
  const args = process.argv.slice(2);

  const argObject: Record<string, string> = {};

  // assert args length is even
  if (args.length % 2 !== 0) {
    throw new Error("args length should be even");
  }

  // decode args
  for (let i = 0; i < args.length; i += 2) {
    // args[i] is key, args[i+1] is value
    // args[i] should start with "--"
    if (!args[i].startsWith("--")) {
      throw new Error("args[i] should start with '--'");
    }

    // args[i+1] should not start with "--"
    if (args[i + 1].startsWith("--")) {
      throw new Error("args[i+1] should not start with '--'");
    }

    const key = args[i].slice(2);
    const value = args[i + 1];

    // check key and value is not empty
    if (!key || !value) {
      throw new Error("key and value should not be empty");
    }

    argObject[key] = value;
  }

  return argObject;
}

export function getArgFromInput(key: string): string {
  const argObject = decodeArgsFromInput();
  const value = argObject[key];

  // check value exists
  if (!value) {
    throw new Error("value should not be empty");
  }

  return value;
}

async function callWithRetries(func: any, args: any[], retriesCount = 10) {
  let i = 0;
  while (true) {
    i++;
    try {
      return await func(...args);
    } catch (ex: any) {
      if (i === retriesCount) {
        console.error("call failed %s times. throwing error", retriesCount);
        throw ex;
      }
      console.error("call i=%s failed. retrying....", i);
      console.error(ex.message);
    }
  }
}

function readAddresses() {
  const path = getContractAddressesPath();
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path));
  }
  return {};
}

function writeAddresses(json: any) {
  const path = getContractAddressesPath();

  const currentAddresses = readAddresses();
  const ks = Object.keys(json);
  for (let i = 0; i < ks.length; i++) {
    if (currentAddresses[ks[i]]) {
      // use red color to indicate error
      console.log(`\x1b[31m%s\x1b[0m", "Error: key ${ks[i]} existed, exit process`);
      process.exit();
    }
  }

  const tmpAddresses = Object.assign(currentAddresses, json);
  fs.writeFileSync(path, JSON.stringify(tmpAddresses));
}

export function writeOneAddress(address: web3.PublicKey, label: string): web3.PublicKey {
  const json = {
    [label]: address.toBase58(),
  };

  writeAddresses(json);

  return address;
}

// fetch connection
export function getConnection() {
  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  // connection
  const connection = new web3.Connection(config.rpc);

  return connection;
}

// log account info
export async function logAccountInfo(addr: string, label: string) {
  const connection = getConnection();

  // fetch balance
  const balance = await connection.getBalance(new web3.PublicKey(addr));

  // log
  console.log(`${label}: ${addr}, balance: ${balance}\n`);
}

// log transaction
export function logTx(txHash: string, label?: string) {
  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  // get explorer from config
  const scanUrl = config.explorer;

  console.info(
    `... Sent! ${scanUrl}tx/${txHash}${config.explorerParam ? config.explorerParam : ""}`
  );
}
