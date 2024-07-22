import idl from "../../target/idl/bond.json";
import { Program, Idl, AnchorProvider, setProvider, Wallet } from "@coral-xyz/anchor";
import { getConnection, sendTxn } from "../utils/utils";

import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { getBytes, keccak256, toUtf8Bytes } from "ethers";

require("dotenv").config();

async function main() {
  const connection = getConnection();

  // get payer
  const admin = getKeypairFromEnvironment("SECRET_KEY");

  // Load the wallet (you can use a local wallet file or other methods to provide the wallet)
  const wallet = new Wallet(admin);

  // Create Anchor provider
  const provider = new AnchorProvider(connection, wallet, {});
  setProvider(provider);

  const program = new Program(idl as Idl);

  const msg = getBytes(keccak256(toUtf8Bytes("Bonk x Manta: Sign to bond.")));

  await sendTxn(
    program.methods
      .verifyCallWithParam2([...msg])
      .signers([admin])
      .rpc(),
    "bond.verifyCallWithParam2"
  );
}

main();
