/**
 * I _really_ hate doing it this way, but since EOS has moved almost all
 * of the packing and signing functionality out of their RPC endpoints,
 * the only other option is to port all the cryptographic functionality
 * (and potentially dependent libraries) out of JavaScript/TypeScript
 * and into Ruby. In the interest of expedience, for now, we'll have Ruby
 * shell out to Node in order to avoid this overhead.
 */

const { Api, JsonRpc } = require("eosjs");
const JsSignatureProvider = require("eosjs/dist/eosjs-jssig").default;

const fetch = require("node-fetch");
const { TextEncoder, TextDecoder } = require("util");

// Normally I wouldn't use positional args like this, but we shouldn't
// be calling this code directly (it should always be wrapped by the
// Ruby library), so this is probably fine for now.
const URI = process.argv[2];
const KEY = process.argv[3];
const ACCOUNT = process.argv[4];
const ACTION = process.argv[5];
const RECIPIENT = process.argv[6];
const AMOUNT = process.argv[7];
const MEMO = process.argv[8];

const eosSignatureProvider = new JsSignatureProvider([KEY]);
const eosRpc = new JsonRpc(URI, { fetch });
const eosApi = new Api({ rpc: eosRpc, signatureProvider: eosSignatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

(async () => {
  try {
    let result = await eosApi.transact({ actions: [{
      account: 'eosio.token',
      name: 'transfer',
      authorization: [{
        actor: ACCOUNT,
        permission: "active",
      }],
      data: {
        from: ACCOUNT,
        to: RECIPIENT,
        quantity: AMOUNT + ' EOS',
        memo: MEMO,
      }
    }]}, { blocksBehind: 3, expireSeconds: 30 });
    console.log(result);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
