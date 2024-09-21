# @fluidauth/express

## 1.1.1

### Patch Changes

- ### Added - Provider Types

  More provider types have been added for authentication, providing increased flexibility for creating custom providers:

  - `CREDENTIALS` // Credentials-based authentication
  - `OAUTH2` // OAuth2 authentication
  - `SAML` // SAML authentication
  - `JWT` // JWT-based authentication
  - `OPENID_CONNECT` // OpenID Connect authentication
  - `API_KEY` // API key-based authentication
  - `ANONYMOUS_ACCESS` // Anonymous access

## 1.1.0

### Minor Changes

- ab2defb: Enhance provider creation with the addition of handleLogin function, improved error handling, change of IAuthResponse to IValidationResponse, and a new return type for the validation function.

  ### Added

  - **handleLogin Function**: Implemented a dedicated method for user authentication that supports a configurable `validationFunction` for both synchronous and asynchronous validation processes. This function also handles persisting the authenticated user to the session.
  - **handleAuthError Function**: Enhanced error handling by providing structured responses for authentication errors, ensuring that the user receives clear and informative feedback during the authentication process.
    Here’s the updated changeset entry reflecting the renaming:

  ### Changed

  - **handleAuthError Function**: Enhanced error handling to deliver clearer and more context-specific responses during the authentication process, improving user feedback.
  - **Response Interface**: Renamed `IAuthResponse` to `IValidationResponse` to better reflect its purpose and improve clarity regarding validation outcomes.
  - **Validation Function Return Type**: Established a specific return type for the validation function, enhancing type safety and ensuring consistency across all authentication providers.
  - **Redirect Functions**: Renamed `onLoginSuccess` to `successRedirect` and `onLoginFailure` to `failureRedirect` for improved clarity in handling redirect behavior after authentication outcomes.
