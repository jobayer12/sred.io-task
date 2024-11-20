const axios = require('axios');
const Organization = require('../models/Organization');
const Repository = require('../models/Repository');
const RepositoryDetails = require('../models/RepositoryDetails');


exports.githubAccessToken = async code => {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = response.data;
    return access_token;
}

exports.githubUserInfomation = async accessToken => {
    return axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
}

exports.fetchOrganizations = async (accessToken, id) => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const organizationList = [];
    try {
        let page = 1;
        while (true) {
            const response = await axios.get(`https://api.github.com/user/orgs`, {
              headers,
              params: { per_page: 100, page },
            });
      
            const organizations = response.data;
            organizationList.push(...organizations);
    
            try {
                await Promise.all(
                    organizations.map(async (org) => {
                        const orgId = org.id;
                        const name = org.login;
                        delete org.id;
                        delete org.login;
                        return Organization.findOneAndUpdate(
                            { orgId: orgId },
                            {
                                orgId: orgId,
                                name,
                                integrationId: id,
                                org
                            },
                            { upsert: true, new: true }
                        )
                    })
                );
            } catch (error) {
                console.log('Failed to insert org data into database');
            }
            
            // Exit loop if no more pull organizations
            if (organizations.length === 0) break;
      
            page++;
          }
          return organizationList;
        
    } catch (error) {
        console.log('error: ', error);
        return organizationList;
    }
}

exports.fetchRepositories = async (accessToken, integrationId, organizations) => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const repoList = [];
    for (const org of organizations) {
        try {
            let page = 1;
            while (true) {
                const response = await axios.get(`https://api.github.com/orgs/${org.name}/repos`, {
                    headers,
                    params: { per_page: 100, page },
                  });
                  const repositories = response.data;
                  repoList.push(...repositories);
                  try {
                    await Promise.all(
                        repositories.map(async (repo) => {
                            const repoId = repo.id;
                            const name = repo.name;
                            delete repo.id;
                            delete repo.name;
                            return Repository.findOneAndUpdate(
                                { name },
                                {
                                    repoId: repoId,
                                    name,
                                    link: repo.html_url,
                                    slug: repo.full_name,
                                    integrationId: integrationId,
                                    organizationId: org._id,
                                    repo
                                },
                                { upsert: true, new: true }
                            )
                        })
                    );
                  } catch (error) {
                    console.log('error: ', error);
                  }
                if (repositories.length === 0) break;
                page++;
            }
        } catch (error) {
            console.error('error: ', error);
        }
        return repoList;
    }
}

exports.fetchContributor = async (slug, integrationId, repositoryId, accessToken) => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const usersMap = {};

    try {
        let page = 1;
        while (true) {
            const response = await axios.get(`https://api.github.com/repos/${slug}/pulls`, {
              headers,
              params: { state: 'open', per_page: 100, page },
            });
      
            const pullRequests = response.data;
            // Count pull requests by user
            pullRequests.forEach((pr) => {
              const username = pr.user.login;
              if (usersMap[username]) {
                usersMap[username]['totalPullRequests']++;
              } else {
                usersMap[username] = {
                    userId: pr.user.id,
                    totalCommits: 0,
                    totalPullRequests: 1,
                    totalIssues: 0
                };
              }
            });
            // Exit loop if no more pull requests
            if (pullRequests.length === 0) break;
            page++;
          }
        
    } catch (error) {
        console.log('error: ', error);
    }

    try {
        let page = 1;
        while (true) {
            const results = await axios.get(`https://api.github.com/repos/${slug}/commits`, {
              headers,
              params: { per_page: 100, page },
            });
      
            const commits = results.data;
            commits.filter(commit => commit && commit.author && commit.author.login).forEach(commit => {
                const username = commit.author.login;
                if (usersMap[username]) {
                    usersMap[username]['totalCommits']++;
                  } else {
                    usersMap[username] = {
                        userId: commit.author.id,
                        totalCommits: 1,
                        totalPullRequests: 0,
                        totalIssues: 0
                    };
                  }
            });
            // Exit loop if no more data
            if (commits.length === 0) break;
            page++;
          }
    } catch (error) {
        console.log('error: ', error);
    }

    try {
        let page = 1;
        while (true) {
            const results = await axios.get(`https://api.github.com/repos/${slug}/issues`, {
              headers,
              params: { per_page: 100, page },
            });
      
            const issues = results.data;
            issues.forEach((pr) => {
                const username = pr.user.login;
                if (usersMap[username]) {
                  usersMap[username]['totalIssues']++;
                } else {
                  usersMap[username] = {
                      userId: pr.user.id,
                      totalCommits: 0,
                      totalPullRequests: 0,
                      totalIssues: 1
                  };
                }
              });
            // Exit loop if no more data
            if (issues.length === 0) break;
            page++;
          }
    } catch (error) {
        console.log('error: ', error);
    }

    const usersWithOtherDetails = Object.keys(usersMap).map(user => {
        return {
            user: user,
            ...usersMap[user]
        }
    });

    if (usersWithOtherDetails.length > 0) {
        try {
            await Promise.all(
                usersWithOtherDetails.map(async (user) => {
                    return RepositoryDetails.findOneAndUpdate(
                        { userId: user.userId, repositoryId: repositoryId },
                        {
                            repositoryId: repositoryId,
                            integrationId: integrationId,
                            ...user
                        },
                        { upsert: true, new: true }
                    )
                })
            );
          } catch (error) {
            console.log('error: ', error);
          }
    }
    return RepositoryDetails.find({repositoryId: repositoryId});
}