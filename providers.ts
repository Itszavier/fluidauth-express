/** @format */
import { CredentialProvider } from "./lib/providers/credential";
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
