import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";
import { writeFileSync, existsSync } from "node:fs";

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");

if (existsSync(".env") && process.env.MI_SECRETA) {
  console.log("Ya tienes cuentas en .env. Bórralo solo si quieres empezar de cero.");
  process.exit(0);
}

async function crearCuenta(nombre) {
  const kp = Keypair.random();
  // Friendbot regala 10,000 XLM de prueba
  const r = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  if (!r.ok) throw new Error(`Friendbot falló para ${nombre}: ${r.status}`);
  // Trustline: "acepto recibir USDC"
  const cuenta = await horizon.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  const res = await horizon.submitTransaction(tx);
  console.log(`✅ ${nombre}: ${kp.publicKey()}`);
  console.log(`   trustline USDC: https://stellar.expert/explorer/testnet/tx/${res.hash}`);
  return kp;
}

const yo = await crearCuenta("Tu cuenta");
const amigo = await crearCuenta("Cuenta de tu amigo");

writeFileSync(".env", `MI_PUBLICA=${yo.publicKey()}\nMI_SECRETA=${yo.secret()}\nAMIGO_PUBLICA=${amigo.publicKey()}\nAMIGO_SECRETA=${amigo.secret()}\n`);
console.log("\nListo. Tus llaves quedaron en .env (no se sube a GitHub).");
console.log(`Mira tu cuenta: https://stellar.expert/explorer/testnet/account/${yo.publicKey()}`);
