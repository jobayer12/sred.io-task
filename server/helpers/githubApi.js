import axios from 'axios';
import { Octokit } from '@octokit/rest';
import { isRateLimited, waitForRateLimit } from '../helpers/githubRateLimiting.js';
import * as githubService from '../services/githubService.js';

export const githubAccessToken = async (code) => {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = response.data;
    return access_token;
}

export const githubUserInfomation = async accessToken => {
    try {
        const octokit = new Octokit({ auth: accessToken });
        // Fetch the authenticated user's information
        const { data } = await octokit.rest.users.getAuthenticated();
        return data; // Contains the user's GitHub information
    } catch (error) {
        console.error(error);
        return null;
    }
}

export const fetchOrganizations = async (accessToken, integrationId) => {
    const octokit = new Octokit({ auth: accessToken });
    let organizationList = [];
    let page = 1;

    const statuses = await githubService.getFetchStatuses({
        objectId: integrationId,
        type: 'ORGANIZATION',
        status: 'STARTED'
    });
    if (statuses.length > 0) {
        return;
    }
    await githubService.createFetchStatus({
        objectId: integrationId,
        type: 'ORGANIZATION',
    });

    try {
        while (true) {
            // Fetch organizations with pagination support
            const { data: organizations, headers } = await octokit.rest.orgs.listForAuthenticatedUser({
                per_page: 100,
                page,
            });

            if (organizations.length === 0) break; // Exit loop if no organizations are returned

            organizationList.push(...organizations);

            // Process each organization in parallel, but ensure we limit concurrency for database operations
            await githubService.processOrganizations(organizations, integrationId);

            // Check rate limit status to avoid hitting the limit
            if (isRateLimited(headers)) {
                console.log('Rate limit hit, waiting...');
                await waitForRateLimit(headers);
            }

            page++;
        }

    } catch (error) {
        console.error('Error fetching organizations:', error);
    }

    await githubService.updateFetchStatus(integrationId, 'ORGANIZATION', 'STARTED');
    return organizationList;

};


export const fetchRepositories = async (accessToken, integrationId, organizations) => {
    const octokit = new Octokit({ auth: accessToken }); // Initialize Octokit with the access token
    let repoList = [];

    for (const org of organizations) {
        const statuses = await githubService.getFetchStatuses({
            objectId: org._id,
            type: 'REPOSITORY',
            status: 'STARTED'
        });
        if (statuses.length > 0) {
            continue;
        }
        await githubService.createFetchStatus({
            objectId: org._id,
            type: 'REPOSITORY',
            status: 'STARTED'
        });
        try {
            let page = 1;
            let repositories;

            // Fetch repositories with pagination
            while (true) {
                const { data } = await octokit.rest.repos.listForOrg({
                    org: org.name, // Organization name
                    per_page: 100,
                    page: page, // Pagination
                });

                repositories = data;
                if (repositories.length === 0) break; // Exit loop when no more repositories

                // Add fetched repositories to the list
                repoList.push(...repositories);

                // Process repositories in parallel for DB updates
                await githubService.processRepositories(repositories, org._id, integrationId);
                page++; // Increment page for pagination
            }
        } catch (error) {
            console.error(`Error fetching repositories for organization ${org.name}:`, error);
        }
        await githubService.updateFetchStatus(org._id, 'REPOSITORY', 'STARTED');
    }

    return repoList; // Return the list of repositories after processing all organizations
};

export const repoistoryActivity = async (slug, integrationId, repositoryId, accessToken) => {
    try {
        const organization = slug.split('/')[0]; // extract owner
        const repo = slug.split('/')[1]; // extract repository
        // Fetch pull requests, commits, and issues concurrently to reduce delays
        await Promise.all([
            fetchPullRequests(accessToken, organization, repo, integrationId, repositoryId),
            fetchCommits(accessToken, organization, repo, integrationId, repositoryId),
            fetchIssues(accessToken, organization, repo, integrationId, repositoryId),
        ]);
    } catch (error) {
        console.error('Error fetching data from GitHub:', error);
    }
    
    return githubService.findRepositoryActivies(repositoryId);
};

