const Integration = require('../models/Integration');
const {generateToken} = require("../helpers/jwt");
const jwt = require("../helpers/jwt");
const githubService = require("../services/githubService");
const githubApi = require("../helpers/githubApi");

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
        const accessToken = await githubApi.githubAccessToken(code);

        // Fetch User Info
        const userResponse = await githubApi.githubUserInfomation(accessToken);

        const username = userResponse.data['login'];
        const userData = {
            user: userResponse.data,
            username: username,
            token: accessToken,
            connectedAt: new Date(),
        };

        const integration = await githubService.integrationFindOneAndUpdate(userData);
        const tokenInfo = {
            id: integration._id,
            username: username,
            connectedAt: userData.connectedAt
        }

        if (integration) {
           try {
            const organizations = await githubApi.fetchOrganizations(accessToken, integration._id).catch(error => console.log('failed to fetch organization'));
            if (organizations && Array.isArray(organizations) && organizations.length > 0) {
                const oragnizationList = await githubService.fetchOrganizationsByIntegrationId(integration._id);
                await githubApi.fetchRepositories(accessToken, integration._id, oragnizationList).catch(error => console.log('failed to fetch repositories'));
            }
           } catch (error) {
            console.error('error: ', error);
           }
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
            const userDetails = await githubService.integrationFindOneById(verifyToken.id);
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
        const results = await githubService.fetchRepositoriesByIntegrationId(integration._id);
        response.data = results;     
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
        const {repositoryId} = req.body;
        const repository = await githubService.findRepositoryById(repositoryId);
        if (!repository) {
            response.error = "Invalid repositoryId.";
            return res.status(500).json(response);
        }

        const id = req.user.id;
        const integration = await githubService.findOneById(id);
        if (!integration) {
            response.error = "No github integration account Found.";
            return res.status(500).json(response);
        };
        const accessToken = integration.token;

        const repositoryDetailList = await githubService.findRepositoryDetailList(repository._id);
        if (repositoryDetailList && Array.isArray(repositoryDetailList) && repositoryDetailList.length > 0) {
            githubApi.fetchContributor(repository.slug, integration._id, repository._id, accessToken).catch(error => console.error(error));
            response.data = repositoryDetailList;
        } else {
            response.data = await githubApi.fetchContributor(repository.slug, integration._id, repository._id, accessToken);
        }
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}