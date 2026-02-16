import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { router as auth } from "./controllers/auth.js";
import { router as profiles } from "./controllers/profile.js";
import { router as swipes } from "./controllers/swipe.js";
import { router as dateSuggestions } from "./controllers/date-suggestions.js";

import { authMiddleware } from "./middleware.js";

const PORT = parseInt(process.env.PORT ?? "3000");

const app = express();
/* ============= MIDDLEWARES ============ */
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    exposedHeaders: ["Authorization"],
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' }));
app.use(express.static("./static/"));
app.use(authMiddleware);
/* ======================================= */

/* =============== ROUTERS =============== */
app.use("/auth", auth);
app.use("/profiles", profiles);
app.use("/swipes", swipes);
app.use("/date-suggestions", dateSuggestions);
/* ======================================= */

/* System health check */
app.get("/", async (_, res) => {
  res.json({ message: "Hello, World!" });
});

app.listen(PORT, (error) => {
  if (!!error) {
    console.error(`Unexpected error occurred: ${error}`);
  } else {
    console.log(`Server started at: http://localhost:${PORT}`);
  }
});
