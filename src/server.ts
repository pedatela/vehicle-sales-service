import "dotenv/config";
import express from "express";
import { requestLogger } from "./app/http/middlewares/request-logger";
import routes from "./app/http/routes";
import { logger } from "./app/logger";

const appName = "Vehicle Sales Service";
const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());
app.use(requestLogger);

app.get("/api", (_req, res) => {
  res.json({
    app: appName,
    message: "Sales API em execução",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    app: appName,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);

app.listen(port, () => {
  logger.info(`${appName} ouvindo`, { port });
});
