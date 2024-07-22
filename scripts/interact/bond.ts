import idl from "../../target/idl/bond.json";
import { Program, Idl, AnchorProvider, setProvider, Wallet } from "@coral-xyz/anchor";
import { getConnection, sendTxn } from "../utils/utils";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { ethers, hashMessage } from "ethers";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
require("dotenv").config();
async function main() {
  const connection = getConnection();

  // get payer
  const user_svm = getKeypairFromEnvironment("SECRET_KEY");

  // Create Anchor provider
  const provider = new AnchorProvider(connection, new Wallet(user_svm), {});
  setProvider(provider);

  // generate random EVM wallet
  const wallet_evm = ethers.Wallet.createRandom();

  const message = "Bonk x Manta: Sign to bond";
  const signature = await wallet_evm.signMessage(message);
  const messageHash = hashMessage(message);

  const messageHashBytes = ethers.getBytes(messageHash); // length 32
  const signatureBytes = ethers.getBytes(signature); // length 65

  // get program from IDL
  const program = new Program(idl as Idl) as any;

  // get pda address
  const pda = findProgramAddressSync(
    [Buffer.from("bond"), user_svm.publicKey.toBuffer()],
    program.programId
  );

  // await sendTxn(
  //   program.methods
  //     .bond([...messageHashBytes], [...signatureBytes])
  //     .accounts({ signer: user_svm.publicKey, bond: pda[0] })
  //     .signers([user_svm])
  //     .rpc(),
  //   "bond.bond"
  // );

  // fetch account data
  const account = await program.account.bond.fetch(pda[0]);

  console.log(account.message, [...messageHashBytes]);
  console.log(account.signature, [...signatureBytes]);

  // try recover
  const recovered = ethers.verifyMessage(message, signature);
  console.log({ recovered, walletEVM: wallet_evm.address });
}

main();
