const {
  COGNITO_REGION = "us-east-1",
  COGNITO_USER_POOL_ID = "",
  COGNITO_CLIENT_ID = "",
  COGNITO_ISSUER,
} = process.env;

const derivedIssuer =
  COGNITO_ISSUER ||
  (COGNITO_REGION && COGNITO_USER_POOL_ID
    ? `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    : "");

export const authConfig = {
  enabled: Boolean(derivedIssuer && COGNITO_CLIENT_ID),
  issuer: derivedIssuer,
  audience: COGNITO_CLIENT_ID,
};
