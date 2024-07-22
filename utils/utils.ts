import * as anchor from "@project-serum/anchor";

export async function airdrop(
  to: anchor.web3.PublicKey,
  amount = 100 * anchor.web3.LAMPORTS_PER_SOL
) {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // transfer lamports to user
  await provider.connection.confirmTransaction(
    await provider.connection.requestAirdrop(to, amount),
    "confirmed"
  );
}
