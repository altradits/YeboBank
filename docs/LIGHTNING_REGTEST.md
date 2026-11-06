# Lightning on regtest (local)

The demo never touches mainnet. For local Lightning mechanics against a
real node, run bitcoind + LND on **regtest** and point the fake's internals
at it. The YeboBank adapter still goes through the Altradits contract —
only the fake's internals swap from in-memory to regtest LND.

## Option A: docker compose (in this repo)

```bash
cd docker/regtest
docker compose up -d
# wait ~30s, then mine a few blocks and create the LND wallet (first run):
docker compose exec bitcoind bitcoin-cli -regtest -rpcuser=regtest -rpcpassword=regtest generatenewaddress
```

The compose file (`docker/regtest/docker-compose.yml`) runs:

- `bitcoind` on regtest (ports 18443 RPC, 19444 P2P)
- `lnd` on regtest with `--bitcoin.node=bitcoind` (ports 10029 REST, 19735 P2P)

Export the connection for the fake's internals:

```bash
export LND_REGTEST_REST_URL=https://127.0.0.1:10029
export LND_REGTEST_INVOICE_MACAROON=$(xxd -p -c 1000 docker/regtest/data/lnd/data/chain/bitcoin/regtest/invoice.macaroon)
export LND_REGTEST_READONLY_MACAROON=$(xxd -p -c 1000 docker/regtest/data/lnd/data/chain/bitcoin/regtest/readonly.macaroon)
export LND_REGTEST_TLS_CERT=$(base64 -i docker/regtest/data/lnd/tls.cert)
```

Then run the frontend with `ALTRADITS_MODE=fake` (default): invoice create
and status calls go to regtest LND; mode reports as `fake+regtest`.

## Option B: Polar

Create a regtest network with 1 bitcoind + 1 LND in
[Polar](https://lightningpolar.com), fund and open a channel, then export
the same four variables from the node's REST endpoint, macaroons
(`invoice.macaroon`, `readonly.macaroon`), and `tls.cert`.

## Never mainnet

- These variables are the only node connection the repo supports, and they
  are regtest-shaped on purpose.
- Never point them at a mainnet node. Never read `~/.lnd-altradits`
  (Stanley's mainnet node) from this repo — the fake does not know that
  path and must never learn it.
