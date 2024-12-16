import axios from 'axios';
import { createOctokitInstance } from './octokitClient.js';
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
        const octokit = createOctokitInstance(accessToken);
        // Fetch the authenticated user's information
        const { data } = await octokit.rest.users.getAuthenticated();
        return data; // Contains the user's GitHub information
    } catch (error) {
        console.error('Failed to load github user information due to: ', error);
        return null;
    }
}

export const fetchOrganizations = async (accessToken, integrationId) => {
    const octokit = createOctokitInstance(accessToken);
    let organizationList = [];
    let page = 1;

    try {
        while (true) {
            // Fetch organizations with pagination support
            const { data: organizations } = await octokit.rest.orgs.listForAuthenticatedUser({
                per_page: 100,
                page,
            });

            if (organizations.length === 0) break; // Exit loop if no organizations are returned

            organizationList.push(...organizations);

            // Process each organization in parallel, but ensure we limit concurrency for database operations
            await githubService.processOrganizations(organizations, integrationId);
            page++;
        }

    } catch (error) {
        console.error('Error fetching organizations:', error);
    }
    return organizationList;
};


export const fetchRepositories = async (accessToken, integrationId, organizations) => {
    const octokit = createOctokitInstance(accessToken); // Initialize Octokit with the access token
    let repoList = [];

    for (const org of organizations) {
        try {
            let page = 1;

            // Fetch repositories with pagination
            while (true) {
                const { data: repositories } = await octokit.rest.repos.listForOrg({
                    org: org.name, // Organization name
                    per_page: 100,
                    page: page, // Pagination
                });

                // Add fetched repositories to the list
                repoList.push(...repositories);

                // Process repositories in parallel for DB updates
                await githubService.processRepositories(repositories, org._id, integrationId);

                if (repositories.length < 100) break; // Exit loop when no more repositories

                page++; // Increment page for pagination
            }
        } catch (error) {
            console.error(`Error fetching repositories for organization ${org.name}:`, error);
        }
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
    const octokit = createOctokitInstance(accessToken);
    let page = 1;
    try {
        while (true) {
            const { data: pullRequests } = await octokit.rest.pulls.list({
                owner: organization,
                repo,
                per_page: 100,
                page,
                state: 'all'
            });
            if (pullRequests.length === 0) break; // Exit if no more pullRequests
            
            await githubService.processPullRequests(pullRequests, integrationId, repositoryId);
            
            page++;
        }
    } catch (error) {
        console.error(`Error fetching commits for ${organization}/${repo}:`, error);
    }
    

};

// Fetch commits for a given repository and update usersMap
export const fetchCommits = async (accessToken, organization, repo, integrationId, repositoryId) => {
    const octokit = createOctokitInstance(accessToken);
    let page = 1;
    try {
        while (true) {
            const { data: commits } = await octokit.rest.repos.listCommits({
                owner: organization,
                repo, 
                per_page: 100,
                page,
                state: 'all'
            });
            if (commits.length === 0) break; // Exit if no more commits
            
            await githubService.processCommits(commits, integrationId, repositoryId);
            
            page++;
        }
    } catch (error) {
        console.error(`Error fetching commits for ${organization}/${repo}:`, error);
    }
};

// Fetch issues for a given repository and update usersMap
const fetchIssues = async (accessToken, organization, repo, integrationId, repositoryId) => {
    const octokit = createOctokitInstance(accessToken);
    let page = 1;
    try {
        while (true) {
            const { data: issues } = await octokit.rest.issues.listForRepo({
                owner: organization,
                repo,
                per_page: 100,
                page,
                state: 'all'
            });
            if (issues.length === 0) break; // Exit if no more issue
            
            await githubService.processIssues(issues, integrationId, repositoryId);
            page++;
        }
    } catch (error) {
        console.log('error: ', error);
    }
    
};
