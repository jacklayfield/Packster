import { syncedStore, getYjsDoc } from "@syncedstore/core";
import { WebrtcProvider } from "y-webrtc";
import { WebsocketProvider } from 'y-websocket'

// (optional, define types for TypeScript)
type Todo = { completed: boolean; title: string };

// Create your SyncedStore store
export const store = syncedStore({ todos: [] as Todo[], fragment: "xml" });

// Create a document that syncs automatically using Y-WebRTC



const doc = getYjsDoc(store);
//export const webrtcProvider = new WebrtcProvider("syncedstore-todos", doc);
export const wsProvider = new WebsocketProvider('ws://localhost:1234', 'syncedstore-todos', doc)

// export const disconnect = () => WebsocketProvider.disconnect();
// export const connect = () => WebsocketProvider.connect();
