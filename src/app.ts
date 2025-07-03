import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connect } from "./config/db";

import { log } from "./utils/logger.utils";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

connect()
  .then(() => {
    app.listen(PORT, () => {
      log("info", `Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    log("error", "Failed to connect to DB", err);
    process.exit(1);
  });
