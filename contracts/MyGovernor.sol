// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    using SafeERC20 for IERC20;

    enum VotingType { Standard, Quadratic }

    mapping(uint256 => VotingType) public proposalVotingType;

    constructor(IVotes _token)
        Governor("MyGovernor")
        GovernorSettings(1 /* 1 block */, 50400 /* 1 week */, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    // Custom Propose Function to include VotingType
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        VotingType _votingType
    ) public returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalVotingType[proposalId] = _votingType;
        return proposalId;
    }

    // Override _castVote to handle Quadratic Voting logic
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual override returns (uint256) {
        VotingType vType = proposalVotingType[proposalId];
        uint256 weight;

        if (vType == VotingType.Quadratic) {
            // For Quadratic Voting, we expect user to pass the desired votes in params
            // If params is empty, default to 1 vote (cost 1 token)
            uint256 votesToBuy = 1;
            if (params.length > 0) {
                votesToBuy = abi.decode(params, (uint256));
            }
            
            uint256 cost = votesToBuy * votesToBuy;
            
            // Transfer tokens from user to this contract
            // User must have approved this contract to spend 'cost' tokens
            IERC20(address(token())).safeTransferFrom(account, address(this), cost);
            
            weight = votesToBuy;
        } else {
            // Standard Voting: Weight = Token Balance at Snapshot
             // Logic taken from Governor._castVote default behavior
            weight = token().getVotes(account, proposalSnapshot(proposalId));
        }

        _countVote(proposalId, account, support, weight, params);

        emit VoteCast(account, proposalId, support, weight, reason);

        return weight;
    }
}
