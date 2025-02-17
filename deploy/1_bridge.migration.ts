import { Deployer, Reporter, UserStorage } from '@solarity/hardhat-migrate';

import { parseConfig } from './helpers/config-parser';

import {
  AGEN__factory,
  ERC1967Proxy__factory,
  L2MessageReceiver__factory,
  L2TokenReceiver__factory,
  NonfungiblePositionManagerMock__factory,
  StETHMock__factory,
  SwapRouterMock__factory,
  WStETHMock__factory,
} from '@/generated-types/ethers';
import { IL2TokenReceiver } from '@/generated-types/ethers/contracts/L2TokenReceiver';

module.exports = async function (deployer: Deployer) {
  const config = parseConfig(await deployer.getChainId());
  console.log({ config });
  let WStETH: string;
  let swapRouter: string;
  let nonfungiblePositionManager: string;

  if (config.L2) {
    WStETH = config.L2.wStEth;
    swapRouter = config.L2.swapRouter;
    nonfungiblePositionManager = config.L2.nonfungiblePositionManager;
  } else {
    // deploy mock
    console.log('DEPLOYING MOCKS!!!');
    const stETHMock = await deployer.deploy(StETHMock__factory, [], { name: 'StETH on L2' });
    const stETH = await stETHMock.getAddress();
    console.log('stETH ADD: ', stETH);

    const wStEthMock = await deployer.deploy(WStETHMock__factory, [stETH], { name: 'Wrapped stETH on L2' });
    WStETH = await wStEthMock.getAddress();
    console.log('wStEthMock ADD: ', WStETH);

    const swapRouterMock = await deployer.deploy(SwapRouterMock__factory);
    swapRouter = await swapRouterMock.getAddress();
    console.log('swapRouterMock ADD: ', swapRouter);

    const nonfungiblePositionManagerMock = await deployer.deploy(NonfungiblePositionManagerMock__factory);
    nonfungiblePositionManager = await nonfungiblePositionManagerMock.getAddress();
  }

  const AGEN = await deployer.deploy(AGEN__factory, [config.cap]);
  if (!UserStorage.has('AGEN')) UserStorage.set('AGEN', await AGEN.getAddress());

  // const AGENProxy = await deployer.deploy()

  const swapParams: IL2TokenReceiver.SwapParamsStruct = {
    tokenIn: WStETH,
    tokenOut: AGEN,
    fee: config.swapParams.fee,
    sqrtPriceLimitX96: config.swapParams.sqrtPriceLimitX96,
  };

  const l2TokenReceiverImpl = await deployer.deploy(L2TokenReceiver__factory);
  const l2TokenReceiverProxy = await deployer.deploy(ERC1967Proxy__factory, [l2TokenReceiverImpl, '0x'], {
    name: 'L2TokenReceiver Proxy',
  });
  if (!UserStorage.has('L2TokenReceiver Proxy'))
    UserStorage.set('L2TokenReceiver Proxy', await l2TokenReceiverProxy.getAddress());
  const l2TokenReceiver = L2TokenReceiver__factory.connect(
    await l2TokenReceiverProxy.getAddress(),
    await deployer.getSigner(),
  );
  await l2TokenReceiver.L2TokenReceiver__init(swapRouter, nonfungiblePositionManager, swapParams);

  const l2MessageReceiverImpl = await deployer.deploy(L2MessageReceiver__factory);
  const l2MessageReceiverProxy = await deployer.deploy(ERC1967Proxy__factory, [l2MessageReceiverImpl, '0x'], {
    name: 'L2MessageReceiver Proxy',
  });
  if (!UserStorage.has('L2MessageReceiver Proxy'))
    UserStorage.set('L2MessageReceiver Proxy', await l2MessageReceiverProxy.getAddress());
  const l2MessageReceiver = L2MessageReceiver__factory.connect(
    await l2MessageReceiverProxy.getAddress(),
    await deployer.getSigner(),
  );
  await l2MessageReceiver.L2MessageReceiver__init();

  await AGEN.transferOwnership(l2MessageReceiver);

  Reporter.reportContracts(
    ['L2TokenReceiver', await l2TokenReceiver.getAddress()],
    ['L2MessageReceiver', await l2MessageReceiver.getAddress()],
    ['AGEN', await AGEN.getAddress()],
  );
};
