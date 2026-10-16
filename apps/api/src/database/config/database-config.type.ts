export type DatabaseConfig = {
  type: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  name: string;
  synchronize: boolean;
  maxConnections: number;
  sslEnabled: boolean;
  rejectUnauthorized: boolean;
  ca?: string;
  key?: string;
  cert?: string;
};
