import { EventEmitter } from "events";
export const tokenEvents = new EventEmitter();
// Usage: tokenEvents.emit("tokenReady");
// Listen: tokenEvents.on("tokenReady", () => { ... });
