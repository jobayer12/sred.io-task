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

export const githubUserInfomation = async (accessToken) => {
    const octokit = new Octokit({ auth: accessToken });
    // Fetch the authenticated user's information
    const { data } = await octokit.rest.users.getAuthenticated();
    return data; // Contains the user's GitHub information
}

export const fetchOrganizations = async (accessToken, integrationId) => {
    const octokit = new Octokit({ auth: accessToken });
    let organizationList = [];
    let page = 1;

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

        return organizationList; // Return the final list of organizations if needed

    } catch (error) {
        console.error('Error fetching organizations:', error);
        return []; // Return an empty list if an error occurs
    }
};


export const fetchRepositories = async (accessToken, integrationId, organizations) => {
    const octokit = new Octokit({ auth: accessToken }); // Initialize Octokit with the access token
    let repoList = [];

    for (const org of organizations) {
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
    }

    return repoList; // Return the list of repositories after processing all organizations
};

export const fetchContributor = async (slug, integrationId, repositoryId, accessToken) => {
    const octokit = new Octokit({ auth: accessToken });
    const usersMap = {};

    try {
        // Fetch pull requests, commits, and issues concurrently to reduce delays
        await Promise.all([
            fetchPullRequests(octokit, slug, usersMap),
            fetchCommits(octokit, slug, usersMap),
            fetchIssues(octokit, slug, usersMap),
        ]);
    } catch (error) {
        console.error('Error fetching data from GitHub:', error);
    }

    // Convert usersMap to an array of user details
    const usersWithOtherDetails = Object.keys(usersMap).map(user => ({
        user: user,
        ...usersMap[user],
    }));

    // Update repository details in parallel using Promise.all
    if (usersWithOtherDetails.length > 0) {
        try {
            await Promise.all(
                usersWithOtherDetails.map((user) =>
                    githubService.processRepositoryDetails(user, integrationId, repositoryId)
                )
            );
        } catch (error) {
            console.error('Error updating repository details:', error);
        }
    }

    return githubService.findRepositoryDetailList(repositoryId);
};

// Fetch pull requests for a given repository and update usersMap
const fetchPullRequests = async (octokit, slug, usersMap) => {
    let page = 1;
    try {
        while (true) {
            const { data } = await octokit.rest.pulls.list({
                owner: slug.split('/')[0], // Extract owner from slug
                repo: slug.split('/')[1],  // Extract repo from slug
                state: 'open',
                per_page: 100,
                page,
            });

            if (data.length === 0) break; // Exit if no more pull requests
            data.forEach((pr) => updateUserMap(usersMap, pr.user, 'pullRequests'));

            page++;
        }
    } catch (error) {
        console.error(`Error fetching pull requests for ${slug}:`, error);
    }
};

// Fetch commits for a given repository and update usersMap
const fetchCommits = async (octokit, slug, usersMap) => {
    let page = 1;
    try {
        while (true) {
            const { data } = await octokit.rest.repos.listCommits({
                owner: slug.split('/')[0], // Extract owner from slug
                repo: slug.split('/')[1],  // Extract repo from slug
                per_page: 100,
                page,
            });

            if (data.length === 0) break; // Exit if no more commits
            data.forEach((commit) => {
                if (commit.author && commit.author.login) {
                    updateUserMap(usersMap, commit.author, 'commits');
                }
            });

            page++;
        }
    } catch (error) {
        console.error(`Error fetching commits for ${slug}:`, error);
    }
};

// Fetch issues for a given repository and update usersMap
const fetchIssues = async (octokit, slug, usersMap) => {
    let page = 1;
    try {
        while (true) {
            const { data } = await octokit.rest.issues.listForRepo({
                owner: slug.split('/')[0], // Extract owner from slug
                repo: slug.split('/')[1],  // Extract repo from slug
                per_page: 100,
                page,
            });

            if (data.length === 0) break; // Exit if no more issues
            data.forEach((issue) => updateUserMap(usersMap, issue.user, 'issues'));

            page++;
        }
    } catch (error) {
        console.error(`Error fetching issues for ${slug}:`, error);
    }
};

// Helper function to update the user statistics in usersMap
const updateUserMap = (usersMap, user, type) => {
    const username = user.login;
    if (!usersMap[username]) {
        usersMap[username] = {
            userId: user.id,
            totalCommits: 0,
            totalPullRequests: 0,
            totalIssues: 0,
        };
    }

    if (type === 'commits') {
        usersMap[username].totalCommits++;
    } else if (type === 'pullRequests') {
        usersMap[username].totalPullRequests++;
    } else if (type === 'issues') {
        usersMap[username].totalIssues++;
    }
};