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
    Cell
} from "ton";
import {mnemonicToPrivateKey} from "ton-crypto";
import {buildOnchainMetadata} from "./utils/jetton-helpers";
import {SampleJetton} from "./output/jetton_SampleJetton";
import {name, description, symbol,supply,owner,image} from "./jetton.json"
import 'dotenv/config';

(async () => { //need changes for jetton

    //create client for testnet Toncenter API
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: 'bb38df0c2756c66e2ab49f064e2484ec444b01244d2bd49793bd5b58f61ae3d2'
    })

    //create client for testnet sandboxv4 API - alternative endpoint
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })

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

    // Get deployment wallet balance
    let balance: bigint = await contract.getBalance();

    // This is example data - Modify these params for your own jetton
    // - Data is stored on-chain (except for the image data itself)

    const jettonParams = {
        name: name,
        symbol: symbol,
        description: description,
        image: image // Image url
    };

    // Owner should usually be the deploying wallet's address.
    let jettonOwner = Address.parse(owner);


    // Create content Cell
    let content = buildOnchainMetadata(jettonParams);

    // Compute init data for deployment
    let init = await SampleJetton.init(jettonOwner, content);
    let destination_address = contractAddress(workchain, init);


    let deployAmount = toNano('1');
    let jettonSupply = toNano(supply); // specify total supply in nano


    // send a message on new address contract to deploy it
    let seqno: number = await contract.getSeqno();

    //TL-B mint#01fb345b amount:int257 = Mint
    let msg = beginCell().storeBuffer(Buffer.from("01fb345b", "hex")).storeInt(jettonSupply, 257).endCell();

    console.log('🛠️Preparing new outgoing massage from deployment wallet. Seqno = ', seqno);
    console.log('Current deployment wallet balance = ', fromNano(balance).toString(), '💎TON');
    console.log('Total supply for the deployed jetton = ', fromNano(jettonSupply));
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
            body: msg
        })]
    });
    console.log('======deployment message sent to ', destination_address, ' ======');
})();
