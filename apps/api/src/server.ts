import express from "express";
import dotenv from "dotenv";
import healthRoutes from "../src/modules/health/health.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Hire Flow API"
  });
});

app.use("/api/v1/health", healthRoutes);

app.listen(PORT, () => {
  console.log(`Hire Flow API running at http://localhost:${PORT}`);
});
