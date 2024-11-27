import Integration from '../models/Integration.js';
import { generateToken } from '../helpers/jwt.js';
import * as jwt from '../helpers/jwt.js';  // If you need to access multiple functions from this file
import * as githubService from '../services/githubService.js';
import * as githubApi from '../helpers/githubApi.js';

// Redirect User to GitHub for Authentication
export const githubAuth = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email,repo,read:org`);
};

// Handle Callback and Fetch Token
export const githubCallback = async (req, res) => {
    const { code } = req.query;
    try {
        // get access token
        const accessToken = await githubApi.githubAccessToken(code);

        // Fetch User Info
        const userResponse = await githubApi.githubUserInfomation(accessToken);

        const username = userResponse['login'];
        const userData = {
            user: userResponse,
            username: username,
            token: accessToken,
            connectedAt: new Date(),
        };

        const integration = await githubService.processIntegrations(userData);
        const tokenInfo = {
            id: integration._id,
            username: username,
            connectedAt: userData.connectedAt
        }

        if (integration) {
           try {
            const organizations = await githubApi.fetchOrganizations(accessToken, integration._id).catch(error => console.log('failed to fetch organization'));
            if (organizations && Array.isArray(organizations) && organizations.length > 0) {
                const organizationList = await githubService.fetchOrganizationsByIntegrationId(integration._id);
                await githubApi.fetchRepositories(accessToken, integration._id, organizationList).catch(error => console.log('failed to fetch repositories'));
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
export const removeIntegration = async (req, res) => {
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
export const verifyToken = async (req, res) => {
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

export const fetchRepositories = async (req, res) => {
    const response = { status: 200, data: [], error: "" };
    try {
        const id = req.user.id;
        const integration = await githubService.integrationFindOneById(id);
        if (!integration) {
            response.error = `User doesn't exists.`;
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

export const fetchRepositoryActivity = async (req, res) => {
    const response = { status: 200, data: [], error: "" };
    const { repositoryId } = req.body; // Get repositoryId from query parameters

    if (!repositoryId) {
        response.error = 'repositoryId is required';
        return res.status(400).json(response);
    }
    const filter = {
        id: repositoryId
    }
    try {
        const repositoryList = await githubService.fetchRepositories(filter);
        if (repositoryList.length === 0) {
            response.error = 'Invalid repository id';
            return res.status(400).json(response);
        }
        const repository = repositoryList.pop()
        const integration = await githubService.integrationFindOneById(req.user.id);
        if (!integration) {
            response.error = `User doesn't exists.`;
            return res.status(400).json(response);
        }

        const repositoryActivity = await githubService.findRepositoryActivies(repositoryId);
        if (repositoryActivity.length === 0) {
            response.data = await githubApi.repoistoryActivity(repository.slug, integration._id, repositoryId, integration.token);
        } else {
            response.data = repositoryActivity;
        }
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}
