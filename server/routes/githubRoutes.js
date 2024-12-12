import express from 'express';
import {
    githubAuth,
    githubCallback,
    removeIntegration,
    verifyToken,
    fetchRepositories,
    fetchRepositoryActivity,
    fetchIntegrations,
    fetchPullRequests,
    fetchCommits
} from '../controllers/githubController.js';
import { jwtVerification } from '../helpers/middleware.js';

const router = express.Router();

// Routes
router.get('/auth', githubAuth);
router.get('/callback', githubCallback);
router.delete('/remove', jwtVerification, removeIntegration);
router.get('/verify/:token', verifyToken);
router.get('/repos', jwtVerification, fetchRepositories);
router.get('/repos/:integrationId', jwtVerification, fetchRepositories);
router.post('/repository-activities', jwtVerification, fetchRepositoryActivity);
router.get('/integrations', jwtVerification, fetchIntegrations);
router.get('/pull-requests/:repoId', jwtVerification, fetchPullRequests);
router.get('/commits/:repoId', jwtVerification, fetchCommits);


export default router;