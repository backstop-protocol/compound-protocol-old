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
const StandardToken = artifacts.require("StandardToken");
const CErc20 = artifacts.require("CErc20");

const BN = web3.utils.BN;
var assert = require("chai").assert;
var expect = require("chai").expect;

module.exports = async function (deployer, network, accounts) {
  const ZERO = new BN(0);
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

  // Deploying ZRX ERC20 tokens
  const INIT_SUPPLY = new BN(1000000);
  const decimals = 18;
  const ONE_ZRX_TOKEN = new BN(10).pow(new BN(decimals));
  const initSupplyInTokens = INIT_SUPPLY.mul(ONE_ZRX_TOKEN);
  const ZRX = await deployer.deploy(
    StandardToken,
    initSupplyInTokens,
    "0x",
    decimals,
    "ZRX"
  );

  // Deploy cZRX
  const cZRX = await CErc20.new(
    ZRX.address,
    comptroller.address,
    interestRateModel.address,
    initialExchangeRateMantissa,
    "Compound 0x",
    "cZRX",
    18
  );

  //await deployer.deploy(PriceOracleProxy);

  console.log("\nAdding cTokens to Market...");
  // Adding cETH to Market
  await comptroller._supportMarket(cETH.address);
  let result = await comptroller.markets(cETH.address);
  let isListed = result[0];
  assert(isListed, "ERROR: cETH not listed");

  // Adding cZRX to Market
  await comptroller._supportMarket(cZRX.address);
  result = await comptroller.markets(cZRX.address);
  isListed = result[0];
  assert(isListed, "ERROR: cZRX not listed");

  console.log("\nValidating setup...");
  // Minting cETH with ETH
  await cETH.mint({ value: web3.utils.toWei("1", "ether") });
  let ethBalOfcETHContract = await web3.eth.getBalance(cETH.address);
  assert(UNIT.eq(new BN(ethBalOfcETHContract)));
  let cETHBalOfUser = await cETH.balanceOf(admin);
  assert(UNIT.eq(cETHBalOfUser));

  // Redeem ETH with cETH
  await cETH.redeem(cETHBalOfUser);
  ethBalOfcETHContract = await web3.eth.getBalance(cETH.address);
  assert(ZERO.eq(new BN(ethBalOfcETHContract)));
  cETHBalOfUser = await cETH.balanceOf(admin);
  assert(ZERO.eq(cETHBalOfUser));

  console.log("Validation OK\n");
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
  console.log("");
  console.log("=============");
  console.log("ERC20 Tokens");
  console.log("=============");
  console.log("ZRX: " + ZRX.address);
  console.log("");
  console.log("==================");
  console.log("Compound Tokens");
  console.log("==================");
  console.log("cETH: " + cETH.address);
  console.log("cZRX: " + cZRX.address);
};
