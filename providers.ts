/** @format */
import { CredentialProvider } from "./lib/providers/credential";
import { GoogleProvider } from "./lib/providers/google";
import { users } from "./mock";
import dotenv from "dotenv";

dotenv.config();

export const credentialProvider = new CredentialProvider({
  async verify(email, password) {
    
    const user = users.find(
      (userData) => userData.email === email && userData.password === password
    );

    if (!user) {
      return { user: null, info: { message: "user not found" } };
    }

    return { user };
  },
});

export const googleProvider = new GoogleProvider({
  client_id: process.env.CLIENT_ID as string,
  client_secret: process.env.CLIENT_SECRET as string,
  redirect_uri: "https://dfkpzk-3000.csb.app/redirect/google",

  async verify(data, profile) {
    const userExist = users.find((user) => user.email === profile.email);

    if (userExist) {
      return { user: userExist };
    }

    const user = {
      id: (Math.floor(Math.random() * (100 - 20 + 1)) + 20).toString(),
      email: profile.email,
      name: profile.name,
      password: "ewfrefrfrefgervgerg",
    };

    users.push(user);

    return { user };
  },
});
