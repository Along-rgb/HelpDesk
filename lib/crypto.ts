/**
 * URL-safe AES encryption for ticket detail route IDs.
 *
 * - Client: encryptId() uses NEXT_PUBLIC_TICKET_ID_SECRET (visible in bundle).
 * - Client: decryptId() uses same key for reading URL (optional; can move to server).
 * - Server: decryptIdServer() uses TICKET_ID_SECRET (server-only; never in client).
 *   Use in API routes so the secret is never exposed. Same key value as NEXT_PUBLIC_*.
 */
import CryptoJS from "crypto-js";

function getSecretKey(): string {
    // Next.js client bundle will inline NEXT_PUBLIC_* only when referenced directly.
    const key = process.env.NEXT_PUBLIC_TICKET_ID_SECRET;
    if (!key || typeof key !== "string" || key.trim() === "") {
        throw new Error("Ticket ID encryption key is not set. Set NEXT_PUBLIC_TICKET_ID_SECRET in .env.local");
    }
    return key.trim();
}

function getServerSecretKey(): string | null {
    const key = process.env.TICKET_ID_SECRET;
    if (!key || typeof key !== "string" || key.trim() === "") return null;
    return key.trim();
}

/**
 * Encrypts a ticket ID for use in URLs.
 * Returns a URL-safe string (encodeURIComponent applied).
 */
export function encryptId(id: string | number): string {
    const key = getSecretKey();
    const plain = String(id);
    const encrypted = CryptoJS.AES.encrypt(plain, key).toString();
    return encodeURIComponent(encrypted);
}

/**
 * Decrypts a ticket ID from a URL segment (client-side).
 * Returns the original ID string, or null if decryption fails or input is invalid.
 */
export function decryptId(encodedHash: string | undefined | null): string | null {
    return decryptWithKey(encodedHash, getSecretKey());
}

/**
 * Decrypts a ticket ID on the server using TICKET_ID_SECRET (API routes only).
 * Secret is never sent to the client. Returns null if key is not set or decryption fails.
 */
export function decryptIdServer(encodedHash: string | undefined | null): string | null {
    const key = getServerSecretKey();
    if (!key) return null;
    return decryptWithKey(encodedHash, key);
}

function decryptWithKey(
    encodedHash: string | undefined | null,
    key: string
): string | null {
    if (encodedHash == null || typeof encodedHash !== "string" || encodedHash.trim() === "") {
        return null;
    }
    try {
        const decoded = decodeURIComponent(encodedHash.trim());
        const bytes = CryptoJS.AES.decrypt(decoded, key);
        const plain = bytes.toString(CryptoJS.enc.Utf8);
        if (!plain) return null;
        return plain;
    } catch {
        return null;
    }
}
