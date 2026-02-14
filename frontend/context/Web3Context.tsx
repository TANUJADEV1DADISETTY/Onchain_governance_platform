"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers, BrowserProvider, JsonRpcSigner } from "ethers";

interface Web3ContextType {
    provider: BrowserProvider | null;
    signer: JsonRpcSigner | null;
    address: string | null;
    connectWallet: () => Promise<void>;
    chainId: number | null;
}

const Web3Context = createContext<Web3ContextType>({
    provider: null,
    signer: null,
    address: null,
    connectWallet: async () => { },
    chainId: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);

    const connectWallet = async () => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
                const _provider = new ethers.BrowserProvider((window as any).ethereum);
                const _signer = await _provider.getSigner();
                const _address = await _signer.getAddress();
                const _network = await _provider.getNetwork();

                setProvider(_provider);
                setSigner(_signer);
                setAddress(_address);
                setChainId(Number(_network.chainId));
            } catch (err) {
                console.error("Failed to connect wallet:", err);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            // Auto-connect if already authorized?
            // For now, require manual click.
        }
    }, []);

    return (
        <Web3Context.Provider value={{ provider, signer, address, connectWallet, chainId }}>
            {children}
        </Web3Context.Provider>
    );
};
