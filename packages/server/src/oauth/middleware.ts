import { OperationOutcomeError, ProfileResource, unauthorized, WithId } from '@medplum/core';
import { Login, Project, ProjectMembership } from '@medplum/fhirtypes';
import { NextFunction, Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { getConfig } from '../config/loader';
import { AuthenticatedRequestContext, getRequestContext } from '../context';
import { getLoginForAccessToken, getLoginForBasicAuth } from './utils';

export interface AuthState {
  login: Login;
  project: WithId<Project>;
  membership: WithId<ProjectMembership>;
  accessToken?: string;

  onBehalfOf?: WithId<ProfileResource>;
  onBehalfOfMembership?: WithId<ProjectMembership>;
}

export const PROMPT_BASIC_AUTH_PARAM = '_medplum-prompt-basic-auth';

export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
  const ctx = getRequestContext();
  if (ctx instanceof AuthenticatedRequestContext) {
    next();
  } else {
    if (res.req.query[PROMPT_BASIC_AUTH_PARAM]) {
      res.set('WWW-Authenticate', `Basic realm="${getConfig().baseUrl}"`);
    }
    next(new OperationOutcomeError(unauthorized));
  }
}

export async function authenticateTokenImpl(req: IncomingMessage): Promise<AuthState | undefined> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return undefined;
  }

  const [tokenType, token] = authHeader.split(' ');
  if (!tokenType || !token) {
    return undefined;
  }

  if (tokenType === 'Bearer') {
    return getLoginForAccessToken(req, token);
  }

  if (tokenType === 'Basic') {
    return getLoginForBasicAuth(req, token);
  }

  return undefined;
}

export function isExtendedMode(req: Request): boolean {
  return req.headers['x-medplum'] === 'extended';
}

// fine the activity details structure
// interface ActivityDetails {
//   userId: string | null;
//   method: string;
//   url: string;
//   timestamp: Date;
// }

// Middleware to track user activity
// export const activityTracker = (req: Request, res: Response, next: NextFunction): any => {
//   // Check if user is authenticated, assuming a `user` object is attached to the `req` in a previous authentication middleware
//   const user: any | null = req.user || null;

//   // Extract timestamp and timezone from headers (sent by frontend)
//   const timestamp = req.headers['timestamp'] as string | undefined;
//   const timezone = req.headers['timezone'] as string | undefined;

//   // If no user is authenticated, return an error response (optional)
//   if (!user) {
//     return res.status(401).json({ message: 'Unauthorized access: User not authenticated' });
//   }

//   // Get the request details
//   const activityDetails: ActivityDetails = {
//     userId: user.id, // Assuming user has an 'id' field
//     method: req.method,
//     url: req.originalUrl,
//     timestamp: new Date(),
//   };

//   // Log activity to the console (you can also save it to a database)
//   console.log('User Activity:', activityDetails);

//   // Optionally, store activity in a database (e.g., MongoDB, PostgreSQL)
//   // Example: ActivityModel.create(activityDetails); // Save to your database

//   // Proceed to the next middleware or route handler
//   next();
// };
