export function coinbaseBuyUsdc() {
  return "https://www.coinbase.com/buy/usdc";
}

export function coinbaseBuyEth() {
  return "https://www.coinbase.com/buy/ethereum";
}

export function coinbaseWallet() {
  return "https://wallet.coinbase.com/";
}

export function cashAppHome() {
  return "https://cash.app/";
}

export function openSeaHome() {
  return "https://opensea.io/";
}

export function openSeaCreate() {
  return "https://opensea.io/create";
}

export function openSeaSearch(q: string) {
  return `https://opensea.io/explore?search=${encodeURIComponent(q)}`;
}
