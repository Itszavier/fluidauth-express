import { AuthEngine } from "../lib";
import { users } from "../mock";
import { credentialProvider, googleProvider } from "../providers";

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

export default authEngine;
