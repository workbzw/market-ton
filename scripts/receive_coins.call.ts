import {Address, toNano,} from "@ton/core";
import {ReceiveCoins} from "../sources/output/receive_coins_ReceiveCoins";
import {NetworkProvider} from '@ton/blueprint';
import 'dotenv/config';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse("EQBalsAsr2tvAB4c9r_zTJc84xgaE-7Rkl4iLUYEKCcu4Nwx");

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }
    const contract = ReceiveCoins.fromAddress(address);
    const simpleCounter = provider.open(contract);


    await simpleCounter.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Add',
            queryId: 0n,
            amount: 1n,
        }
    );
    ui.write('Waiting for counter to increase...');
    ui.clearActionPrompt();
    ui.write('Counter increased successfully!');
}
