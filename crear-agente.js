import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";
import { appendFileSync } from "node:fs";

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const PRESUPUESTO = "0.05"; // lo único que el agente puede gastar

if (process.env.AGENTE_SECRETA) {
  console.log("El agente ya tiene wallet en .env.");
  process.exit(0);
}

// 1. Wallet nueva solo para el agente: XLM de Friendbot y trustline de USDC
const agente = Keypair.random();
const r = await fetch(`https://friendbot.stellar.org?addr=${agente.publicKey()}`);
if (!r.ok) throw new Error(`Friendbot falló: ${r.status}`);
let cuenta = await horizon.loadAccount(agente.publicKey());
let tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.changeTrust({ asset: USDC }))
  .setTimeout(60).build();
tx.sign(agente);
await horizon.submitTransaction(tx);

// 2. Tu cuenta le pasa un presupuesto chico de USDC
const yo = Keypair.fromSecret(process.env.MI_SECRETA);
cuenta = await horizon.loadAccount(yo.publicKey());
tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.payment({ destination: agente.publicKey(), asset: USDC, amount: PRESUPUESTO }))
  .setTimeout(60).build();
tx.sign(yo);
const res = await horizon.submitTransaction(tx);

appendFileSync(".env", `AGENTE_PUBLICA=${agente.publicKey()}\nAGENTE_SECRETA=${agente.secret()}\n`);
console.log(`✅ Wallet del agente: ${agente.publicKey()}`);
console.log(`   Presupuesto: ${PRESUPUESTO} USDC https://stellar.expert/explorer/testnet/tx/${res.hash}`);
