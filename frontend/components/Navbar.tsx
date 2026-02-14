"use client";

import { useWeb3 } from "../context/Web3Context";

export default function Navbar() {
    const { connectWallet, address } = useWeb3();

    return (
        <nav className="border-b border-gray-700 bg-surface p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold text-primary">Governance DAO</h1>
                <div>
                    {address ? (
                        <div data-testid="user-address" className="px-4 py-2 bg-gray-800 rounded">
                            {address.substring(0, 6)}...{address.substring(address.length - 4)}
                        </div>
                    ) : (
                        <button
                            data-testid="connect-wallet-button"
                            onClick={connectWallet}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 rounded text-white font-medium"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
