/** @format */
import { CredentialProvider } from "./lib/providers/credential";
import { GoogleProvider } from "./lib/providers/google";
import { users } from "./mock";
import dotenv from "dotenv";

dotenv.config();

export const credentialProvider = new CredentialProvider({
  async verify(email, password, done) {
    const user = users.find(
      (userData) => userData.email === email && userData.password === password
    );

    if (!user) {
      //done(null, false, { message: "User not found" });
    }

    done(null, user);
  },
});

export const googleProvider = new GoogleProvider({
  client_id: process.env.CLIENT_ID as string,
  client_secret: process.env.CLIENT_SECRET as string,
  redirect_uri: "http://localhost:3000/redirect/google",
  scopes: ["openid", "profile", "email"],

  async verify(data, profile, done) {
    done(null, { id: 12, email: profile.email, name: profile?.name });
  },
});
