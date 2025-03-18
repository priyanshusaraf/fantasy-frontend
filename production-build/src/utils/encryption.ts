import crypto from "crypto";

export class Encryption {
  private static algorithm = "aes-256-cbc";
  private static key = crypto.randomBytes(32);
  private static iv = crypto.randomBytes(16);

  static encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  static decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Generate a secure random token
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  // Hash function for passwords
  static hashPassword(
    password: string,
    salt?: string
  ): { hash: string; salt: string } {
    salt = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");
    return { hash, salt };
  }

  // Verify password
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const computedHash = this.hashPassword(password, salt).hash;
    return computedHash === hash;
  }
}
