/** @format */

import { AuthService, Session, MemoryStore } from "../../lib";
import { users } from "../mock";
import { GoogleProvider, CredentialProvider } from "../../lib/providers";
import dotenv from "dotenv";
import { GithubProvider } from "../../lib/providers/github";
import Github from "../providers/Github";
import Credential from "../providers/credential";
import Google from "../providers/google";

dotenv.config();

const authService = new AuthService({
  redirect: {
    onLoginSuccess: "/dashboard",
    onLoginFailure: "/error",
  },
  providers: [Github, Credential, Google],

  session: new Session({
    secret: "efwfrfergfrgetgvetgtrgtrgrt",
    store: new MemoryStore(),
    cookie: { httpOnly: true },
  }),
});

authService.serializeUser(function (user) {
  return user.id;
});

authService.deserializeUser(async function (id) {
  const user = users.find((user) => user.id === id) || null;
  if (!user) console.log("[deserializeUser]: user not found");
  return user;
});

export default authService;
