// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/presets/ERC20PresetMinterPauserUpgradeable.sol";

contract DNYCV is ERC20PresetMinterPauserUpgradeable {
    function initialize(
        string memory name,
        string memory symbol
    ) public virtual override initializer {
        __ERC20PresetMinterPauser_init(name, symbol);
    }
}
