import { badRequest, createReference } from '@medplum/core';
import { Login, Project, ProjectMembership, Reference, User } from '@medplum/fhirtypes';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import { createProject } from '../fhir/operations/projectinit';
import { sendOutcome } from '../fhir/outcomes';
import { getSystemRepo } from '../fhir/repo';
import { makeValidationMiddleware } from '../util/validator';
import { getConfig } from '../config/loader';

export interface NewProjectRequest {
  readonly loginId: string;
  readonly projectName: string;
}

export const newProjectValidator = makeValidationMiddleware([
  body('login').isUUID().withMessage('Login ID is required.'),
  body('projectName').isLength({ min: 4, max: 72 }).withMessage('Project name must be between 4 and 72 characters'),
]);

/**
 * Handles a HTTP request to /auth/newproject.
 * Requires a partial login.
 * Creates a Project, Profile, ProjectMembership, and default ClientApplication.
 * @param req - The HTTP request.
 * @param res - The HTTP response.
 */
export async function newProjectHandler(req: Request, res: Response): Promise<void> {
  const systemRepo = getSystemRepo();
  const login = await systemRepo.readResource<Login>('Login', req.body.login);

  if (login.membership) {
    sendOutcome(res, badRequest('Login already has a membership'));
    return;
  }

  const projectName = req.body.projectName;
  const user = await systemRepo.readReference<User>(login.user as Reference<User>);
  const { membership } = await createProject(projectName, user);

  // Set the membership on the login
  const updatedLogin = await systemRepo.updateResource<Login>({
    ...login,
    membership: createReference(membership as ProjectMembership),
  });

  res.status(200).json({
    login: updatedLogin.id,
    code: updatedLogin.code,
  });
}

export async function getProject(req: Request, res: Response): Promise<any> {
  const id = getConfig().projectId;
  const systemRepo = getSystemRepo();
  if (!id) {
    return res.status(400).json(badRequest('Project id is required'));
  }

  try {
    const project = await systemRepo.readResource<Project>('Project', id);
    if (project) {
      return res.json({ id: project.id });
    }
    return res.status(404).json({ message: 'Project not found' });
  } catch (err) {
    console.error('Error searching project:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
