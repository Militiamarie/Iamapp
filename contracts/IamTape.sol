// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title I AM — 1/1 tapes on Base
contract IamTape {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint256 => address) public ownerOf;
    mapping(uint256 => string) private _tokenURI;
    mapping(uint256 => address) public getApproved;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    function tokenURI(uint256 id) external view returns (string memory) {
        require(ownerOf[id] != address(0), "none");
        return _tokenURI[id];
    }

    function mint(string calldata uri) external returns (uint256 id) {
        id = ++totalSupply;
        ownerOf[id] = msg.sender;
        _tokenURI[id] = uri;
        unchecked {
            balanceOf[msg.sender] += 1;
        }
        emit Transfer(address(0), msg.sender, id);
    }

    function approve(address spender, uint256 id) external {
        address owner = ownerOf[id];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "auth");
        getApproved[id] = spender;
        emit Approval(owner, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 id) public {
        require(to != address(0), "to");
        address owner = ownerOf[id];
        require(owner == from, "from");
        require(
            msg.sender == owner || isApprovedForAll[owner][msg.sender] || msg.sender == getApproved[id],
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
        return id == 0x01ffc9a7 || id == 0x80ac58cd || id == 0x5b5e139f;
    }

    function _onReceived(address from, address to, uint256 id) private returns (bool) {
        (bool ok, bytes memory ret) = to.call(
            abi.encodeWithSelector(bytes4(0x150b7a02), msg.sender, from, id, "")
        );
        return ok && ret.length >= 32 && abi.decode(ret, (bytes4)) == bytes4(0x150b7a02);
    }
}
