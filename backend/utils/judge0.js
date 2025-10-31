// utils/judge0.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE = process.env.JUDGE0_BASE_URL || "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

const defaultHeaders = () => {
  if (RAPIDAPI_KEY && RAPIDAPI_HOST) {
    return {
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
      "Content-Type": "application/json"
    };
  } else {
    return { "Content-Type": "application/json" };
  }
};

/**
 * submitCode - send code to Judge0 for execution
 * @param {Object} opts
 *   - source_code {string}
 *   - stdin {string}
 *   - language_id {number} (Judge0 language id)
 * @returns {Object} { stdout, stderr, status, compile_output? }
 */
export async function submitCode({ source_code, stdin = "", language_id }) {
  const url = `${BASE}/submissions?base64_encoded=false&wait=true`;

  const payload = {
    source_code,
    stdin,
    language_id
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: defaultHeaders()
    });
    return resp.data;
  } catch (err) {
    // If RapidAPI returns an error, include details
    if (err.response) {
      throw new Error(`Judge0 error: ${err.response.status} ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}
