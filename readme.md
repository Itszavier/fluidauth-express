<!-- @format -->

FluidAuth is a user-friendly authentication framework created by me. It simplifies the process of integrating authentication into your application, letting you focus on what really matters without getting caught up in complex setups.

## Preview

This is a preview of what the framework will look like in the coming week as I prepare to publish the stable version. FluidAuth is designed to make adding authentication to your Express applications straightforward and hassle-free, allowing you to focus on developing your app while it handles the authentication with ease.

```js
const { authService, Session } = require("@fluidauth/express");
const { GoogleProvider } = require("@fluidauth/express/providers");


// Initialize the GoogleProvider with your credentials
const Google = new GoogleProvider({
  credentials: {
    redirectUri: "http://localhost:3000/redirect/google",
    clientId: process.env.CLIENT_ID as string,
    clientSecret: process.env.CLIENT_SECRET as string,
  },

    // Verify the user after Google authentication
   async verifyUser(GoogleAuthData, Profile) {
    // Find the user in the database by email
      const user = users.find(dbUser => dbUser.email === Profile.email);

      if (user) {
        return { user }; // Return the existing user
      }

      // Optionally handle user creation or other logic here
      return {user: null, info: {message: "user not found"}}; // Return null if user is not found
    }
  }
});

const authService = new AuthService({
  providers: [Google],
  session: new Session({})
});
```

The code snippet above integrates seamlessly with Express.js using middleware. It allows you to use FluidAuth with Express effortlessly, handling authentication through the Google provider with minimal setup.
