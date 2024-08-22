/** @format */

import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { credentialProvider, googleProvider } from "./providers";
import { users } from "./mock";
import { AuthEngine, } from "./lib";

const app = express();

const PORT = process.env.PORT || 3000;

const authEngine = new AuthEngine({
  providers: [credentialProvider, googleProvider],
  session: {
    secret: "eefefregfeger",
  },
});

authEngine.serializeUser(function (user) {
  return user.id;
});

authEngine.deserializeUser(function (id) {
  const user = users.find((user) => user.id === id) || null;
  if (!user) console.log("[deserializeUser]: user not found");
  return user;
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authEngine.session());

app.use((req, res, next) => {
  console.log("Request Body:", req.body);
  next();
});

app.use(express.static(path.resolve(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages", "dashboard.html"));
});

app.get("/session", function (req, res, next) {
  res.json({
    message: "session page",
    session: req.session || null,
    user: req.user || null,
  });
});

// Post requests
app.post("/login", authEngine.authenticate("credential"), (req, res) => {
  res.status(200).json({
    message: "successfully logged in",
    user: req.user || null,
    session: req.session || null,
  });
});

app.get("/login/google", authEngine.authenticate("google"));

app.get("/redirect/google", authEngine.handleCallback("google"));

app.listen(PORT, () => console.log(`Alive on http://localhost:${PORT}`));
