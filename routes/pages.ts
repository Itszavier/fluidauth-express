/** @format */

import { Router } from "express";
import path from "path";
//import session from "../dist/core/session";

const router = Router();

router.get("/", function (req, res) {
  res.render("index", { user: req.user || {}, session: JSON.stringify(req.session) });
});

router.get("/error", function (req, res) {
  res.render("error", { error: req.query.message });
});

router.get("/dashboard", function (req, res) {
  res.render("dashboard", {
    user: req.user || {},
    session: JSON.stringify(req.session),
  });
});

router.post("/logout", async (req, res) => {
  await req.logout();
  res.render("logout", { user: req.user || {}, session: JSON.stringify(req.session) });
});

export default router;
