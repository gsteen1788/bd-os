import { GoogleGenAI } from "@google/genai";
const client = new GoogleGenAI("test");
try {
    console.log("client.models keys:", Object.keys(client.models));
    console.log("client.models prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(client.models)));
} catch (e) {
    console.log("Error accessing client.models:", e);
}
