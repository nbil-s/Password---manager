"use strict";

/********* External Imports ********/
const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");
const { subtle } = require("crypto").webcrypto;
const fs = require("fs");

/********* Constants ********/
const PBKDF2_ITERATIONS = 100000; // Number of iterations for PBKDF2 algorithm
const SALT_LENGTH = 16; // Length of salt in bytes
const AES_KEY_LENGTH = 256; // Key length for AES-GCM

class Keychain {
  constructor(kvs, aesKey, hmacKey, salt) {
    this.kvs = kvs || {}; // Key-Value Store with plaintext website names as keys
    this.aesKey = aesKey; // AES-GCM Key
    this.hmacKey = hmacKey; // HMAC Key
    this.salt = salt; // Salt for key derivation
  }

  // Derive cryptographic keys using PBKDF2
  static async deriveKeys(password, salt) {
    const keyMaterial = await subtle.importKey(
      "raw",
      stringToBuffer(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedBits = await subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      AES_KEY_LENGTH * 2
    );

    const aesKey = await subtle.importKey(
      "raw",
      derivedBits.slice(0, AES_KEY_LENGTH / 8),
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );

    const hmacKey = await subtle.importKey(
      "raw",
      derivedBits.slice(AES_KEY_LENGTH / 8),
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );

    return { aesKey, hmacKey };
  }

  static async init(password) {
    const salt = getRandomBytes(SALT_LENGTH);
    const { aesKey, hmacKey } = await Keychain.deriveKeys(password, salt);
    return new Keychain({}, aesKey, hmacKey, salt);
  }

  static async loadFromFile(password, filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found: Unable to load passwords.");
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsedContent = JSON.parse(fileContent);

    const salt = decodeBuffer(parsedContent.kvs.salt);
    const kvs = parsedContent.kvs.data;
    const trustedDataCheck = parsedContent.kvs.hmac;

    const { aesKey, hmacKey } = await Keychain.deriveKeys(password, salt);

    const keychain = new Keychain(kvs, aesKey, hmacKey, salt);

    const computedChecksum = await keychain.computeChecksum();
    if (computedChecksum !== trustedDataCheck) {
      throw new Error("Checksum validation failed! Data integrity compromised.");
    }

    return keychain;
  }

  async dumpToFile(filePath) {
    const serializedData = {
      kvs: {
        salt: encodeBuffer(this.salt), // Store the salt
        data: this.kvs, // Store plaintext website names and their encrypted passwords
        hmac: await this.computeChecksum(), // Store the HMAC checksum
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(serializedData, null, 2), "utf8");
  }

  async computeChecksum() {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(this.kvs));
    const hashBuffer = await subtle.digest("SHA-256", data);
    return encodeBuffer(hashBuffer);
  }

  async encryptData(data) {
    const iv = getRandomBytes(12);
    const encodedData = stringToBuffer(data);

    const cipherText = await subtle.encrypt(
      { name: "AES-GCM", iv },
      this.aesKey,
      encodedData
    );

    return {
      iv: encodeBuffer(iv),
      cipherText: encodeBuffer(cipherText),
    };
  }

  async decryptData(encrypted) {
    const { iv, cipherText } = encrypted;
    const plainTextBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv: decodeBuffer(iv) },
      this.aesKey,
      decodeBuffer(cipherText)
    );
    return bufferToString(plainTextBuffer);
  }

  async get(name) {
    const encryptedRecord = this.kvs[name];
    if (!encryptedRecord) return null;

    return this.decryptData(encryptedRecord);
  }

  async set(name, value) {
    const encryptedValue = await this.encryptData(value); // Encrypt the password
    this.kvs[name] = encryptedValue; // Store plaintext website name and encrypted password
  }

  async remove(name) {
    if (this.kvs[name]) {
      delete this.kvs[name];
      return true;
    }
    return false;
  }
}

module.exports = { Keychain };
