import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import FluidAuth from "./lib";
import { credentialProvider } from "./providers";

const app = express();

const fluidAuth = new FluidAuth({
  providers: [credentialProvider],
  session: {
    secret: "eefefregfeger",
  },
});

const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, "public")));

/// fluidAuth middleware testing

app.use(fluidAuth.session());

app.get("/", function (req, res, next) {
  res.sendFile(path.resolve(__dirname, "pages", "index.html"));
});

app.get("/dashboard", function (req, res, next) {
  res.sendFile(path.resolve(__dirname, "pages", "dashboard.html"));
});

// Post requests

app.post(
  "/login",
  fluidAuth.authenticate("credential"),
  function (req, res, next) {
    res.status(200).json({
      message: "successfully logged in",
      user: req.user || null,
      session: req.session || null,
    });
  }
);

app.listen(PORT, () => console.log("Alive on http://localhost:3000"));
