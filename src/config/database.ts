const {
  DATABASE_HOST = "",
  DATABASE_PORT = "5432",
  DATABASE_NAME = "",
  DATABASE_USER = "",
  DATABASE_PASSWORD = "",
  DATABASE_SSL = "false",
} = process.env;

const normalizedSsl = DATABASE_SSL.trim().toLowerCase();
const sslEnabled =
  normalizedSsl === "true" ||
  normalizedSsl === "1" ||
  normalizedSsl === "yes";

export const databaseConfig = {
  enabled: Boolean(
    DATABASE_HOST &&
      DATABASE_PORT &&
      DATABASE_NAME &&
      DATABASE_USER &&
      DATABASE_PASSWORD,
  ),
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  database: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  ssl: sslEnabled,
};
