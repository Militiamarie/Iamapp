// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title I AM — one Base contract, one token per 1/1.
/// OpenSea, Coinbase Wallet, and every other app read these same tokens.
contract IamTape {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    string public name;
    string public symbol;
    string public contractURI;
    address public owner;
    address public royaltyReceiver;
    uint96 public royaltyBps;
    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) private _tokenURI;
    mapping(uint256 => address) public getApproved;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    constructor(string memory name_, string memory symbol_, string memory contractURI_) {
        name = name_;
        symbol = symbol_;
        contractURI = contractURI_;
        owner = msg.sender;
        royaltyReceiver = msg.sender;
        royaltyBps = 1000;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "owner");
        _;
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        require(ownerOf[id] != address(0), "none");
        return _tokenURI[id];
    }

    /// @notice Fixed id so the house token and the OpenSea item are the same number.
    function mint(address to, uint256 id, string calldata uri) external onlyOwner {
        _mint(to, id, uri);
    }

    function mintMany(address to, uint256[] calldata ids, string[] calldata uris) external onlyOwner {
        require(ids.length == uris.length, "len");
        uint256 n = ids.length;
        for (uint256 i; i < n; ) {
            _mint(to, ids[i], uris[i]);
            unchecked {
                i++;
            }
        }
    }

    function setContractURI(string calldata uri) external onlyOwner {
        contractURI = uri;
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        require(bps <= 1000, "bps");
        royaltyReceiver = receiver;
        royaltyBps = bps;
    }

    function royaltyInfo(uint256, uint256 salePrice) external view returns (address, uint256) {
        return (royaltyReceiver, (salePrice * royaltyBps) / 10000);
    }

    function approve(address spender, uint256 id) external {
        address holder = ownerOf[id];
        require(msg.sender == holder || isApprovedForAll[holder][msg.sender], "auth");
        getApproved[id] = spender;
        emit Approval(holder, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        require(to != address(0), "to");
        address holder = ownerOf[id];
        require(holder == from, "from");
        require(
            msg.sender == holder || isApprovedForAll[holder][msg.sender] || msg.sender == getApproved[id],
            "auth"
        );
        delete getApproved[id];
        unchecked {
            balanceOf[from] -= 1;
            balanceOf[to] += 1;
        }
        ownerOf[id] = to;
        emit Transfer(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        transferFrom(from, to, id);
        require(to.code.length == 0 || _onReceived(from, to, id), "unsafe");
    }

    function safeTransferFrom(address from, address to, uint256 id, bytes calldata) external {
        transferFrom(from, to, id);
        require(to.code.length == 0 || _onReceived(from, to, id), "unsafe");
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 || id == 0x80ac58cd || id == 0x5b5e139f || id == 0x2a55205a;
    }

    function _mint(address to, uint256 id, string calldata uri) internal {
        require(to != address(0) && id != 0 && ownerOf[id] == address(0), "mint");
        ownerOf[id] = to;
        _tokenURI[id] = uri;
        unchecked {
            balanceOf[to] += 1;
            totalSupply += 1;
        }
        emit Transfer(address(0), to, id);
    }

    function _onReceived(address from, address to, uint256 id) private returns (bool) {
        (bool ok, bytes memory ret) = to.call(
            abi.encodeWithSelector(bytes4(0x150b7a02), msg.sender, from, id, "")
        );
        return ok && ret.length >= 32 && abi.decode(ret, (bytes4)) == bytes4(0x150b7a02);
    }
}
