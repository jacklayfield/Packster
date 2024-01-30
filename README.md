## Packster

#### A simple group packing app

TODO:

- [x] Decide between mongoose or mongodb driver (mongoose since most data will be structured, but mongodb driver could also work as long as some sort of schema is eforced)
  - Went with mongo driver + joi. Also makes sense to just use a SQL DB but wanted to switch it up.
- [x] Set up server in it's basic form (express, http, io)
- [x] Design and create model for a "item" entry for the items list
- [x] Implement frontend to create a "room" with a unique id
- [x] Client to server socket connection established and tested
- [x] Implement join room event for a ids
- [x] Implement item fetching for unique room
- [ ] Implement add item
- [ ] Decide how to handle client users

  - A. Users need to create an account
    - Pros: Easy to handle permissions / preferences, Can log in from multiple locations.
    - Cons: Will have to go through account creation process which is an extra step.
  - B. Store user in local storage
    - Pros: Allow user to dive right in, No set up time. No need to re log in once session expires.
    - Cons: Permissions is difficult / impossible if user gets removed from local storage or signs in to another device.
  - C. Userless. Don't even generate user data, just treat each session as new where the provided name is arbitrary.

    - Pros: Can do away with item by item permissions. Everyone can edit anything. Allows user to again dive right in.
    - Cons: Everyone can edit anything. Malicious intent could destroy someones work.

  - Addition to B & C. In these cases, it may be valuable to make account creation mandatory for the user creating a group. They will be granted admin permissions over the group ( ex. can delete anything, ban users, and elevate others permissions (assuming they have an account) ). Anyone can still join and they will be prompted to create an account IF they want to be able to permanently tie their items to their account, otherwise only for the session / local storage saved will they be granted permission over their added items. This will also allow the user who created the group easier management over their group(s).
