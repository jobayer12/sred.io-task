const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const {jwtVerification} = require("../helpers/middleware");

router.get('/auth', githubController.githubAuth);
router.get('/callback', githubController.githubCallback);
router.delete('/remove', jwtVerification, githubController.removeIntegration);
router.get('/verify/:token', githubController.verifyToken);
router.get('/repos', jwtVerification,githubController.fetchRepositories);
router.post('/contributor', jwtVerification, githubController.fetchContributor);

module.exports = router;