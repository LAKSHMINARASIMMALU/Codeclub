// seed.js
import dotenv from "dotenv";
dotenv.config();
import { db } from "./firebase.js";

const QUESTIONS = [
  {
    title: "Sum of Two Numbers",
    description: "Read two integers separated by space and print their sum.",
    sampleInput: "5 7",
    expectedOutput: "12",
    score: 10
  },
  {
    title: "Factorial",
    description: "Given n, print n! (small n).",
    sampleInput: "5",
    expectedOutput: "120",
    score: 15
  },
  {
    title: "Reverse String",
    description: "Reverse the input string.",
    sampleInput: "hello",
    expectedOutput: "olleh",
    score: 10
  }
];

async function seed() {
  for (const q of QUESTIONS) {
    const doc = await db.collection("questions").add({ ...q, createdAt: new Date() });
    console.log("Added question id=", doc.id, q.title);
  }
  console.log("Seeding done");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
