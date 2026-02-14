"use client";

import CreateProposal from "../components/CreateProposal";
import ProposalList from "../components/ProposalList";
import { useWeb3 } from "../context/Web3Context";

export default function Home() {
    const { address } = useWeb3();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                {address ? (
                    <CreateProposal />
                ) : (
                    <div className="p-6 bg-surface rounded-lg border border-gray-700 text-center">
                        <p className="text-gray-400">Connect your wallet to create proposals.</p>
                    </div>
                )}

                <div className="mt-8 p-6 bg-surface rounded-lg border border-gray-700 text-sm text-gray-400">
                    <h3 className="font-bold text-white mb-2">Instructions</h3>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>Delegate votes to yourself to activate voting power.</li>
                        <li>Choose "Standard" for 1 Token = 1 Vote.</li>
                        <li>Choose "Quadratic" for Cost = Votes².</li>
                        <li>Ensure you have enough tokens for QV costs.</li>
                    </ul>
                </div>
            </div>

            <div className="lg:col-span-2">
                <ProposalList />
            </div>
        </div>
    );
}
