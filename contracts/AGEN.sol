// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20, ERC20Capped } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import { ERC20Votes, IVotes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import { IAGEN, IERC20 } from "./interfaces/IAGEN.sol";
import { IERC165 } from  "@openzeppelin/contracts/interfaces/IERC165.sol";

contract AGEN is IAGEN, ERC20, ERC20Votes, ERC20Capped, ERC20Burnable, Ownable {
    constructor(uint256 cap_) ERC20("AGEN", "AGEN") ERC20Capped(cap_) ERC20Permit("AGEN") {}

    function supportsInterface(bytes4 interfaceId_) external pure override returns (bool) {

        return
            interfaceId_ == type(IAGEN).interfaceId ||
            interfaceId_ == type(IERC20).interfaceId ||
            interfaceId_ == type(IERC165).interfaceId ||
            interfaceId_ == type(IVotes).interfaceId;
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function cap() public view override(IAGEN, ERC20Capped) returns (uint256) {
        return ERC20Capped.cap();
    }

    function mint(address account_, uint256 amount_) external onlyOwner {
        _mint(account_, amount_);
    }


    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }

    function _mint(address account, uint256 amount) internal override(ERC20, ERC20Capped, ERC20Votes) {
        super._mint(account, amount);
    }
}





