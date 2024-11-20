import express from 'express';
import { githubAuth, githubCallback, removeIntegration, verifyToken, fetchRepositories, fetchContributor } from '../controllers/githubController.js';
import { jwtVerification } from '../helpers/middleware.js';

const router = express.Router();

// Routes
router.get('/auth', githubAuth);
router.get('/callback', githubCallback);
router.delete('/remove', jwtVerification, removeIntegration);
router.get('/verify/:token', verifyToken);
router.get('/repos', jwtVerification, fetchRepositories);
router.post('/contributor', jwtVerification, fetchContributor);

export default router;