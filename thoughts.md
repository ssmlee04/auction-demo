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


create_auction() {

}
