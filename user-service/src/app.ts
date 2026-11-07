import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
//import compression from 'compression';
import healthRoutes from "./routes/health.routes";
import notFound from "./middlewares/notFound";
import errorHandler from "./middlewares/errorHandler";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
app.use(helmet()); // Security headers
app.use(express.json());
app.use(cookieParser());
// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

//app.use(compression()); 
app.use("/api/health", healthRoutes); // health check
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use(notFound); 
app.use(errorHandler); 

export default app;
