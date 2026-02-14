"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import MyGovernorABI from "../abis/MyGovernor.json";
import { GOVERNOR_ADDRESS, TOKEN_ADDRESS } from "../config";
import GovernanceTokenABI from "../abis/GovernanceToken.json";

export default function CreateProposal() {
    const { signer, address } = useWeb3();
    const [description, setDescription] = useState("");
    const [votingType, setVotingType] = useState<number>(0); // 0 = Standard, 1 = Quadratic
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!signer || !address) return alert("Connect wallet first");

        try {
            setLoading(true);
            const governor = new ethers.Contract(GOVERNOR_ADDRESS, MyGovernorABI, signer);
            const token = new ethers.Contract(TOKEN_ADDRESS, GovernanceTokenABI, signer);

            // Check delegate
            const delegate = await token.delegates(address);
            if (delegate === ethers.ZeroAddress) {
                // Auto delegate to self if needed?
                // For now, warn user
                alert("You must delegate votes to yourself first to create a proposal!");
                // Optional: offer to delegate
                await (await token.delegate(address)).wait();
            }

            // Create a simple proposal: Transfer 0 tokens to self (just as an example action)
            // In a real app, user would input targets/values/calldatas
            const targets = [TOKEN_ADDRESS];
            const values = [0];
            const calldatas = [token.interface.encodeFunctionData("transfer", [address, ethers.parseEther("0")])];

            const tx = await governor.propose(
                targets,
                values,
                calldatas,
                description,
                votingType
            );

            await tx.wait();
            alert("Proposal created!");
            setDescription("");
        } catch (err: any) {
            console.error(err);
            alert("Error: " + (err.reason || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-surface rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">Create Proposal</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        className="w-full p-2 bg-background border border-gray-700 rounded text-white"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this proposal about?"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Voting Mechanism</label>
                    <select
                        className="w-full p-2 bg-background border border-gray-700 rounded text-white"
                        value={votingType}
                        onChange={(e) => setVotingType(Number(e.target.value))}
                    >
                        <option value={0}>Standard (1 Token = 1 Vote)</option>
                        <option value={1}>Quadratic (Cost = Votes²)</option>
                    </select>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-white rounded font-medium disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Submit Proposal"}
                </button>
            </div>
        </div>
    );
}
