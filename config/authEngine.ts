/** @format */

import { AuthService } from "../lib";
import { users } from "../mock";
import { GoogleProvider, CredentialProvider } from "../lib/providers";
import { credentialProvider } from "../providers";
import dotenv from "dotenv";

dotenv.config();
const authService = new AuthService({
  providers: [
    new GoogleProvider({
      credentials: {
        redirectUri: "http://localhost:3000/redirect/google",
        clientId: process.env.CLIENT_ID as string,
        clientSecret: process.env.CLIENT_SECRET as string,
      },

      async verifyUser(GoogleAuthData, Profile) {
        const user = users.find((dbUser) => dbUser.email === Profile.email);

        if (user) return { user };

        const randomId = (Math.floor(Math.random() * (100 - 20 + 1)) + 20).toString();

        users.push({
          id: randomId,
          email: Profile.email,
          name: Profile.name,
          password: "deferferfreffer",
        });

        // gets the last element which is the new user that was added to the end
        const createdUser = users.pop();

        return { user: createdUser };
      },
    }),

    new CredentialProvider({
      async verifyUser(email, password) {
        const user = users.find((dbUser) => dbUser.email === email);
        if (user) return { user };

        return { user: null, info: { message: "email or password incorrect" } };
      },
    }),
  ],
  session: { secret: "ferferfre" },
});

authService.serializeUser(function (user) {
  return user.id;
});

authService.deserializeUser(function (id) {
  const user = users.find((user) => user.id === id) || null;
  if (!user) console.log("[deserializeUser]: user not found");
  return user;
});

export default authService;
