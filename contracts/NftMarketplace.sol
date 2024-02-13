// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__NftNotExist(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwnerOfNftToken(address nftAddress, uint256 tokenId);
error NftMarketplace__OwnerOfNftToken(address nftAddress, uint256 tokenId);
error NftMarketplace__NotApprovedForMarketplace(
    address nftAddress,
    uint256 tokenId
);
error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__notListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarketplace__NoProceeds(address proceedsWithdrawer);
error NftMarketplace__ProceedsTransferFailed(address proceedsWithdrawer);

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;
    event NftListed(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event ItemCanceled(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller
    );
    event NftBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event WithdrawProceeded(address indexed withdrawer, uint256 amount);

    modifier isOwner(address _nftAddress, uint256 _tokenId) {
        IERC721 nftContract = IERC721(_nftAddress);
        if (nftContract.ownerOf(_tokenId) != msg.sender) {
            revert NftMarketplace__OwnerOfNftToken(_nftAddress, _tokenId);
        }
        _;
    }
    modifier notOwner(address _nftAddress, uint _tokenId) {
        IERC721 nftContract = IERC721(_nftAddress);
        if (nftContract.ownerOf(_tokenId) == msg.sender) {
            revert NftMarketplace__NotOwnerOfNftToken(_nftAddress, _tokenId);
        }
        _;
    }
    modifier notListed(address _nftAddress, uint256 _tokenId) {
        Listing memory listing = s_listings[_nftAddress][_tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(_nftAddress, _tokenId);
        }
        _;
    }
    modifier isListed(address _nftAddress, uint256 _tokenId) {
        Listing memory listing = s_listings[_nftAddress][_tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__notListed(_nftAddress, _tokenId);
        }
        _;
    }

    ////////////
    // Main Functions
    ///////////

    /*
     * @notice Method for listing nft
     * @param nftAddress Address of NFT contract
     *@param  _tokenId token id of nft
     *@param  _price sale price for each item
     */
    function listItem(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _price
    )
        external
        isOwner(_nftAddress, _tokenId)
        notListed(_nftAddress, _tokenId)
    {
        IERC721 nft = IERC721(_nftAddress);
        if (_price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        if (nft.getApproved(_tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace(
                _nftAddress,
                _tokenId
            );
        }
        s_listings[_nftAddress][_tokenId] = Listing(_price, msg.sender);
        emit NftListed(_nftAddress, _tokenId, msg.sender, _price);
    }

    function updateListItem(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _price
    )
        external
        isListed(_nftAddress, _tokenId)
        nonReentrant
        isOwner(_nftAddress, _tokenId)
    {
        if (_price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        s_listings[_nftAddress][_tokenId].price = _price;
        emit NftListed(_nftAddress, _tokenId, msg.sender, _price);
    }

    function RemoveListItem(
        address _nftAddress,
        uint256 _tokenId
    ) external isListed(_nftAddress, _tokenId) isOwner(_nftAddress, _tokenId) {
        delete (s_listings[_nftAddress][_tokenId]);
        emit ItemCanceled(_nftAddress, _tokenId, msg.sender);
    }

    function buyItem(
        address _nftAddress,
        uint256 _tokenId
    )
        external
        payable
        isListed(_nftAddress, _tokenId)
        notOwner(_nftAddress, _tokenId)
        nonReentrant
    {
        Listing memory listedNft = s_listings[_nftAddress][_tokenId];
        if (msg.value < listedNft.price) {
            revert NftMarketplace__PriceNotMet(
                _nftAddress,
                _tokenId,
                listedNft.price
            );
        }
        s_proceeds[listedNft.seller] += msg.value;
        delete (s_listings[_nftAddress][_tokenId]);
        IERC721(_nftAddress).safeTransferFrom(
            listedNft.seller,
            msg.sender,
            _tokenId
        );
        emit NftBought(msg.sender, _nftAddress, _tokenId, listedNft.price);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketplace__NoProceeds(msg.sender);
        }
        delete s_proceeds[msg.sender];
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarketplace__ProceedsTransferFailed(msg.sender);
        }
        emit WithdrawProceeded(msg.sender, proceeds);
    }

    function getProceeds(address _seller) external view returns (uint256) {
        return s_proceeds[_seller];
    }

    function getListing(
        address _nftAddress,
        uint256 _tokenId
    ) external view returns (Listing memory) {
        return s_listings[_nftAddress][_tokenId];
    }
}
