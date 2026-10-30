// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal official-agent binding for the prototype. Human uniqueness is
/// an external enrollment assumption; this contract does not prove personhood.
contract AgentRegistry {
    struct Agent {
        address principal;
        address wallet;
        string metadataURI;
        bool active;
    }

    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public officialAgentOf;

    event AgentRegistered(uint256 indexed agentId, address indexed principal, address indexed wallet, string metadataURI);
    event AgentWalletChanged(uint256 indexed agentId, address indexed oldWallet, address indexed newWallet);
    event AgentMetadataChanged(uint256 indexed agentId, string metadataURI);
    event AgentStatusChanged(uint256 indexed agentId, bool active);

    modifier onlyPrincipal(uint256 agentId) {
        require(agents[agentId].principal == msg.sender, "not principal");
        _;
    }

    function register(address wallet, string calldata metadataURI) external returns (uint256 agentId) {
        require(officialAgentOf[msg.sender] == 0, "already has official agent");
        require(wallet != address(0), "zero wallet");
        agentId = nextAgentId++;
        agents[agentId] = Agent(msg.sender, wallet, metadataURI, true);
        officialAgentOf[msg.sender] = agentId;
        emit AgentRegistered(agentId, msg.sender, wallet, metadataURI);
    }

    function setWallet(uint256 agentId, address wallet) external onlyPrincipal(agentId) {
        require(wallet != address(0), "zero wallet");
        address oldWallet = agents[agentId].wallet;
        agents[agentId].wallet = wallet;
        emit AgentWalletChanged(agentId, oldWallet, wallet);
    }

    function setMetadataURI(uint256 agentId, string calldata metadataURI) external onlyPrincipal(agentId) {
        agents[agentId].metadataURI = metadataURI;
        emit AgentMetadataChanged(agentId, metadataURI);
    }

    function setActive(uint256 agentId, bool active) external onlyPrincipal(agentId) {
        agents[agentId].active = active;
        emit AgentStatusChanged(agentId, active);
    }
}
