import { secretbox, randomBytes } from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

const KEY_LENGTH = secretbox.keyLength;
const NONCE_LENGTH = secretbox.nonceLength;

export function generateKey(): string {
  return encodeBase64(randomBytes(KEY_LENGTH));
}

export function generateNonce(): Uint8Array {
  return randomBytes(NONCE_LENGTH);
}

export function encrypt(text: string, key: string): { encrypted: string; nonce: string } {
  const keyUint8Array = decodeBase64(key);
  const nonce = generateNonce();
  const messageUint8 = decodeUTF8(text);
  const box = secretbox(messageUint8, nonce, keyUint8Array);

  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);

  return {
    encrypted: encodeBase64(box),
    nonce: encodeBase64(nonce)
  };
}

export function decrypt(encryptedBase64: string, nonceBase64: string, keyBase64: string): string {
  const keyUint8Array = decodeBase64(keyBase64);
  const nonce = decodeBase64(nonceBase64);
  const box = decodeBase64(encryptedBase64);
  
  const decrypted = secretbox.open(box, nonce, keyUint8Array);
  
  if (!decrypted) {
    throw new Error('Failed to decrypt message');
  }
  
  return encodeUTF8(decrypted);
}
