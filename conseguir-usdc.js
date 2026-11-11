import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const yo = Keypair.fromSecret(process.env.MI_SECRETA);

const QUIERO = "5";
const rutas = await horizon.strictReceivePaths([Asset.native()], USDC, QUIERO).call();
if (!rutas.records.length) throw new Error("No hay ruta XLM→USDC ahora. Usa https://faucet.circle.com (Stellar testnet).");
const mejor = rutas.records[0];
const maxXlm = (Number(mejor.source_amount) * 1.05).toFixed(7);
console.log(`Cuesta ~${mejor.source_amount} XLM recibir ${QUIERO} USDC`);

const cuenta = await horizon.loadAccount(yo.publicKey());
const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.pathPaymentStrictReceive({
    sendAsset: Asset.native(), sendMax: maxXlm,
    destination: yo.publicKey(), destAsset: USDC, destAmount: QUIERO,
    path: mejor.path.map((p) => (p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code, p.asset_issuer))),
  }))
  .setTimeout(60)
  .build();
tx.sign(yo);
const res = await horizon.submitTransaction(tx);
console.log(`✅ Ya tienes ${QUIERO} USDC de prueba: https://stellar.expert/explorer/testnet/tx/${res.hash}`);
