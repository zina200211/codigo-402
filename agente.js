import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";

const API = "http://localhost:3001/dato";
const NETWORK = "stellar:testnet";
const TOPE = process.env.TOPE || "$0.02"; // lo máximo que el agente paga por una llamada

// El agente firma con SU wallet, nunca con la tuya
const signer = createEd25519Signer(process.env.AGENTE_SECRETA, NETWORK);
const client = x402Client.fromConfig({
  schemes: [{ network: "stellar:*", client: new ExactStellarScheme(signer, { url: "https://soroban-testnet.stellar.org" }) }],
  // Tope por pago: si la API cobra más, x402 lo rechaza ANTES de firmar
  spendControls: { maxAmountPerPayment: TOPE },
});
const fetchQuePaga = wrapFetchWithPayment(fetch, client);

console.log(`🤖 Agente ${signer.address} pide ${API} (tope ${TOPE} por pago)`);
try {
  const res = await fetchQuePaga(API);
  const pago = new x402HTTPClient(client).getPaymentSettleResponse((h) => res.headers.get(h));
  console.log(`Respuesta ${res.status}:`, await res.json());
  console.log(`Pagó: https://stellar.expert/explorer/testnet/tx/${pago.transaction}`);
} catch (e) {
  if (String(e.message).includes("maxAmountPerPayment")) {
    console.log(`⛔ Rechazado: la API cobra más que el tope (${TOPE}). No se firmó ni se envió ninguna transacción.`);
    process.exit(1);
  }
  throw e;
}
