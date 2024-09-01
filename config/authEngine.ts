/** @format */

import { AuthService, Session, MemoryStore } from "../lib";
import { users } from "../mock";
import { GoogleProvider, CredentialProvider } from "../lib/providers";
import { credentialProvider } from "../providers";
import dotenv from "dotenv";

dotenv.config();

const session = new Session({
  secret: "efwfrfergfrgetgvetgtrgtrgrt",
  store: new MemoryStore(),
  cookie: { httpOnly: true },
});



const authService = new AuthService({
  redirect: {
    onLoginSuccess: "/dashboard",
  },

  providers: [
    new GoogleProvider({
      credentials: {
        redirectUri: "http://localhost:3000/redirect/google",
        clientId: process.env.CLIENT_ID as string,
        clientSecret: process.env.CLIENT_SECRET as string,
      },

      async verifyUser(GoogleAuthData, Profile) {
        const user = users.find((dbUser) => dbUser.email === Profile.email);

        if (user) {
          return { user };
        }

        // Generate a random ID
        const randomId = (Math.floor(Math.random() * (100 - 20 + 1)) + 20).toString();

        // Create a new user
        const newUser = {
          id: randomId,
          email: Profile.email,
          name: Profile.name,
          password: "hashed_password", // Replace with hashed password
        };

        // Add the new user to the users array
        users.push(newUser);

        return { user: newUser };
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
  session,
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
