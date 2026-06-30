import * as dotenv from 'dotenv';

dotenv.config();

export class ENV {
  static readonly IS_PROD: boolean = process.env.PROD == 'true';
  static readonly NODE_ENV: string = process.env.NODE_ENV || 'local';
  static readonly LANGUAGE: string = process.env.LANGUAGE || 'en';
  static readonly PORT_GATEWAY: number = Number(process.env.PORT_GATEWAY);
  static readonly PORT_READER: number = Number(process.env.PORT_READER);
  static readonly QDRANT_API_KEY: string = process.env.QDRANT_API_KEY || '';
  static readonly QDRANT_HOST: string = process.env.QDRANT_HOST || '';
}
