const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim() : process.env.GEMINI_API_KEY;

async function run() {
  try {
    const modelsInfo = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await modelsInfo.json();
    console.log("Available models:", data.models.map(m => m.name).filter(n => n.includes("gemini-2")));
  } catch (err) {
    console.error(err);
  }
}
run();
