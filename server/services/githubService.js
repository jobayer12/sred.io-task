const axios = require('axios');
const Integration = require('../models/Integration');

exports.findOneAndUpdate = async data => {
    return Integration.findOneAndUpdate(
        { username: data.username }, // Query to check if the username exists
        data,    // Data to update or insert
        { upsert: true, new: true } // Options: create if not found, return the updated document
    );
}

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

exports.findOneById = async id => {
    return Integration.findOne({_id: id});
}



exports.fetchOrganizations = async accessToken => {
    const response = await axios.get('https://api.github.com/user/orgs', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
}

exports.fetchRepos = async (orgName, accessToken) => {
    const response = await axios.get(`https://api.github.com/orgs/${orgName}/repos`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
}

exports.fetchContributor = async (slug, accessToken) => {
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
      
            // Exit loop if no more pull requests
            if (pullRequests.length === 0) break;
      
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
            page++;
          }
        
    } catch (error) {
        
    }

    try {
        let page = 1;
        while (true) {
            const results = await axios.get(`https://api.github.com/repos/${slug}/contributors`, {
              headers,
              params: { per_page: 100, page },
            });
      
            const contributors = results.data;
            contributors.forEach(contributor => {
                const username = contributor.login;
                if (usersMap[username]) {
                    usersMap[username]['totalCommits'] = contributor.contributions;
                  } else {
                    usersMap[username] = {
                        userId: contributor.id,
                        totalCommits: contributor.contributions,
                        totalPullRequests: 0,
                        totalIssues: 0
                    };
                  }
            });
            // Exit loop if no more data
            if (data.length === 0) break;
            page++;
          }
    } catch (error) {
        
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
            if (data.length === 0) break;
            page++;
          }
    } catch (error) {
        
    }

    return Object.keys(usersMap).map(user => {
        return {
            user: user,
            ...usersMap[user]
        }
    });
}

const _FetchWholeData = async (url, headers) => {
    const response = [];
    let page = 1;

    

    return response;
  };