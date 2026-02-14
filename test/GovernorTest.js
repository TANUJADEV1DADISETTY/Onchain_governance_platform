const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Governance System", function () {
    let GovernanceToken, governanceToken;
    let MyGovernor, myGovernor;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        GovernanceToken = await ethers.getContractFactory("GovernanceToken");
        governanceToken = await GovernanceToken.deploy();

        MyGovernor = await ethers.getContractFactory("MyGovernor");
        myGovernor = await MyGovernor.deploy(await governanceToken.getAddress());

        // Transfer tokens to addr1 and addr2
        await governanceToken.transfer(addr1.address, 1000);
        await governanceToken.transfer(addr2.address, 1000);

        // Delegate votes
        await governanceToken.connect(owner).delegate(owner.address);
        await governanceToken.connect(addr1).delegate(addr1.address);
        await governanceToken.connect(addr2).delegate(addr2.address);
    });

    it("Should allow creating a standard proposal", async function () {
        const targets = [await governanceToken.getAddress()];
        const values = [0];
        const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr1.address, 50])];
        const description = "Proposal #1: Give 50 tokens to addr1";

        await myGovernor.propose(targets, values, calldatas, description, 0 /* Standard */);

        // We can't easily guess ID, so we query events or check state
        // Just checking no revert
    });

    it("Should handle Standard Voting correctly", async function () {
        const targets = [await governanceToken.getAddress()];
        const values = [0];
        const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr1.address, 50])];
        const description = "Standard Vote";

        const tx = await myGovernor.propose(targets, values, calldatas, description, 0);
        const receipt = await tx.wait();
        const proposalId = receipt.logs[0].args[0];

        // Wait for voting delay
        await time.increase(2); // 1 block delay

        // Vote
        await myGovernor.castVote(proposalId, 1 /* For */);

        // Verify weight
        const proposalData = await myGovernor.proposalVotes(proposalId);
        // owner has ~1M tokens (minus transfers)
        expect(proposalData.forVotes).to.be.gt(0);
    });

    it("Should handle Quadratic Voting logic - Cost and Weight", async function () {
        const targets = [await governanceToken.getAddress()];
        const values = [0];
        const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr1.address, 50])];
        const description = "QV Vote";

        const tx = await myGovernor.propose(targets, values, calldatas, description, 1 /* Quadratic */);
        const receipt = await tx.wait();
        const proposalId = receipt.logs[0].args[0];

        await time.increase(2);

        // addr1 has 1000 tokens
        // Wants to cast 10 votes. Cost = 100 tokens.
        // Must approve Governor to spend tokens
        await governanceToken.connect(addr1).approve(await myGovernor.getAddress(), 100);

        const votesToBuy = 10;
        const params = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [votesToBuy]);

        await expect(
            myGovernor.connect(addr1).castVoteWithParams(proposalId, 1, "", params)
        ).to.emit(myGovernor, "VoteCast");

        const proposalData = await myGovernor.proposalVotes(proposalId);
        expect(proposalData.forVotes).to.equal(10);

        // Verify token balance decreased
        expect(await governanceToken.balanceOf(addr1.address)).to.equal(900); // 1000 - 100
    });

    it("Should fail QV if insufficient balance", async function () {
        const targets = [await governanceToken.getAddress()];
        const values = [0];
        const calldatas = [governanceToken.interface.encodeFunctionData("transfer", [addr1.address, 50])];
        const description = "QV Vote Fail";

        const tx = await myGovernor.propose(targets, values, calldatas, description, 1);
        const receipt = await tx.wait();
        const proposalId = receipt.logs[0].args[0];

        await time.increase(2);

        // addr1 tries to vote 50 votes = 2500 cost. Only has 1000.
        await governanceToken.connect(addr1).approve(await myGovernor.getAddress(), 2500);

        const votesToBuy = 50;
        const params = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [votesToBuy]);

        await expect(
            myGovernor.connect(addr1).castVoteWithParams(proposalId, 1, "", params)
        ).to.be.reverted;
    });
});
