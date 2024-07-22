import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bond } from "../target/types/bond";
import { expect } from "chai";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import * as crypto from "crypto";
import { airdrop } from "../utils/utils";
import { ethers, getBytes, hashMessage, keccak256, toUtf8Bytes } from "ethers";
import { Transaction } from "@solana/web3.js";
import nacl from "tweetnacl";

describe("bond", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.Bond as Program<Bond>;

  // generate key pair
  const user = anchor.web3.Keypair.generate();
  const user_2 = anchor.web3.Keypair.generate();

  // before each test, airdrop some tokens to the user
  beforeEach(async () => {
    await airdrop(user.publicKey);
  });

  it("verify_call", async () => {
    // should fail if the account is not signed
    try {
      await program.methods.verifyCall().accounts({ signer: user.publicKey }).rpc();
    } catch (error) {
      expect(error.message).to.include(
        `Missing signature for public key [\`${user.publicKey.toBase58()}\`]`
      );
    }

    // should succeed if the account is signed
    await program.methods.verifyCall().accounts({ signer: user.publicKey }).signers([user]).rpc();
  });

  it("verify_call recover signer", async () => {
    // recover the signer
    // Create a transaction
    const transaction = new Transaction();

    // Add an instruction to the transaction
    transaction.add(
      await program.methods.verifyCall().accounts({ signer: user.publicKey }).instruction()
    );

    let blockhash = (await provider.connection.getLatestBlockhash("finalized")).blockhash;
    transaction.recentBlockhash = blockhash;

    transaction.signatures = [user].map((signer) => ({
      signature: null,
      publicKey: signer.publicKey,
    }));
    const rawTx = transaction.compileMessage().serialize();

    // Sign the transaction with the keypair
    transaction.sign(user);

    // get signature
    const index = transaction.signatures.findIndex((sigpair) =>
      user.publicKey.equals(sigpair.publicKey)
    );
    const signature = transaction.signatures[index].signature;

    // ed25519 recover
    const isValid = nacl.sign.detached.verify(rawTx, signature, user.publicKey.toBuffer());
    expect(isValid).to.equal(true);
  });

  it("verify_call_with_param recover signer", async () => {
    // recover the signer
    // Create a transaction
    const transaction = new Transaction();

    const msg = getBytes(keccak256(toUtf8Bytes("Bonk x Manta: Sign to bond.")));

    // Add an instruction to the transaction
    transaction.add(
      await program.methods
        .verifyCallWithParam([...msg])
        .accounts({ signer: user.publicKey })
        .instruction()
    );

    let blockhash = (await provider.connection.getLatestBlockhash("finalized")).blockhash;
    transaction.recentBlockhash = blockhash;

    transaction.signatures = [user].map((signer) => ({
      signature: null,
      publicKey: signer.publicKey,
    }));
    const rawTx = transaction.compileMessage().serialize();

    // Sign the transaction with the keypair
    transaction.sign(user);

    // get signature
    const index = transaction.signatures.findIndex((sigpair) =>
      user.publicKey.equals(sigpair.publicKey)
    );
    const signature = transaction.signatures[index].signature;

    // ed25519 recover
    const isValid = nacl.sign.detached.verify(rawTx, signature, user.publicKey.toBuffer());
    expect(isValid).to.equal(true);
  });

  it("initialize_verification", async () => {
    // generate random uint8 array
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);

    // get pda address
    const pda = findProgramAddressSync(
      [Buffer.from("verification"), user.publicKey.toBuffer(), seed],
      program.programId
    );

    // call the method
    await program.methods
      .initializeVerification([...seed])
      .accounts({ signer: user.publicKey, verification: pda[0] })
      .signers([user])
      .rpc();

    // fetch account data
    const account = await program.account.verification.fetch(pda[0]);

    expect(account.owner.toBase58()).to.equal(user.publicKey.toBase58());
  });

  it("bond", async () => {
    // generate random EVM wallet
    const user_evm = ethers.Wallet.createRandom();

    // sign message
    const message = "Bonk x Manta: Sign to bond";
    const signature = await user_evm.signMessage(message);
    const messageHash = hashMessage(message);

    const messageHashBytes = ethers.getBytes(messageHash); // length 32
    const signatureBytes = ethers.getBytes(signature); // length 65

    // get pda address
    const pda = findProgramAddressSync(
      [Buffer.from("bond"), user.publicKey.toBuffer()],
      program.programId
    );

    // call the method
    await program.methods
      .bond([...messageHashBytes], [...signatureBytes])
      .accounts({ signer: user.publicKey, bond: pda[0] })
      .signers([user])
      .rpc();

    // fetch account data
    const account = await program.account.bond.fetch(pda[0]);

    expect(account.message).to.eql([...messageHashBytes]);
    expect(account.signature).to.eql([...signatureBytes]);

    // try recover
    const recovered = ethers.verifyMessage(message, signature);
    expect(recovered).to.equal(user_evm.address);
  });
});
