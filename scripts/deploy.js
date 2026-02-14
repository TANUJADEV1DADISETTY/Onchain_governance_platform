const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy GovernanceToken
    const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
    const governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();
    const tokenAddress = await governanceToken.getAddress();
    console.log("GovernanceToken deployed to:", tokenAddress);

    // Deploy MyGovernor
    const MyGovernor = await hre.ethers.getContractFactory("MyGovernor");
    const myGovernor = await MyGovernor.deploy(tokenAddress);
    await myGovernor.waitForDeployment();
    const governorAddress = await myGovernor.getAddress();
    console.log("MyGovernor deployed to:", governorAddress);

    // Delegate votes to deployer to enable proposal creation
    await governanceToken.delegate(deployer.address);
    console.log("Delegated votes to deployer");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
