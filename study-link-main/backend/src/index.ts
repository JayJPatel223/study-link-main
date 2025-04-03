import express from "express";
import "dotenv/config";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth";
import userProfileRoutes from "./routes/userProfile.routes";
import groupRoutes from "./routes/group.routes";
import { uploadRouter } from "./utils/uploadthing";
import { createRouteHandler } from "uploadthing/express";
import discussionRoutes from "./routes/discussion.routes";
import filesRoutes from "./routes/files.routes";
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL!,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:4173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
  })
);

app.use(express.json());

app.use("/profile", userProfileRoutes);
app.use("/groups", groupRoutes);
app.use("/discussions", discussionRoutes);
app.use("/files", filesRoutes);

app.get("/", (req, res) => {
  res.send("Backend is Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
