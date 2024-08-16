/** @format */
import { CredentialProvider } from "./lib/providers/credential";
import { GoogleProvider } from "./lib/providers/google";
import { users } from "./mock";

export const credentialProvider = new CredentialProvider({
  async verify(email, password, done) {
    const user = users.find(
      (userData) => userData.email === email && userData.password === password
    );

    if (!user) {
      done(null, false, { message: "User not found" });
    }

    done(null, user);
  },
});

export const googleProvider = new GoogleProvider();
