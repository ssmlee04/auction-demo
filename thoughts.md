# rough ideas

The idea is to have the validation logic occur on the servers. We will assume clients are associated with identities, so when you perform a bidding, you will only be able to create bids based on your identity. One thought is to have the server provide some sort of authentication, after which you are granted an identity token. You will pass this token in all future subsequent RPC calls so the server knows who you are.

For bidding: for stateful applications, I will have an auction state with a list of biddings, and append the bids in a single-threaded way if the bids are valid. In a SQL world I might use 2-phase commit to get around race conditions. As for Hyperbee, I'm unsure what's the best thing to do here so the following code is probably not safe against race conditions.

Another thing is broadcasting. It seems that I can create a Pear terminal application and do `pear dev` for clients to connect to each other. However, in terms of `@hyperswarm/rpc` I wasn't able to find a way to broadcast messages to all rpcServer connections. If I can achieve that and have server broadcasting bids to subscribers, and then clients might be able to do a bit of validation before sending their bids.

# some db schema designs

* open auctions

an auction be like 

```
{
  _id: ... (this can be used as a topic people pubsub to)
  owner_id: ... (owner of the item)
  picture: ... (some metadata for actual lookup)
  bids: [bid1, bid2, ...]
}
```

a bid be like 

```
{
  user_id: ...
  amount: ...
  expiration_delta_ts: ... // this is like if someone bids on this listing, the expiration ts can be extended a bit for more decisions. 
}
```

a user is like 

```
{
  _id: ...
  name: ...
}
```

a user balance be like

```
{
 _id: ...
  user_id: ... 
  amount: 0
} 
```

# commands to run on clients:

This is reusing the example in the repos to mimic what the client is trying to achieve.

```
process.stdin.on('data', async (d) => { })
```

In reality you probably will have some client applications sending the RPC calls in a less hacky format. The following is a list of things the client can do.

```
$ list auctions.
[
  '0b924e8c-4aaa-4a69-bb50-cc315c9a5c24',
  ...

$ create auction: {"user_id": "user1", "picture_meta": "meta1"}
{
  id: 'e9e01fa6-bbd0-4fe4-9d37-4eb2bef14827',
  owner_id: 'user1',
  picture: 'meta1',
  history: [],
  expiration_ts: 1709753603817,
  is_open: true
}

$ bid auction: {"auction_id": "0b924e8c-4aaa-4a69-bb50-cc315c9a5c24", "user_id": "user3", "amount": 1}
ok // or invalid_bid_size or invalid_bid_time

$ get auction: {"auction_id": "0b924e8c-4aaa-4a69-bb50-cc315c9a5c24"}
{
  id: '0b924e8c-4aaa-4a69-bb50-cc315c9a5c24',
  owner_id: 'user1',
  picture: 'meta1',
  history: [
    {
      auction_id: '0b924e8c-4aaa-4a69-bb50-cc315c9a5c24',
      user_id: 'user3',
      amount: 2,
      expiration_delta_ts: 5000
    },
    ...
  }
}

$ close auction: {"auction_id": "0b924e8c-4aaa-4a69-bb50-cc315c9a5c24"}
{ error: 'cannot close auction' }
```