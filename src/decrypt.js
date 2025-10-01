// decrypt.js

import CryptoJS from "crypto-js";

// ============================ Secret Key ============================ //
// Fetch 64-character hex key (32 bytes) from environment variable (.env)
const SECRET_KEY_HEX = import.meta.env.VITE_ENCRYPTION_SECRET_KEY;

// Convert the hex string into CryptoJS WordArray format
const secretKey = CryptoJS.enc.Hex.parse(SECRET_KEY_HEX);

// ============================ Decryption Function ============================ //

/**
 * Decrypts AES-256-CBC encrypted data from backend (iv:encrypted format)
 * @param {string} encryptedData - The encrypted string in format "iv:encrypted"
 * @returns {Object} - Decrypted JSON object (e.g., { name, email })
 */
export function decrypt(encryptedData) {
  try {
    if (!encryptedData.includes(":")) {
      throw new Error("Invalid format. Expected iv:encryptedData");
    }

    // Split into IV and encrypted text parts
    const [ivHex, encryptedHex] = encryptedData.split(":");

    // Parse hex strings to WordArray for CryptoJS
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);

    // Decrypt using AES-256-CBC with Pkcs7 padding
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      secretKey,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    // Convert decrypted WordArray to UTF-8 string
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) throw new Error("Decryption returned empty result");

    // Parse decrypted JSON string to object and return
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw new Error("Failed to decrypt data. Possibly corrupted or invalid.");
  }
}