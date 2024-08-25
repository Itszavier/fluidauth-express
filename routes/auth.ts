/** @format */

import { NextFunction, Router } from "express";
import authEngine from "../config/authEngine";
import { users } from "../mock";
const router = Router();

router.post("/login", authEngine.authenticate("credential"), function (req, res) {
  res.status(200).redirect("/dashboard");
});

router.use(function (req, res, next) {
  console.log(req.session, "api auth router");
  next();
});

router.get("/session", function (req, res, next) {
  res.status(200).json({ session: req.session || null, user: req.user || null });
});

router.get("/login/google", authEngine.authenticate("google"), function (req, res, next) {
  if (req.user) {
    console.log("user detected");
  }

  res.status(200).redirect("/dashboard");
});

router.get("/redirect/google", authEngine.handleCallback("google"));

export default router;
