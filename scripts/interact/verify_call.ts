import idl from "../../target/idl/bond.json";
import { Program, Idl, AnchorProvider, setProvider, Wallet } from "@coral-xyz/anchor";
import { getAddr, getConnection, sendTxn } from "../utils/utils";

import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { PublicKey } from "@solana/web3.js";
import { Bond } from "../../target/types/bond";

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

  await sendTxn(
    program.methods.verifyCall().accounts({ signer: admin.publicKey }).signers([admin]).rpc(),
    "bond.verifyCall"
  );
}

main();
