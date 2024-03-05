* open auctions

an auction be like 

{
  _id: ... (this can be used as a topic people pubsub to)
  owner_id: ... (owner of the item)
  picture: ... (some metadata for actual lookup)
}

a user is like 

{
  _id: ...
  name: ...
}

a balance be like

{
 _id: ...
  user_id: ... 
  amount: 0
}

a bid be like 

{
  _id: ...
  auction_id: ...
  user_id: ...
  ts: ...
}


# commands:

create auction: {"user_id": "user1", "picture_meta": "meta1"}
get auction: {"auction_id": "b1d0f5b4-d207-48e4-aa29-f6e03778e357"}
bid auction: {"auction_id": "b1d0f5b4-d207-48e4-aa29-f6e03778e357", "user_id": "user3", "amount": 2}
