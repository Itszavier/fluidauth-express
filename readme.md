
# Fluid Auth Express

fluidauth-express makes adding authentication to your Express app easy. Follow these steps to get started quickly.


## Key Points

**Experimental Session Management**: The session management feature in FluidAuth is still in beta. It is actively being developed and might change, so please keep this in mind as you integrate it into your project.

**Body Parser Required**: You need to use `body-parser` to handle request data.

**Initialize Middleware**: Use `authService.initialize()` after setting up the session middleware to configure necessary helper functions.
## Installation

Install fluidAuth for express with npm

```bash
 npm i @fluidauth/express
```
    
## Setting Up

Here’s a basic setup to get you started:
```js
const { AuthService } = require("@fluidauth/express");
const { GoogleProvider } = require("@fluidauth/express/providers");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// Create an instance of AuthService with your configuration
const authService = new AuthService({
  providers: [
    new GoogleProvider({
      credentials: {
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
        redirectUri: "your-redirect-url",
      },
      async verifyUser(data, profile) {
        // Replace with your own logic to find or create a user
        const user = await fakeDb.findUser({ email: profile.email });
        if (user) return { user };

        const newUser = await fakeDb.createUser({
          name: profile.name,
          email: profile.email,
          email_verified: profile.email_verified,
        });
        return { user: newUser };
      },
    }),
  ],
  session: {
    secret: "your-session-secret",
  },
  redirect: {
    onLoginSuccess: "/dashboard",
    onLoginFailure: "/",
  },
});

// Add body-parser middleware to handle request data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add FluidAuth's session and initialize middleware
app.use(authService.session());
app.use(authService.initialize());

// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Start the server
app.listen(8080, () => {
  console.log("Listening on http://localhost:8080/");
});
```


## Documentation

There’s more to FluidAuth than meets the eye. Stay tuned—full documentation is coming soon! on stable release


## Appendix

 I built this package as a modern and easy-to-use alternative to Passport.js, making authentication simpler and more efficient.