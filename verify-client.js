import { GoogleGenAI } from "@google/genai";
try {
    const client = new GoogleGenAI("test_key");
    console.log("Client keys:", Object.keys(client));
    console.log("Client prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
} catch (e) {
    console.error("Error instantiating client:", e);
}
