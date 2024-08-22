import { Router } from "express";
import path from "path";
const router = Router();

router.get("/", function (req, res, next) {
  res.sendFile(path.resolve("pages/index.html"));
});

router.get("/dashboard", function (req, res, next) {
  res.sendFile(path.resolve("pages/dashboard.html"));
});

export default router;
