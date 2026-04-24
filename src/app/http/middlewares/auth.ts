import { NextFunction, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { URL } from 'node:url';
import { authConfig } from '../../../config/auth';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

const issuerBase = authConfig.issuer.replace(/\/$/, '');
const jwksPath = issuerBase.includes('cognito-idp.')
  ? '/.well-known/jwks.json'
  : '/protocol/openid-connect/certs';
const jwks = issuerBase ? createRemoteJWKSet(new URL(`${issuerBase}${jwksPath}`)) : null;

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!authConfig.enabled || !jwks) {
    return res.status(503).json({
      message: 'Autenticação Cognito não configurada',
      details: 'Defina COGNITO_CLIENT_ID e COGNITO_USER_POOL_ID (ou COGNITO_ISSUER).'
    });
  }

  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não informado' });
    }

    const token = header.substring(7);
    const { payload } = await jwtVerify(token, jwks, {
      issuer: authConfig.issuer,
      audience: authConfig.audience
    });

    const groupsClaim = payload['cognito:groups'];
    const cognitoGroups = Array.isArray(groupsClaim)
      ? groupsClaim.filter((group): group is string => typeof group === 'string')
      : [];
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const name = typeof payload.name === 'string' ? payload.name : undefined;

    req.user = {
      id: (payload.sub as string) ?? '',
      roles: cognitoGroups,
      ...(email ? { email } : {}),
      ...(name ? { name } : {})
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido',
      details: (error as Error).message
    });
  }
};
