const Comptroller = artifacts.require("Comptroller");
const Comp = artifacts.require("Comp");
const GovernorAlpha = artifacts.require("GovernorAlpha");
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const Timelock = artifacts.require("Timelock");
const Unitroller = artifacts.require("Unitroller");
const Maximillion = artifacts.require("Maximillion");
const PriceOracleProxy = artifacts.require("PriceOracleProxy");
const WhitePaperInterestRateModel = artifacts.require(
  "WhitePaperInterestRateModel"
);
const CEther = artifacts.require("CEther");
//const StandardToken = artifacts.require("tests/contracts/StandardToken");

const BN = web3.utils.BN;

module.exports = async function (deployer, network, accounts) {
  const UNIT = new BN(10).pow(new BN(18)); // 1e18
  const ONE_DAY = 24 * 60 * 60;
  const THREE_DAYS = 3 * ONE_DAY;

  const admin = accounts[0];
  const guardian = accounts[1];

  // Deploy Comptroller
  await deployer.deploy(Comptroller);
  comptroller = await Comptroller.deployed();

  // Deploy Comp
  const comp = await deployer.deploy(Comp, admin);

  // Deploy Timelock
  const timelock = await deployer.deploy(Timelock, admin, THREE_DAYS);

  // Deploy GovernorAlpha
  const governorAlpha = await deployer.deploy(
    GovernorAlpha,
    timelock.address,
    comp.address,
    guardian
  );

  // Deploy SimplePriceOracle
  const simplePriceOracle = await deployer.deploy(SimplePriceOracle);

  // Deploy Unitroller
  const unitroller = await deployer.deploy(Unitroller);

  // Base Rate Per Year
  const baseRatePerYear = new BN("50000000000000000");
  // Multiplier
  const multiplier = new BN("120000000000000000");
  // Deploy WhitePaperInterestRateModel
  const interestRateModel = await deployer.deploy(
    WhitePaperInterestRateModel,
    baseRatePerYear,
    multiplier
  );

  const initialExchangeRateMantissa = UNIT;
  // Deploy cETH

  const cETH = await deployer.deploy(
    CEther,
    comptroller.address,
    interestRateModel.address,
    initialExchangeRateMantissa,
    "Compound Ether",
    "cETH",
    18,
    admin
  );

  // Deploy Maximillion
  const maximillion = await deployer.deploy(Maximillion, cETH.address);

  // Deploying ERC20 tokens
  /*
  const INIT_SUPPLY = new BN(1000000);
  const name = "0x";
  const symbol = "ZRX";
  const decimals = 18;
  const ONE_ZRX_TOKEN = new BN(10).pow(new BN(decimals));
  const initSupplyInTokens = INIT_SUPPLY.mul(ONE_ZRX_TOKEN);
  const ZRX = await deployer.deploy(
    StandardToken,
    initSupplyInTokens,
    name,
    decimals,
    symbol
  );
  */

  //await deployer.deploy(PriceOracleProxy);

  console.log("=======================");
  console.log("Compound Base Contracts");
  console.log("=======================");
  console.log("Comptroller: " + comptroller.address);
  console.log("Comp: " + comp.address);
  console.log("Timelock: " + timelock.address);
  console.log("GovernorAlpha: " + governorAlpha.address);
  console.log("SimplePriceOracle: " + simplePriceOracle.address);
  console.log("Unitroller: " + unitroller.address);
  console.log("InterestRateModel: " + interestRateModel.address);
  console.log("Maximillion: " + maximillion.address);

  console.log("==================");
  console.log("Compound Tokens");
  console.log("==================");
  console.log("cETH: " + cETH.address);

  console.log("=============");
  console.log("ERC20 Tokens");
  console.log("=============");
};
