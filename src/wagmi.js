import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Chess Game Web3',
  projectId: '2f05ae7f1116030fde2d36508f472bfb', // WalletConnect Cloud project ID
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: false, // If your dApp uses server side rendering (SSR)
});