// Fetch pull requests for a given repository and update usersMap
const fetchPullRequests = async (accessToken, organization, repo, integrationId, repositoryId) => {
    const octokit = new Octokit({ auth: accessToken });
    let page = 1;
    const statuses = await githubService.getFetchStatuses({
        objectId: repositoryId,
        type: 'PULL_REQUESTS',
        status: 'STARTED'
    });
    if (statuses.length > 0) {
        return;
    }
    await githubService.createFetchStatus({
        objectId: repositoryId,
        type: 'PULL_REQUESTS',
        status: 'STARTED'
    });
    try {
        while (true) {
            const { data: pullRequests, headers } = await octokit.rest.pulls.list({
                owner: organization,
                repo,
                per_page: 100,
                page,
            });
            if (pullRequests.length === 0) break; // Exit if no more pullRequests
            
            await githubService.processPullRequests(pullRequests, integrationId, repositoryId);
            
            // Check rate limit status to avoid hitting the limit
            if (isRateLimited(headers)) {
                console.log('Rate limit hit, waiting...');
                // await waitForRateLimit(headers);
                break;
            }
            page++;
        }
    } catch (error) {
        console.error(`Error fetching commits for ${organization}/${repo}:`, error);
    }
    await githubService.updateFetchStatus(repositoryId, 'PULL_REQUESTS', 'STARTED');

};

// Fetch commits for a given repository and update usersMap
export const fetchCommits = async (accessToken, organization, repo, integrationId, repositoryId) => {
    const octokit = new Octokit({ auth: accessToken });
    let page = 1;
    try {
        const statuses = await githubService.getFetchStatuses({
            objectId: repositoryId,
            type: 'COMMIT',
            status: 'STARTED'
        });
        if (statuses.length > 0) {
            return;
        }
        await githubService.createFetchStatus({
            objectId: repositoryId,
            type: 'COMMIT',
            status: 'STARTED'
        });

        while (true) {
            const { data: commits, headers } = await octokit.rest.repos.listCommits({
                owner: organization,
                repo, 
                per_page: 100,
                page,
            });
            if (commits.length === 0) break; // Exit if no more commits
            
            await githubService.processCommits(commits, integrationId, repositoryId);
            
            // Check rate limit status to avoid hitting the limit
            if (isRateLimited(headers)) {
                console.log('Rate limit hit, waiting...');
                break;
                // await waitForRateLimit(headers);
            }
            page++;
        }
    } catch (error) {
        console.error(`Error fetching commits for ${organization}/${repo}:`, error);
    }
    await githubService.updateFetchStatus(repositoryId, 'COMMIT', 'STARTED');


};

// Fetch issues for a given repository and update usersMap
const fetchIssues = async (accessToken, organization, repo, integrationId, repositoryId) => {
    const octokit = new Octokit({ auth: accessToken });
    let page = 1;
    try {
        const statuses = await githubService.getFetchStatuses({
            objectId: repositoryId,
            type: 'ISSUE',
            status: 'STARTED'
        });
        if (statuses.length > 0) {
            return;
        }
        await githubService.createFetchStatus({
            objectId: repositoryId,
            type: 'ISSUE',
            status: 'STARTED'
        });
        while (true) {
            const { data: issues, headers } = await octokit.rest.issues.listForRepo({
                owner: organization,
                repo,
                per_page: 100,
                page,
            });
            if (issues.length === 0) break; // Exit if no more issue
            
            await githubService.processIssues(issues, integrationId, repositoryId);
            
            // Check rate limit status to avoid hitting the limit
            if (isRateLimited(headers)) {
                console.log('Rate limit hit, waiting...');
                break;
                // await waitForRateLimit(headers);
            }
            page++;
        }
    } catch (error) {
        await githubService.updateFetchStatus(repositoryId, 'ISSUE', 'STARTED');
    }
    await githubService.updateFetchStatus(repositoryId, 'ISSUE', 'STARTED');
};
