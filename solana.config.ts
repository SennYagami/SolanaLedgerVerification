export const NETWORK_CONFIG: Record<string, { rpc: string; explorer: string; explorerParam: string }> = {
  mainnet: {
    rpc: "https://api.mainnet-beta.solana.com",
    explorer: "https://solscan.io/",
    explorerParam: "",
  },
  devnet: {
    rpc: "https://api.devnet.solana.com",
    explorer: "https://solscan.io/",
    explorerParam: "?cluster=devnet",
  },
  testnet: {
    rpc: "https://api.testnet.solana.com",
    explorer: "https://solscan.io/",
    explorerParam: "?cluster=testnet",
  },
};
