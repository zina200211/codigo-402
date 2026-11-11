import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE, Memo } from "@stellar/stellar-sdk";

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const yo = Keypair.fromSecret(process.env.MI_SECRETA);
const amigo = process.env.AMIGO_PUBLICA;

const cuenta = await horizon.loadAccount(yo.publicKey());
const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.payment({ destination: amigo, asset: USDC, amount: "1" }))
  .addMemo(Memo.text("Codigo 402 - mi primer pago"))
  .setTimeout(60)
  .build();
tx.sign(yo);
const res = await horizon.submitTransaction(tx);

console.log("✅ Pago enviado: 1 USDC");
console.log(`Hash: ${res.hash}`);
console.log(`Míralo: https://stellar.expert/explorer/testnet/tx/${res.hash}`);
