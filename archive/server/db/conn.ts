import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

export const collections: {
  group?: mongoDB.Collection;
  item?: mongoDB.Collection;
  user?: mongoDB.Collection;
} = {};

export async function connectToDatabase() {
  dotenv.config();

  const client: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.MONGO_URL
  );

  await client.connect();

  const db: mongoDB.Db = client.db("packster");

  const groupCollection: mongoDB.Collection = db.collection("group");
  const itemCollection: mongoDB.Collection = db.collection("item");
  const userCollection: mongoDB.Collection = db.collection("user");

  collections.group = groupCollection;
  collections.item = itemCollection;
  collections.user = userCollection;
}
