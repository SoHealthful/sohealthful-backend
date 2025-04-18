import { allOk, badRequest } from '@medplum/core';
import { PasswordChangeRequest, Reference, User, UserSecurityRequest } from '@medplum/fhirtypes';
import { Request, Response } from 'express';
import { generateSecret } from '../oauth/keys';
import { body } from 'express-validator';
import { getConfig } from '../config/loader';
import { pwnedPassword } from 'hibp';
import { sendOutcome } from '../fhir/outcomes';
import { getSystemRepo } from '../fhir/repo';
import { timingSafeEqualStr } from '../oauth/utils';
import { makeValidationMiddleware } from '../util/validator';
import { bcryptHashPassword } from './utils';

export const setPasswordValidator = makeValidationMiddleware([
  body('id').isUUID().withMessage('Invalid request ID'),
  body('secret').notEmpty().withMessage('Missing secret'),
  body('password').isLength({ min: 8 }).withMessage('Invalid password, must be at least 8 characters'),
]);

export async function setPasswordHandler(req: Request, res: Response): Promise<void> {
  const systemRepo = getSystemRepo();
  let securityRequest: UserSecurityRequest | PasswordChangeRequest;

  // PasswordChangeRequest is deprecated but still supported. When it is removed, this try/catch can be removed
  try {
    securityRequest = await systemRepo.readResource<UserSecurityRequest>('UserSecurityRequest', req.body.id);
  } catch (_err) {
    securityRequest = await systemRepo.readResource<PasswordChangeRequest>('PasswordChangeRequest', req.body.id);
  }

  if (securityRequest.used) {
    sendOutcome(res, badRequest('Already used'));
    return;
  }

  if (securityRequest.type === 'verify-email') {
    sendOutcome(res, badRequest('Invalid request type'));
    return;
  }

  if (!timingSafeEqualStr(securityRequest.secret as string, req.body.secret)) {
    sendOutcome(res, badRequest('Incorrect secret'));
    return;
  }

  const user = await systemRepo.readReference(securityRequest.user as Reference<User>);

  const numPwns = await pwnedPassword(req.body.password);
  if (numPwns > 0) {
    sendOutcome(res, badRequest('Password found in breach database', 'password'));
    return;
  }

  await setPassword({ ...user, emailVerified: true }, req.body.password);
  await systemRepo.updateResource<typeof securityRequest>({ ...securityRequest, used: true });
  sendOutcome(res, allOk);
}

export async function verifyOtp(req: Request, res: Response): Promise<any> {
  const systemRepo = getSystemRepo();
  if (!req.body.otp && !req.body.id) {
    return sendOutcome(res, badRequest('OTP is required'));
  }
  let securityRequest = await systemRepo.readResource<UserSecurityRequest>('UserSecurityRequest', req.body.id);
  if (!securityRequest) {
    return sendOutcome(res, badRequest('Invalid id'));
  }

  if (securityRequest.used) {
    sendOutcome(res, badRequest('Already used'));
    return;
  }

  if (!timingSafeEqualStr(securityRequest.secret as string, req.body.otp)) {
    sendOutcome(res, badRequest('Incorrect otp'));
    return;
  }

  const expirationExtension = securityRequest.extension?.find(
    (ext: any) => ext.url === `${getConfig().baseUrl}fhir/StructureDefinition/expirationTime`
  );

  if (expirationExtension?.valueInstant) {
    const now = new Date();
    const expiresAt = new Date(expirationExtension.valueInstant);
    if (now > expiresAt) {
      sendOutcome(res, badRequest('OTP has expired'));
      return;
    }
  }

  // Mark the OTP request as used
  await systemRepo.updateResource<UserSecurityRequest>({
    ...securityRequest,
    used: true,
  });

  const pcr = await systemRepo.createResource({
    resourceType: 'UserSecurityRequest',
    user: securityRequest.user,
    type: 'reset',
    secret: generateSecret(16),
  });

  res.status(200).json({
    message: 'OTP verified successfully',
    id: pcr.id,
    secret: pcr.secret,
  });
}

export async function setPassword(user: User, password: string): Promise<void> {
  const passwordHash = await bcryptHashPassword(password);
  const systemRepo = getSystemRepo();
  await systemRepo.updateResource<User>({ ...user, passwordHash });
}
