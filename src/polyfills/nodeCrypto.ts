import { Buffer } from 'buffer';

type SupportedEncoding = 'hex' | 'base64' | 'latin1' | 'binary' | undefined;

const globalScope = globalThis as Record<string, unknown>;

if (typeof globalScope.Buffer === 'undefined') {
  globalScope.Buffer = Buffer;
}

function toBytes(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }

  if (typeof data === 'string') {
    return utf8ToBytes(data);
  }

  if (typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }

  throw new TypeError('Unsupported data type for crypto operation');
}

function encode(bytes: Uint8Array, encoding: SupportedEncoding) {
  const buffer = Buffer.from(bytes);

  if (!encoding) {
    return buffer;
  }

  if (encoding === 'binary') {
    return buffer.toString('latin1');
  }

  if (encoding === 'hex' || encoding === 'base64' || encoding === 'latin1') {
    return buffer.toString(encoding);
  }

  throw new Error(`Unsupported encoding: ${encoding}`);
}

class Hash {
  private readonly chunks: Uint8Array[] = [];

  update(data: unknown) {
    this.chunks.push(toBytes(data));
    return this;
  }

  digest(encoding?: SupportedEncoding) {
    const message =
      this.chunks.length === 0
        ? new Uint8Array(0)
        : this.chunks.length === 1
        ? this.chunks[0]
        : concatenate(this.chunks);

    const digestBytes = sha256(message);
    return encode(digestBytes, encoding);
  }
}

class Hmac {
  private readonly chunks: Uint8Array[] = [];

  constructor(private readonly key: Uint8Array) {}

  update(data: unknown) {
    this.chunks.push(toBytes(data));
    return this;
  }

  digest(encoding?: SupportedEncoding) {
    const message =
      this.chunks.length === 0
        ? new Uint8Array(0)
        : this.chunks.length === 1
        ? this.chunks[0]
        : concatenate(this.chunks);

    const digestBytes = hmacSha256(this.key, message);
    return encode(digestBytes, encoding);
  }
}

function assertSha256(algorithm: string) {
  if (algorithm.toLowerCase() !== 'sha256') {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

export function createHash(algorithm: string) {
  assertSha256(algorithm);
  return new Hash();
}

export function createHmac(algorithm: string, key: unknown) {
  assertSha256(algorithm);
  return new Hmac(toBytes(key));
}

export default {
  createHash,
  createHmac,
};

function utf8ToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function concatenate(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 0) {
    return new Uint8Array(0);
  }

  if (chunks.length === 1) {
    return chunks[0];
  }

  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function rightRotate(value: number, amount: number) {
  return ((value >>> amount) | (value << (32 - amount))) >>> 0;
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const SHA256_INITIAL = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

function sha256(message: Uint8Array): Uint8Array {
  const padded = padMessage(message);
  const state = new Uint32Array(SHA256_INITIAL);
  const words = new Uint32Array(64);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      const index = offset + i * 4;
      words[i] =
        (padded[index] << 24) |
        (padded[index + 1] << 16) |
        (padded[index + 2] << 8) |
        padded[index + 3];
    }

    for (let i = 16; i < 64; i += 1) {
      const s0 = rightRotate(words[i - 15], 7) ^ rightRotate(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rightRotate(words[i - 2], 17) ^ rightRotate(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let h = state[7];

    for (let i = 0; i < 64; i += 1) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + words[i]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    state[0] = (state[0] + a) >>> 0;
    state[1] = (state[1] + b) >>> 0;
    state[2] = (state[2] + c) >>> 0;
    state[3] = (state[3] + d) >>> 0;
    state[4] = (state[4] + e) >>> 0;
    state[5] = (state[5] + f) >>> 0;
    state[6] = (state[6] + g) >>> 0;
    state[7] = (state[7] + h) >>> 0;
  }

  const output = new Uint8Array(32);
  for (let i = 0; i < 8; i += 1) {
    output[i * 4] = (state[i] >>> 24) & 0xff;
    output[i * 4 + 1] = (state[i] >>> 16) & 0xff;
    output[i * 4 + 2] = (state[i] >>> 8) & 0xff;
    output[i * 4 + 3] = state[i] & 0xff;
  }

  return output;
}

function padMessage(message: Uint8Array): Uint8Array {
  const messageLength = message.length;
  const bitLength = messageLength * 8;
  const withOne = messageLength + 1;
  const totalLength = Math.ceil((withOne + 8) / 64) * 64;
  const padded = new Uint8Array(totalLength);
  padded.set(message);
  padded[messageLength] = 0x80;

  for (let i = 0; i < 8; i += 1) {
    padded[padded.length - 1 - i] = (bitLength >>> (i * 8)) & 0xff;
  }

  return padded;
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let normalizedKey = key;

  if (normalizedKey.length > blockSize) {
    normalizedKey = sha256(normalizedKey);
  }

  if (normalizedKey.length < blockSize) {
    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(normalizedKey);
    normalizedKey = paddedKey;
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i += 1) {
    const byte = normalizedKey[i];
    oKeyPad[i] = byte ^ 0x5c;
    iKeyPad[i] = byte ^ 0x36;
  }

  const innerMessage = new Uint8Array(blockSize + message.length);
  innerMessage.set(iKeyPad);
  innerMessage.set(message, blockSize);
  const innerHash = sha256(innerMessage);

  const outerMessage = new Uint8Array(blockSize + innerHash.length);
  outerMessage.set(oKeyPad);
  outerMessage.set(innerHash, blockSize);

  return sha256(outerMessage);
}
