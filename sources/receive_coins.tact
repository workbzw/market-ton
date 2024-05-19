// Ownable has to be imported from stdlib, as well as Deployable, for convenience:
import "@stdlib/ownable";
import "@stdlib/deploy";

message PayEvent {
    amount: Int as coins;
    recipient: Address;
}


contract ReceiveCoins with Deployable,Ownable {

    const MinTonForStorage: Int = ton("0.01");
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    // receive empty messages, these are usually simple TON coin transfers to the contract
    receive("pay") {
        require(context().value>=ton("0.1"),"ton value is less than 0.1!");
        // revert the transaction if balance is growing over 3 TON
        require(myBalance() <= ton("3"), "Balance getting too high");
    }
    // receive empty messages, these are usually simple TON coin transfers to the contract
    receive() {
        require(context().value>=ton("0.1"),"ton value is less than 0.1!");
        // revert the transaction if balance is growing over 3 TON
        require(myBalance() <= ton("3"), "Balance getting too high");
    }

    get fun balance(): Int {
        return myBalance(); // in nano-tons (like cents, just with 9 decimals)
    }

    receive("withdraw all") {
    let ctx: Context = context();
            require(ctx.sender == self.owner, "Only owner is allowed to withdraw");
            send(SendParameters{
                to: ctx.sender,
                bounce: true,
                value: 0,
                mode: SendRemainingBalance + SendIgnoreErrors
            });
        }

        // this will withdraw the entire balance but leave 0.01 for storage rent costs
        receive("withdraw safe") {
        let ctx: Context = context();
            require(ctx.sender == self.owner, "Only owner is allowed to withdraw");
            send(SendParameters{
                to: ctx.sender,
                bounce: true,
                value: myBalance() - context().value - self.MinTonForStorage,
                mode: SendRemainingValue + SendIgnoreErrors
            });
        }
}
