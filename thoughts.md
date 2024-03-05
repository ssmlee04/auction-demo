# rough ideas

The idea is to have the validation logic occur on the servers. We will assume clients are associated with identities, so when you perform a bidding, you will only be able to create bids based on your identity. One thought is to have the server provide some sort of authentication, after which you are granted an identity token. You will pass this token in all future subsequent RPC calls so the server knows who you are.

For bidding: for usual stateful applications I will have an auction state with a history of bids. And upon receiving new bids I will do the validation there and attach new bids. In a SQL world I will use 2-phase commit. As for Hyperbee, I'm unsure what's the best thing to do here so the following code is probably not ok against race conditions.

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
  'cc40a0ed-9bb9-412a-bd23-6249e94fc4b4',
  'a1862682-e8c2-4302-babe-2231e871bee6',
  '45d7f3d1-01da-42ca-8a71-045416b87707',
  '9d000a6b-1594-410b-8166-7173427ae2b5',
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

$ bid auction: {"auction_id": "44fcc971-fcea-461b-a73b-f948064a81e1", "user_id": "user3", "amount": 1}
ok // or invalid_bid_size or invalid_bid_time

$ get auction: {"auction_id": "44fcc971-fcea-461b-a73b-f948064a81e1"}
{
  id: '44fcc971-fcea-461b-a73b-f948064a81e1',
  owner_id: 'user1',
  picture: 'meta1',
  history: [
    {
      auction_id: '44fcc971-fcea-461b-a73b-f948064a81e1',
      user_id: 'user3',
      amount: 2,
      expiration_delta_ts: 5000
    },
    ...
  }
}
```