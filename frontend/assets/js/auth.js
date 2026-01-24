// ==========================================
// Constants and Imports
// ==========================================
import {bufferToBase64, base64ToBuffer, generateKeyPair, initDeviceID, savePrivateKey, importPrivateKey} from './helper.js';

// LocalStorage Keys
const STORAGE_KEYS = {
    PRIVATE_KEY: 'gdrop_private_key',
    PUBLIC_KEY: 'gdrop_public_key',
    DEVICE_ID: 'gdrop_device_id'
};

// ==========================================
// DYNAMIC API CONFIGURATION
// ==========================================

// 1. Cek apakah kita sedang di Localhost?
const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. URL NGROK STATIC (Update ke domain paten mas)
const PROD_API_URL = 'https://ahmad-heliochromic-astoundedly.ngrok-free.dev/api/v1';
const LOCAL_API_URL = 'http://localhost:8080/api/v1';

// 3. Pilih URL otomatis
const API_BASE = IS_LOCALHOST ? LOCAL_API_URL : PROD_API_URL;

const ENDPOINTS = {
    REGISTER: `${API_BASE}/register`,
    CHALLENGE: `${API_BASE}/challenge`,
    LOGIN: `${API_BASE}/login`
};

// ==========================================
// Authentication Functions
// ==========================================
async function signChallenge(challengeBase64, privateKey) {
    const challengeBytes = base64ToBuffer(challengeBase64);
    const signature = await window.crypto.subtle.sign(
        { name: "Ed25519" },
        privateKey,
        challengeBytes
    );
    return bufferToBase64(signature);
}

function getPrivateKey() {
    return localStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
}

function getPublicKey() {
    return localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
}

function getDeviceName() {
    return localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
}

function isRegistered() {
    const hasPrivateKey = getPrivateKey();
    const hasDeviceID = getDeviceName();
    return hasPrivateKey && hasDeviceID;
}

// ==========================================
// Creating initAuth Function
// ==========================================
export async function initAuth() {
    try {
        // [DEBUG LOGIC] Cek apakah Browser HP memblokir Crypto
        // Comment this block if not needed
        // if (!window.crypto || !window.crypto.subtle) {
        //     alert("FATAL ERROR: Fitur Crypto diblokir Browser!\n\nSolusi: Buka chrome://flags, cari 'insecure origin', set Enabled untuk IP laptop ini.");
        //     return null;
        // }

        let privateKey = getPrivateKey();
        let deviceID = getDeviceName();

        // Kalau belum ada kunci, generate dan registrasi
        if (!privateKey || !deviceID) {

            const generatedKeyPair = await generateKeyPair();

            await savePrivateKey(generatedKeyPair);

            const publicKeyBuffer = await window.crypto.subtle.exportKey('raw', generatedKeyPair.publicKey);
            const publicKeyBase64 = bufferToBase64(publicKeyBuffer);
            localStorage.setItem("gopherdrop-theme", "light"); // Set default theme
            localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, publicKeyBase64);

            await initDeviceID();

            // === [UPDATE] Register dengan Header Ngrok ===
            const response = await fetch(ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // <--- PENTING
                },
                body: JSON.stringify({
                    username: getDeviceName(),
                    public_key: publicKeyBase64
                })
            });

            if (!response.ok) throw new Error('Registration failed');

            // Attempt login after successful registration
            return await initAuth();

        } else {
            // Login Flow
            const publicKey = getPublicKey();
            const privateKeyVal = getPrivateKey();

            if (!publicKey || !privateKeyVal) {
                return { success: false, error: 'No stored credentials' };
            }

            // 1. Get Challenge from server
            // === [UPDATE] Challenge dengan Header Ngrok ===
            const challengeRes = await fetch(ENDPOINTS.CHALLENGE, {
                headers: {
                    'ngrok-skip-browser-warning': 'true' // <--- PENTING
                }
            });

            if (!challengeRes.ok) throw new Error('Gagal konek ke Laptop (Challenge)');

            const challengeData = await challengeRes.json();
            const challengeBase64 = challengeData.data;

            // 2. Sign the challenge
            const importedKey = await importPrivateKey();
            const signature = await signChallenge(challengeBase64, importedKey);

            // 3. Send login request
            // === [UPDATE] Login dengan Header Ngrok ===
            const loginRes = await fetch(ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // <--- PENTING
                },
                body: JSON.stringify({
                    public_key: publicKey,
                    challenge: challengeBase64,
                    signature: signature
                })
            });

            const loginData = await loginRes.json();

            if (loginRes.ok && loginData.success && loginData.data) {
                localStorage.setItem('gdrop_token', loginData.data);
                return loginData.data;
            } else {
                // If the server doesn't recognize us (DB reset?), clear creds and re-register
                if (loginData.message === "User not found") {
                    localStorage.clear()
                    return await initAuth();
                }
                if (loginData.message === "Authentication failed") {
                    localStorage.clear()
                    return await initAuth();
                }
                throw new Error(loginData.message || "Login failed");
            }
        }
    } catch (error) {
        alert("System Error: " + error.message);
        return { success: false, error: error.message };
    }
};