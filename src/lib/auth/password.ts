import { hash, verify, type Options } from "@node-rs/argon2";

const options: Options = {
  algorithm: 2,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
};

export function hashPassword(password: string) {
  return hash(password, options);
}

export function verifyPassword({ hash: passwordHash, password }: { hash: string; password: string }) {
  return verify(passwordHash, password, options);
}
