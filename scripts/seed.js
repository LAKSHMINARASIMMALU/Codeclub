// @ts-check
const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// IMPORTANT: Path to your service account key file
// Make sure to download this file from your Firebase project settings
// and place it in the root of your project.
// DO NOT commit this file to your git repository.
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}


const db = getFirestore();

const questions = [
  {
    id: 'q1-sum',
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    category: "Math",
    statement: "Write a program that reads two integers and prints their sum.",
    constraints: "The input numbers will be between -1,000,000 and 1,000,000.",
    inputSample: "5 7",
    outputSample: "12",
    hiddenTestCases: JSON.stringify([
      { input: "1 2", output: "3" },
      { input: "-10 10", output: "0" },
      { input: "100 200", output: "300" }
    ])
  },
  {
    id: 'q2-factorial',
    title: "Factorial of a Number",
    difficulty: "Easy",
    category: "Recursion",
    statement: "Write a program to find the factorial of a given non-negative integer.",
    constraints: "The input number will be between 0 and 20.",
    inputSample: "5",
    outputSample: "120",
    hiddenTestCases: JSON.stringify([
        { input: "0", output: "1" },
        { input: "1", output: "1" },
        { input: "10", output: "3628800" }
    ])
  },
  {
    id: 'q3-reverse',
    title: "Reverse a String",
    difficulty: "Easy",
    category: "String",
    statement: "Write a program that takes a string input and outputs it reversed.",
    constraints: "The input string will contain between 1 and 1000 characters.",
    inputSample: "hello",
    outputSample: "olleh",
    hiddenTestCases: JSON.stringify([
        { input: "world", output: "dlrow" },
        { input: "Firebase", output: "esaberiF" },
        { input: "a", output: "a" }
    ])
  }
];

async function seedDatabase() {
    console.log('Seeding database with sample questions...');
    const questionsCollection = db.collection('questions');

    const batch = db.batch();

    questions.forEach(question => {
        // Use the custom ID for the document reference
        const docRef = questionsCollection.doc(question.id);
        batch.set(docRef, question);
    });

    try {
        await batch.commit();
        console.log('✅ Successfully seeded questions collection.');
    } catch (error) {
        console.error('🔥 Error seeding database:', error);
    }
}

seedDatabase();
