'use strict'

const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')

const main = async () => {
  // hyperbee db
  const hcore = new Hypercore('./db/rpc-client' + crypto.randomUUID())
  const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
  await hbee.ready()

  // resolved distributed hash table seed for key pair
  let dhtSeed = (await hbee.get('dht-seed'))?.value
  if (!dhtSeed) {
    // not found, generate and store in db
    dhtSeed = crypto.randomBytes(32)
    await hbee.put('dht-seed', dhtSeed)
  }

  // start distributed hash table, it is used for rpc service discovery
  const dht = new DHT({
    port: 50001,
    keyPair: DHT.keyPair(dhtSeed),
    bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note boostrap points to dht that is started via cli
  })
  await dht.ready()

  // public key of rpc server, used instead of address, the address is discovered via dht
  const serverPubKey = Buffer.from('fc757faf39eb7140f512ed9b262a537584a0d6ff41c8e924026ec327503f5098', 'hex')

  // rpc lib
  const rpc = new RPC({ dht })

  const create_auction = async (user_id, picture_meta) => {
    const payload = { type: "create_auction", user_id, picture_meta }
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
    const respRaw = await rpc.request(serverPubKey, 'ping', payloadRaw)
    const resp = JSON.parse(respRaw.toString('utf-8'))
    console.log(resp);
  }

  const bid_auction = async (auction_id, user_id, amount) => {
    const payload = { type: "bid_auction", auction_id, user_id, amount }
    const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
    const respRaw = await rpc.request(serverPubKey, 'ping', payloadRaw)
    const resp = JSON.parse(respRaw.toString('utf-8'))
    console.log(resp)
  }

  process.stdin.on('data', async (d) => {
    const cmd = d.toString()
    console.log({ cmd })

    if (cmd.indexOf('create auction:') === 0) {
      // server handles create auction and does some validation there
      const { user_id, picture_meta } = JSON.parse(cmd.slice('create auction:'.length + 1).trim())
      create_auction(user_id, picture_meta)
    }
    if (cmd.indexOf('bid auction:') === 0) {
      // server handles bid operations and does some validation there
      const { auction_id, user_id, amount } = JSON.parse(cmd.slice('bid auction:'.length + 1).trim())
      bid_auction(auction_id, user_id, amount)
    }
    if (cmd.indexOf('list auctions.') === 0) {
      // we ask a server to give us a list of auctions
      const payload = { type: "list_auctions" }
      const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
      const respRaw = await rpc.request(serverPubKey, 'ping', payloadRaw)
      const resp = JSON.parse(respRaw.toString('utf-8'))
      console.log(resp)
    }
    if (cmd.indexOf('get auction:') === 0) {
      const { auction_id } = JSON.parse(cmd.slice('get auction:'.length + 1).trim())
      const payload = { type: "get_auction", auction_id }
      const payloadRaw = Buffer.from(JSON.stringify(payload), 'utf-8')
      const respRaw = await rpc.request(serverPubKey, 'ping', payloadRaw)
      const resp = JSON.parse(respRaw.toString('utf-8'))
      console.log(resp)
    }
  })

  // closing connection
  console.log('closing connection..')
  // await rpc.destroy()
  // await dht.destroy()
}


main().catch(console.error)