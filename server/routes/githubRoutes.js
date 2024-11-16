const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const {jwtVerification} = require("../helpers/middleware");

router.get('/auth', githubController.githubAuth);
router.get('/callback', githubController.githubCallback);
router.delete('/remove', jwtVerification, githubController.removeIntegration);
router.get('/verify/:token', githubController.verifyToken);

module.exports = router;