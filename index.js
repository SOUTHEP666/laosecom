import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import pointRoutes from "./routes/point.js";
import roleRoutes from "./routes/role.js";
import merchantRoutes from './routes/merchant.js';




dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/points", pointRoutes);
app.use("/api/roles", roleRoutes);
app.use('/api/merchants', merchantRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
