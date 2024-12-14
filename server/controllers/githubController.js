import Integration from '../models/Integration.js';
import { generateToken } from '../helpers/jwt.js';
import * as jwt from '../helpers/jwt.js';  // If you need to access multiple functions from this file
import * as githubService from '../services/githubService.js';
import * as githubApi from '../helpers/githubApi.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

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
        res.redirect(`${process.env.CLIENT_URI}/oauth?token=${jwtToken}`);
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

export const fetchIntegrations = async (req, res) => {
    const response = { status: 200, data: [], error: "" };
    try {
        const id = req.user.id;
        const integration = await githubService.integrationFindOneById(id);
        if (!integration) {
            response.error = `Integration doesn't exists.`;
            return res.status(500).json(response);
        };

        const limit = parseInt(req.query.limit, 10) || 100; // Default limit is 100
        const page = parseInt(req.query.page, 10) || 0; // Default page is 0

        const results = await githubService.fetchIntegrations(limit, page);
        response.data = results;

        res.status(200).json(response);

    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

export const fetchRepositories = async (req, res) => {
    const response = responseTemplate();
    try {
        const integrationId = req.user?.id;
        if (!integrationId) {
            response.status = 401;
            response.error = "Unauthorized access.";
            return res.status(401).json(response);
        }

        const integration = await githubService.integrationFindOneById(integrationId);
        if (!integration) {
            response.status = 404;
            response.error = `Integration doesn't exists.`;
            return res.status(404).json(response);
        };

        let { limit, page, search } = req.query;
        limit = Math.min(parseInt(limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
        page = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);
        const filter = {integrationId: integration._id, search};
        const results = await githubService.fetchRepositories(filter, {limit, page});
        const totalCount = await githubService.countRepositories(filter);

        // Prepare pagination info
        response.pagination = {
            totalCount,
            currentPage: page,
            totalItems: results.length,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        };
        response.data = results;

        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

export const fetchRepositoriesByIntegrationId = async (req, res) => {
    const response = { status: 200, data: [], error: "" };
    try {
        const id = req.params.integrationId;
        const integration = await githubService.integrationFindOneById(id);
        if (!integration) {
            response.error = `Integration doesn't exists.`;
            return res.status(500).json(response);
        };

        const limit = parseInt(req.query.limit, 10) || 100; // Default limit is 100
        const page = parseInt(req.query.page, 10) || 0; // Default page is 0

        const results = await githubService.fetchRepositoriesByIntegrationId(integration._id, limit, page);
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

export const fetchPullRequests = async (req, res) => {
    const response = responseTemplate();
    try {
        // Extract and validate query parameters
        let { limit, page, search } = req.query;
        limit = Math.min(parseInt(limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
        page = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);

        const integrationId = req.user?.id;
        if (!integrationId) {
            response.status = 401;
            response.error = "Unauthorized access.";
            return res.status(401).json(response);
        }
        const filter = {integrationId: integrationId, search};
        const results = await githubService.findPullRequests(filter, {limit, page});
        const totalCount = await githubService.countPullRequests(filter);

        // Prepare pagination info
        response.pagination = {
            totalCount,
            currentPage: page,
            totalItems: results.length,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        };

        response.data = results;
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

export const fetchCommits = async (req, res) => {
    const response = responseTemplate();
    try {
        // Extract and validate query parameters
        let { limit, page, search } = req.query;
        limit = Math.min(parseInt(limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
        page = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);

        const integrationId = req.user?.id;
        if (!integrationId) {
            response.status = 401;
            response.error = "Unauthorized access.";
            return res.status(401).json(response);
        }

        const filter = {integrationId: integrationId, search};

        // Fetch paginated commits
        const results = await githubService.findCommits(filter, { limit, page });
        const totalCount = await githubService.countCommits(filter);

        // Prepare pagination info
        response.pagination = {
            totalCount,
            currentPage: page,
            totalItems: results.length,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        };

        response.data = results;
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

export const fetchIssues = async (req, res) => {
    const response = responseTemplate();
    try {
        // Extract and validate query parameters
        let { limit, page, search } = req.query;
        limit = Math.min(parseInt(limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
        page = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);

        const integrationId = req.user?.id;
        if (!integrationId) {
            response.status = 401;
            response.error = "Unauthorized access.";
            return res.status(401).json(response);
        }

        const filter = {integrationId: integrationId, search};

        // Fetch paginated commits
        const results = await githubService.findIssues(filter, { limit, page });
        const totalCount = await githubService.countIssues(filter);

        // Prepare pagination info
        response.pagination = {
            totalCount,
            currentPage: page,
            totalItems: results.length,
            totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
        };

        response.data = results;
        res.status(200).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(500).json(response);
    }
}

const responseTemplate = () => ({
    status: 200,
    data: [],
    error: "",
    pagination: {},
});