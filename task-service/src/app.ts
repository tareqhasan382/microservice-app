import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";

import healthRoutes from "./routes/health.routes";
import taskRoutes from "./routes/task.routes";
import notFound from "./middlewares/notFound";
import errorHandler from "./middlewares/errorHandler";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api/health", healthRoutes);
app.use("/api/tasks", taskRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
