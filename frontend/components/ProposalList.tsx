"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import MyGovernorABI from "../abis/MyGovernor.json";
import GovernanceTokenABI from "../abis/GovernanceToken.json";
import { GOVERNOR_ADDRESS, TOKEN_ADDRESS } from "../config";

interface Proposal {
    id: string;
    proposer: string;
    description: string;
    state: number; // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    deadline: number;
}

const STATE_MAP = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];

export default function ProposalList() {
    const { provider, signer, address } = useWeb3();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [votingInputs, setVotingInputs] = useState<{ [key: string]: string }>({}); // For QV logic

    const fetchProposals = useCallback(async () => {
        if (!provider) return;
        setLoading(true);
        try {
            const governor = new ethers.Contract(GOVERNOR_ADDRESS, MyGovernorABI, provider);

            // Query events from past ~5000 blocks to now
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = currentBlock - 10000 > 0 ? currentBlock - 10000 : 0;

            const filter = governor.filters.ProposalCreated();
            const events = await governor.queryFilter(filter, fromBlock);

            const loadedProposals = await Promise.all(events.map(async (event: any) => {
                const { proposalId, proposer, description } = event.args;
                const state = await governor.state(proposalId);
                const votes = await governor.proposalVotes(proposalId);
                const deadline = await governor.proposalDeadline(proposalId); // block number

                return {
                    id: proposalId.toString(),
                    proposer,
                    description,
                    state: Number(state),
                    forVotes: ethers.formatEther(votes[1]), // Assuming 18 decimals, but QV might be raw units
                    againstVotes: ethers.formatEther(votes[0]),
                    abstainVotes: ethers.formatEther(votes[2]),
                    deadline: Number(deadline)
                };
            }));

            // Sort by newest
            setProposals(loadedProposals.reverse());
        } catch (err) {
            console.error("Error fetching proposals:", err);
        } finally {
            setLoading(false);
        }
    }, [provider]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const castVote = async (proposalId: string, support: number, qvVotes?: number) => {
        if (!signer) return alert("Connect Wallet");

        try {
            const governor = new ethers.Contract(GOVERNOR_ADDRESS, MyGovernorABI, signer);

            // Simple check for Voting Type? 
            // Ideally we should know the type. For now, try standard, if it fails/reverts, try params?
            // Or assume user interaction determines it.
            // We really should have emitted VotingType in ProposalCreated or stored it. 
            // My ABI for queryFilter('ProposalCreated') used standard event which DOES NOT include votingType.
            // So we can't easily know strictly from the event. 
            // Workaround: We will use `castVote` for standard 1T1V (support 0/1/2).
            // For QV, we need `castVoteWithParams`.

            if (qvVotes && qvVotes > 0) {
                // QV Flow
                const cost = BigInt(qvVotes) * BigInt(qvVotes);
                // Must approve
                const token = new ethers.Contract(TOKEN_ADDRESS, GovernanceTokenABI, signer);
                const allowance = await token.allowance(address, GOVERNOR_ADDRESS);
                // We need to scale cost if the token has decimals? 
                // MyGovernor logic: votesToBuy = parsed params. cost = votesToBuy^2.
                // If I want 10 votes, cost is 100 * 10^18? Or 100 wei?
                // In my contract: `votesToBuy = abi.decode(...)`. `cost = votesToBuy * votesToBuy` (in generic units).
                // `transferFrom(..., cost)`.
                // So if I send 10, cost is 100 units (wei).

                if (allowance < cost) {
                    const txApprove = await token.approve(GOVERNOR_ADDRESS, cost);
                    await txApprove.wait();
                }

                const params = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [qvVotes]);
                const tx = await governor.castVoteWithParams(proposalId, support, "", params);
                await tx.wait();
            } else {
                // Standard Flow
                const tx = await governor.castVote(proposalId, support);
                await tx.wait();
            }

            alert("Vote Cast!");
            fetchProposals();
        } catch (err: any) {
            console.error(err);
            alert("Vote Failed: " + (err.reason || err.message));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Proposals</h2>
                <button onClick={fetchProposals} className="text-sm text-gray-400 hover:text-white">Refresh</button>
            </div>

            {loading && <p>Loading proposals...</p>}
            {!loading && proposals.length === 0 && <p className="text-gray-400">No proposals found.</p>}

            {proposals.map((p) => (
                <div key={p.id} data-testid="proposal-list-item" className="p-6 bg-surface rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">{p.description}</h3>
                            <p className="text-sm text-gray-400">Proposer: {p.proposer.substring(0, 8)}...</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${p.state === 1 ? 'bg-secondary text-black' : 'bg-gray-600'}`}>
                            {STATE_MAP[p.state] || "Unknown"}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className="bg-gray-800 p-2 rounded">
                            <span className="block text-xs text-gray-400">For</span>
                            <span className="font-bold text-green-400">{Number(p.forVotes).toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-800 p-2 rounded">
                            <span className="block text-xs text-gray-400">Against</span>
                            <span className="font-bold text-red-400">{Number(p.againstVotes).toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-800 p-2 rounded">
                            <span className="block text-xs text-gray-400">Abstain</span>
                            <span className="font-bold text-gray-400">{Number(p.abstainVotes).toFixed(2)}</span>
                        </div>
                    </div>

                    {p.state === 1 && (
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <h4 className="text-sm font-medium mb-2">Cast Vote</h4>

                            {/* QV Input */}
                            <div className="mb-2">
                                <label className="text-xs text-gray-400 block mb-1">
                                    For Quadratic Voting, enter votes to buy:
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 bg-background border border-gray-700 rounded text-sm"
                                    placeholder="e.g. 10 (Cost: 100 tokens)"
                                    value={votingInputs[p.id] || ''}
                                    onChange={(e) => setVotingInputs({ ...votingInputs, [p.id]: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    data-testid="vote-for-button"
                                    onClick={() => castVote(p.id, 1, Number(votingInputs[p.id]))}
                                    className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-sm font-medium"
                                >
                                    Vote For
                                </button>
                                <button
                                    data-testid="vote-against-button"
                                    onClick={() => castVote(p.id, 0, Number(votingInputs[p.id]))}
                                    className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-medium"
                                >
                                    Vote Against
                                </button>
                                <button
                                    data-testid="vote-abstain-button"
                                    onClick={() => castVote(p.id, 2, Number(votingInputs[p.id]))}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded text-sm font-medium"
                                >
                                    Abstain
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
