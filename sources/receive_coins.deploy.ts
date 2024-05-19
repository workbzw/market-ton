import {
    beginCell,
    contractAddress,
    toNano,
    TonClient,
    TonClient4,
    Address,
    WalletContractV4,
    internal,
    fromNano,
} from "ton";
import {mnemonicToPrivateKey} from "ton-crypto";
import {ReceiveCoins} from "./output/receive_coins_ReceiveCoins";
import 'dotenv/config';
import {name, description, symbol,supply,owner,image} from "./receive_coins.json"
(async () => { //need changes for jetton

    //create client for testnet sandboxv4 API - alternative endpoint
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    console.log("-----------------------client4-----------------------");
    let mnemonics = (process.env.MNEMONICS!);
    // read more about wallet apps https://ton.org/docs/participate/wallets/apps#tonhub-test-environment

    let keyPair = await mnemonicToPrivateKey(mnemonics.split(" "));
    let secretKey = keyPair.secretKey;
    //workchain = 1 - masterchain (expensive operation cost, validator's election contract works here)
    //workchain = 0 - basechain (normal operation cost, user's contracts works here)
    let workchain = 0; //we are working in basechain.
    //Create deployment wallet contract
    let wallet = WalletContractV4.create({workchain, publicKey: keyPair.publicKey});
    let contract = client4.open(wallet);
    console.log("-----------------------wallet-----------------------");

    // Get deployment wallet balance
    let balance: bigint = await contract.getBalance();
    let jettonOwner = Address.parse(owner);
    // This is example data - Modify these params for your own jetton
    // - Data is stored on-chain (except for the image data itself)

    // Compute init data for deployment
    let init = await ReceiveCoins.init(jettonOwner);
    let destination_address = contractAddress(workchain, init);
    console.log("-----------------------init-----------------------");

    let deployAmount = toNano('1');


    // send a message on new address contract to deploy it
    let seqno: number = await contract.getSeqno();

    //TL-B mint#01fb345b amount:int257 = Mint

    console.log("-----------------------receive-----------------------");
    console.log('🛠️Preparing new outgoing massage from deployment wallet. Seqno = ', seqno);
    console.log('Current deployment wallet balance = ', fromNano(balance).toString(), '💎TON');
    await contract.sendTransfer({
        seqno,
        secretKey,
        messages: [internal({
            value: deployAmount,
            to: destination_address,
            init: {
                code: init.code,
                data: init.data
            },
        })]
    });
    console.log('======deployment message sent to ', destination_address, ' ======');
})();
