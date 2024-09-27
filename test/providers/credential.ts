/** @format */

import { CredentialProvider } from "../../lib/providers";
import { users } from "../mock";
import dotenv from "dotenv";
dotenv.config();



const Credential = new CredentialProvider({
  async validateUser(email, password) {
    const user = users.find((user) => user.email === email);
    return { user: user || null };
  },
});

export default Credential;
