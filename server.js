'use strict'

const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')

const max_number_auctions = 10;

const is_valid_bid = (bid, expiration_ts, history) => {
  return { error: null }
}

const main = async () => {
  // hyperbee db
  const hcore = new Hypercore('./db/rpc-server')
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
    port: 40001,
    keyPair: DHT.keyPair(dhtSeed),
    bootstrap: [{ host: '127.0.0.1', port: 30001 }] // note boostrap points to dht that is started via cli
  })
  await dht.ready()

  // resolve rpc server seed for key pair
  let rpcSeed = (await hbee.get('rpc-seed'))?.value
  if (!rpcSeed) {
    rpcSeed = crypto.randomBytes(32)
    await hbee.put('rpc-seed', rpcSeed)
  }

  // setup rpc server
  const rpc = new RPC({ seed: rpcSeed, dht })
  const rpcServer = rpc.createServer()
  await rpcServer.listen()
  console.log('rpc server started listening on public key:', rpcServer.publicKey.toString('hex'))
  // rpc server started listening on public key: 763cdd329d29dc35326865c4fa9bd33a45fdc2d8d2564b11978ca0d022a44a19

  const make_auction = async (user_id, picture_meta) => {
    const id = crypto.randomUUID()
    const auction = {
      id,
      owner_id: user_id,
      picture: picture_meta, 
      history: [],
      expiration_ts: Date.now()
    }
    return auction
  }

  const bid_auction = async (auction_id, user_id, amount) => {
    let auction = JSON.parse((await hbee.get(auction_id))?.value)
    const default_expiration_delta_ts = 5000
    const bid = { auction_id, user_id, amount, expiration_delta_ts: default_expiration_delta_ts }

    const { error, message } = is_valid_bid(bid, auction_id.expiration_ts, auction.history)
    if (error === 'invalid_bid_size') {
      const respRaw = Buffer.from('invalid bid size', 'utf-8')
      return respRaw
    }
    if (error === 'invalid_bid_time') {
      const respRaw = Buffer.from('invalid bid time', 'utf-8')
      return respRaw
    }
    auction.history.push(bid)
    await hbee.put(auction_id, JSON.stringify(auction))
    const respRaw = Buffer.from('bid is ok', 'utf-8')
    return respRaw
  }

  const check_and_close_auction = async (auction_id) => {
    // get auction by id
    // add owner balance and subtract user balance
    // transfer item ownership to new user
  }
  
  const list_auctions = async () => {
    let info = []
    try {
      info = JSON.parse((await hbee.get('auction_list'))?.value.toString())
    } catch (err) {

    }
    return info
  }

  // bind handlers to rpc server
  rpcServer.respond('ping', async (reqRaw) => {
    // reqRaw is Buffer, we need to parse it
    const req = JSON.parse(reqRaw.toString('utf-8'))

    if (req.type === 'create_auction') {
      const auction = await make_auction(req.user_id, req.picture_meta)
      await hbee.put(auction.id, JSON.stringify(auction))
      let info = []
      try {
        info = JSON.parse((await hbee.get('auction_list'))?.value.toString())
      } catch (err) {

      }
      const auction_ids = info.concat([auction.id])
      await hbee.put("auction_list", JSON.stringify(auction_ids))
      const respRaw = Buffer.from(JSON.stringify(auction), 'utf-8')
      return respRaw
    }
    if (req.type === 'bid_auction') {
      const result = await bid_auction(req.auction_id, req.user_id, req.amount)
      const respRaw = Buffer.from(JSON.stringify(result), 'utf-8')
      return respRaw
    }
    if (req.type === 'list_auctions') {
      const auction_ids = await list_auctions()
      const respRaw = Buffer.from(JSON.stringify(info), 'utf-8')
      return respRaw
    }
  })
  
  setInterval(async () => {
    const auction_ids = await auction_ids()
    auction_ids.map(check_and_close_auction)
  }, 5000)
}

main().catch(console.error)
