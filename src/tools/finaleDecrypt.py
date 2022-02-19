import os
import gzip
import argparse
from typing import Union
from binascii import unhexlify
from Crypto.Cipher import AES

def finale_file_decrypt(path: str, key: Union[str, bytes]) -> bytes:
    with open(path, "rb") as f:
        iv = f.read(0x10)
        ciphertext = f.read()

    return finale_decrypt(key=key, iv=iv, ciphertext=ciphertext)

def finale_decrypt(
    key: Union[str, bytes],
    iv: bytes,
    ciphertext: bytes,
) -> bytes:
    if not isinstance(key, bytes):
        key = int(key.replace(" ", ""), 0).to_bytes(0x10, "big")
    if len(key) != 0x10:
        raise ValueError("Invalid key length")

    cipher = AES.new(key, AES.MODE_CBC, iv)
    gzipdata = cipher.decrypt(ciphertext)

    num_padding = gzipdata[-1]
    # Remove padding if there is
    if num_padding > 0:
        gzipdata = gzipdata[:-num_padding]

    # Prefix gzip magic number if it doesn't already
    # gzip.decompress will fail if there's no gzip magic number
    if gzipdata[:2] != b"\x1f\x8b":
        gzipdata = b"\x1f\x8b" + gzipdata

    return gzip.decompress(gzipdata)[0x10:]

def main():
    parser = argparse.ArgumentParser(description="FiNALE Decryptor")
    parser.add_argument("key", type=str)
    parser.add_argument("input", type=str)
    parser.add_argument("output", type=str)

    args = parser.parse_args()
    
    res = finale_file_decrypt(args.input, args.key)
    f = open(args.output, 'wb+')
    f.write(res)
    f.close()


if __name__ == "__main__":
    main()
