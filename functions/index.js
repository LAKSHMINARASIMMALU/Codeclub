const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// It's highly recommended to set these via `firebase functions:config:set`
// See setup instructions after code generation.
const JUDGE0_API_KEY = functions.config().judge0?.key || process.env.JUDGE0_API_KEY;
const JUDGE0_HOST = functions.config().judge0?.host || process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com";
const JUDGE0_URL = `https://${JUDGE0_HOST}/submissions?base64_encoded=false&wait=true`;


exports.evaluateCode = functions.https.onRequest(async (req, res) => {
    // Allow CORS for requests from your web app
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const {
        languageId,
        sourceCode,
        input,
        userId,
        contestId,
        questionId,
        questionTitle
    } = req.body;

    if (!languageId || !sourceCode) {
        return res.status(400).json({ error: "languageId and sourceCode are required." });
    }
     if (!JUDGE0_API_KEY) {
        console.error("Judge0 API key is not configured.");
        return res.status(500).json({ error: "Server configuration error: Missing API key." });
    }

    try {
        const judgeResponse = await axios.post(
            JUDGE0_URL,
            {
                source_code: sourceCode,
                language_id: languageId,
                stdin: input,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-RapidAPI-Key": JUDGE0_API_KEY,
                    "X-RapidAPI-Host": JUDGE0_HOST,
                },
            }
        );

        const result = judgeResponse.data;
        const output = result.stdout || result.stderr || result.compile_output || null;

        // Optionally, save to Firestore if user is authenticated
        if (userId && contestId && questionId) {
            const submission = {
                userId,
                contestId,
                questionId,
                questionTitle,
                code: sourceCode,
                languageId,
                status: result.status.description,
                output,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection("submissions").add(submission);
        }

        return res.status(200).json({ result });

    } catch (err) {
        console.error("Error calling Judge0 or saving to Firestore:", err);
        
        let errorDetails = "An unknown error occurred.";
        if (axios.isAxiosError(err)) {
          if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Judge0 Error Data:", err.response.data);
            console.error("Judge0 Error Status:", err.response.status);
            errorDetails = `Judge0 API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`;
          } else if (err.request) {
            // The request was made but no response was received
            console.error("Judge0 No Response:", err.request);
            errorDetails = "No response from Judge0 API. Please check network connectivity.";
          } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Axios Setup Error:', err.message);
            errorDetails = `Error setting up request: ${err.message}`;
          }
        } else if (err instanceof Error) {
            errorDetails = err.message;
        }

        return res.status(500).json({
            error: "Code evaluation failed.",
            details: errorDetails,
        });
    }
});
