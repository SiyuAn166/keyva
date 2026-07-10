export type ItemType = "credential" | "apikey";

export interface SecurityQuestion {
  question: string;
  answer: string;
}

interface BaseItem {
  id: string;
  type: ItemType;
  name: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Credential extends BaseItem {
  type: "credential";
  username: string;
  password: string;
  securityQuestions: SecurityQuestion[];
}

export interface ApiKey extends BaseItem {
  type: "apikey";
  provider?: string;
  keyId?: string;
  secret: string;
  environment?: string;
  expiresAt?: number;
}

export type Item = Credential | ApiKey;
