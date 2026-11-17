/**
 * Secure Data Protection Utility (AES-256-GCM Cryptography)
 * Replaces insecure XOR/Base64 pseudo-encryption with Web Crypto API standards.
 */

export interface EncryptedDataPayload {
  ciphertext: string; // Base64 encoded ciphertext
  iv: string;         // Base64 encoded 12-byte initialization vector
  algorithm: string;  // AES-GCM
}

export class SecureStorageUtils {
  private static readonly ALGORITHM_NAME = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_BYTE_LENGTH = 12;

  /**
   * Generates a 256-bit CryptoKey using Web Crypto API or derives from secret passphrase
   */
  private static async deriveKey(passphrase = 'KurdishAI-Studio-SecureKey-2026'): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);

    return await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: this.ALGORITHM_NAME, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext string using AES-256-GCM with a fresh 12-byte random IV
   */
  public static async encrypt(plainText: string, customSecret?: string): Promise<EncryptedDataPayload> {
    if (!plainText) {
      throw new Error('Plaintext string is required for encryption');
    }

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(plainText);
    const ivBytes = crypto.getRandomValues(new Uint8Array(this.IV_BYTE_LENGTH));

    const key = await this.deriveKey(customSecret);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: this.ALGORITHM_NAME, iv: ivBytes as unknown as BufferSource },
      key,
      dataBytes
    );

    const ciphertext = this.arrayBufferToBase64(encryptedBuffer);
    const iv = this.uint8ArrayToBase64(ivBytes);

    return {
      ciphertext,
      iv,
      algorithm: 'AES-256-GCM'
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext payload
   */
  public static async decrypt(payload: EncryptedDataPayload, customSecret?: string): Promise<string> {
    if (!payload || !payload.ciphertext || !payload.iv) {
      throw new Error('Invalid encrypted payload provided for decryption');
    }

    if (payload.algorithm && payload.algorithm !== 'AES-256-GCM') {
      throw new Error(`Unsupported encryption algorithm: ${payload.algorithm}`);
    }

    const encryptedBuffer = this.base64ToArrayBuffer(payload.ciphertext);
    const ivBytes = this.base64ToUint8Array(payload.iv);

    const key = await this.deriveKey(customSecret);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: this.ALGORITHM_NAME, iv: ivBytes as unknown as BufferSource },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Encrypts and persists a JSON-serializable item to localStorage
   */
  public static async saveSecureItem(key: string, data: unknown, customSecret?: string): Promise<void> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const jsonStr = JSON.stringify(data);
      const encrypted = await this.encrypt(jsonStr, customSecret);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch (err) {
      console.warn('SecureStorageUtils: Failed to save encrypted item', err);
    }
  }

  /**
   * Retrieves and decrypts a persisted item from localStorage
   */
  public static async getSecureItem<T>(key: string, customSecret?: string): Promise<T | null> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const payload: EncryptedDataPayload = JSON.parse(raw);
      const decryptedStr = await this.decrypt(payload, customSecret);
      return JSON.parse(decryptedStr) as T;
    } catch (err) {
      console.warn('SecureStorageUtils: Failed to read encrypted item', err);
      return null;
    }
  }

  /**
   * Safely clears an item from localStorage
   */
  public static clearSecureItem(key: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('SecureStorageUtils: Failed to remove item', err);
    }
  }

  // --- Helper Conversion Methods ---
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
