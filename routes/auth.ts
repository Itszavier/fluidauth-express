/** @format */

import { NextFunction, Router } from "express";
import authEngine from "../config/authEngine";
import { users } from "../mock";
const router = Router();

router.post("/login", authEngine.authenticate("credential"), function (req, res, next) {
  res.status(200).json({
    message: "successfully logged in",
    user: req.user || null,
    session: req.session || null,
  });
});

router.use(function (req, res, next) {
  console.log(req.session, "api auth router");
  next();
});

router.get("/session", function (req, res, next) {
  res.status(200).json({ session: req.session || null, user: req.user || null });
});

router.get("/logout", async function (req, res, next) {
 
});

router.get("/login/google", authEngine.authenticate("google"));

router.get("/redirect/google", authEngine.handleCallback("google"));

export default router;
