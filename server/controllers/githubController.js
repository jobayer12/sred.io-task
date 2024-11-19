const Integration = require('../models/Integration');
const {generateToken} = require("../helpers/jwt");
const jwt = require("../helpers/jwt");
const githubService = require("../services/githubService");

// Redirect User to GitHub for Authentication
exports.githubAuth = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email,repo,read:org`);
};

// Handle Callback and Fetch Token
exports.githubCallback = async (req, res) => {
    const { code } = req.query;
    try {
        // get access token
        const accessToken = await githubService.githubAccessToken(code);

        // Fetch User Info
        const userResponse = await githubService.githubUserInfomation(accessToken);

        const username = userResponse.data['login'];
        const userData = {
            user: userResponse.data,
            username: username,
            token: accessToken,
            connectedAt: new Date(),
        };

        const integration = await githubService.findOneAndUpdate(userData);
        const tokenInfo = {
            id: integration._id,
            username: username,
            connectedAt: userData.connectedAt
        }
        // generate jwt token
        const jwtToken = await generateToken(tokenInfo);
        res.redirect(`${process.env.CLIENT_URI}/integrations/github?token=${jwtToken}`);
    } catch (error) {
        res.status(500).json({ data: null, status: 500, error: error.message });
    }
};

// Remove GitHub Integration
exports.removeIntegration = async (req, res) => {
    const response = {status: 200, data: false, error: ""};
    try {
        const id = req.user.id;
        const result = await Integration.deleteOne({ _id: id });
        
        response.data = result.deletedCount > 0;
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
};

// Verify JWT Token
exports.verifyToken = async (req, res) => {
    const response = {status: 200, data: false, error: ""};
    try {
        const token = req.params.token;
        const verifyToken = await jwt.verifyToken(token);
        if (verifyToken) {
            const userDetails = await githubService.findOneById(verifyToken.id);
            if (userDetails) {
                response.data = true;
            }
        }
        res.status(response.status).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

exports.fetchRepositories = async (req, res) => {
    const response = { status: 200, data: [], error: "" };
    try {
        const id = req.user.id;
        const integration = await githubService.findOneById(id);
        if (!integration) {
            response.error = "Not Found.";
            return res.status(500).json(response);
        };
        const accessToken = integration.token;
        const organizations = await githubService.fetchOrganizations(accessToken);
        if (organizations && organizations.length > 0) {
            const repositories = [];
            for (const org of organizations) {
                const response = await githubService.fetchRepos(org.login, accessToken);
                repositories.push(...response.map(repo => {
                    return {
                        id: repo.id,
                        name: repo.name,
                        link: repo.html_url,
                        slug: repo.full_name
                    }
                }));
            }
            response.data = repositories;
        }
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

exports.fetchContributor = async (req, res) => {
    const response = { status: 200, data: [], error: "" };
    try {
        const { repo } = req.body;
        const id = req.user.id;
        const integration = await githubService.findOneById(id);
        if (!integration) {
            response.error = "Not Found.";
            return res.status(500).json(response);
        };
        const accessToken = integration.token;
        const result = await githubService.fetchContributor(repo, accessToken);
        response.data = result;
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}