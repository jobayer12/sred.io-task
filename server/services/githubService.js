import Integration from '../models/Integration.js';
import Organization from '../models/Organization.js';
import Repository from '../models/Repository.js';
import Commit from '../models/Commit.js';
import PullRequest from '../models/PullRequest.js';
import Issue from '../models/Issue.js';
import FetchStatus from '../models/FetchStatus.js';
import { MongooseObjectId } from '../helpers/utils.js';

export const processIntegrations = async data => {
    return Integration.findOneAndUpdate(
        { username: data.username }, // Query to check if the username exists
        data,    // Data to update or insert
        { upsert: true, new: true } // Options: create if not found, return the updated document
    );
}

export const integrationFindOneById = async id => {
    return Integration.findOne({_id: id});
}

export const fetchRepositories = async (filter = {}) => {
    const filterPayload = {};
    if (filter) {
        if ('integrationId' in filter) {
            filterPayload['integrationId'] = MongooseObjectId(filter['integrationId']);
        }

        if ('id' in filter) {
            filterPayload['_id'] = MongooseObjectId(filter['id']);
        }
        if ('organizationId' in filter) {
            filterPayload['organizationId'] = MongooseObjectId(filter['organizationId']);
        }
    }
    return Repository.find(filterPayload);
}

export const fetchOrganizationsByIntegrationId = async integrationId => {
    const objectId = MongooseObjectId(integrationId);
    // Fetch organizations filtered by integrationId
    return Organization.find({ integrationId: objectId });
}

export const fetchRepositoriesByIntegrationId = async (integrationId ) => {
  const integrationObjectId = MongooseObjectId(integrationId);
  return Repository.find({ integrationId: integrationObjectId });
}

export const findRepositoryById = async _id => {
  return Repository.findOne({_id});
}

export const findCommits = async (filter = {}) => {
    try {
        const filterPayload = {};
        if ('repositoryId' in filter) {
            filterPayload['repositoryId'] = MongooseObjectId(filter.repositoryId);
        }
        return Commit.find(filterPayload);
    } catch (error) {
        throw error;
    }
}

export const findPullRequests = async (filter = {}) => {
    try {
        const filterPayload = {};
        if ('repositoryId' in filter) {
            filterPayload['repositoryId'] = MongooseObjectId(filter.repositoryId);
        }
        return PullRequest.find(filterPayload);
    } catch (error) {
        throw error;
    }
}

export const findIssues = async (filter = {}) => {
    try {
        const filterPayload = {};
        if ('repositoryId' in filter) {
            filterPayload['repositoryId'] = MongooseObjectId(filter.repositoryId);
        }
        return Issue.find(filterPayload);
    } catch (error) {
        throw error;
    }
}

export const findRepositoryActivies = async repositoryId => {
    const repositoryActivityMap = {};
    try {
        const commits = await findCommits({repositoryId});
        // Aggregate commits by user
        commits.filter(commit => commit && commit.commit && commit.commit.author).forEach(commit => {
            const username = commit.commit.author.login;
            if (!repositoryActivityMap[username]) {
                repositoryActivityMap[username] = { userId: commit.commit.author?.id || null, user: username, totalCommits: 0, totalPullRequests: 0, totalIssues: 0 };
            }
            repositoryActivityMap[username].totalCommits++;
        });

    } catch (error) {
        console.log('Failed to load commits due to: ', error);
    }

    try {
        const issues = await findIssues({repositoryId});
        // Aggregate issues by user
        issues.forEach(issue => {
            const username = issue.issue.user?.login || 'Unknown';
            if (!repositoryActivityMap[username]) {
                repositoryActivityMap[username] = { userId: issue.issue.user?.id || null, user: username, totalCommits: 0, totalPullRequests: 0, totalIssues: 0 };
            }
            repositoryActivityMap[username].totalIssues++;
        });
    } catch (error) {
        console.log('Failed to load issues due to : ', error);
    }

    try {
        const pullRequests = await findPullRequests({repositoryId});
        // Aggregate pull requests by user
        pullRequests.forEach(pr => {
            const username = pr.user?.login || 'Unknown';
            if (!repositoryActivityMap[username]) {
                repositoryActivityMap[username] = { userId: pr.pull.user?.id || null, user: username, totalCommits: 0, totalPullRequests: 0, totalIssues: 0 };
            }
            repositoryActivityMap[username].totalPullRequests++;
        });
    } catch (error) {
        console.log('Failed to load pull requests due to : ', error);
    }
    return Object.values(repositoryActivityMap);
}

export const processOrganizations = async (organizations, integrationId) => {
  try {
      await Promise.all(organizations.map(async (org) => {
          const { id: orgId, login: name } = org;
          // Remove unnecessary fields before saving
          delete org.id;
          delete org.login;

          // Update or insert the organization into the database
          await Organization.findOneAndUpdate(
              { orgId },
              {
                  orgId,
                  name,
                  integrationId,
                  org,
              },
              { upsert: true, new: true }
          );
      }));
  } catch (error) {
      console.error('Error processing organizations:', error);
  }
};

export const processRepositories = async (repositories, orgId, integrationId) => {
  try {
      // Use Promise.all to handle DB updates in parallel
      await Promise.all(repositories.map(async (repo) => {
          const repoId = repo.id;
          const name = repo.name;

          // Remove unwanted fields from the repository data
          const { id, name: repoName, ...repoData } = repo;

          // Insert/update repository data in the database
          return Repository.findOneAndUpdate(
              { name }, // Find by name (repository name)
              {
                  repoId,
                  name,
                  link: repo.html_url,
                  slug: repo.full_name,
                  integrationId,
                  organizationId: orgId,
                  repo: repoData, // Store the repository data
              },
              { upsert: true, new: true } // Upsert if not found, return the updated document
          );
      }));
  } catch (error) {
      console.error('Error processing repositories:', error);
  }
};

export const processCommits = async (commits, integrationId, repositoryId) => {
    try {
        // Use Promise.all to handle DB updates in parallel
        await Promise.all(
            commits.map(async (commit) => {
                try {
                    // Insert/update repository data in the database
                    return await Commit.findOneAndUpdate(
                        { sha: commit.sha }, // Find by SHA (unique identifier for commits)
                        {
                            commit,
                            integrationId,
                            repositoryId,
                        },
                        { upsert: true, new: true } // Upsert if not found, return the updated document
                    );
                } catch (error) {
                    console.error(`Error processing commit with SHA ${commit.sha}:`, error);
                }
            })
        );
    } catch (error) {
        console.error('Error processing commits:', error);
    }
};

export const processPullRequests = async (pulls, integrationId, repositoryId) => {
    try {
        // Use Promise.all to handle DB updates in parallel
        await Promise.all(
            pulls.map(async (pull) => {
                try {
                    // Insert/update repository data in the database
                    return await PullRequest.findOneAndUpdate(
                        { pullRequestId: pull.id }, // Find by pullRequestId (pull request id)
                        {
                            pull,
                            integrationId,
                            repositoryId,
                        },
                        { upsert: true, new: true } // Upsert if not found, return the updated document
                    );
                } catch (error) {
                    console.error(`Error processing pull request with ID ${pull.id}:`, error);
                }
            })
        );
    } catch (error) {
        console.error('Error processing pull requests:', error);
    }
};

export const processIssues = async (issues, integrationId, repositoryId) => {
    try {
        // Use Promise.all to handle DB updates in parallel
        await Promise.all(
            issues.map(async (issue) => {
                try {
                    // Insert/update repository data in the database
                    return await Issue.findOneAndUpdate(
                        { issueId: issue.id }, // Find by issueId (unique identifier for issues)
                        {
                            issue,
                            integrationId,
                            repositoryId,
                        },
                        { upsert: true, new: true } // Upsert if not found, return the updated document
                    );
                } catch (error) {
                    console.error(`Error processing issue with ID ${issue.id}:`, error);
                }
            })
        );
    } catch (error) {
        console.error('Error processing issues:', error);
    }
};

export const processGithubFetchStatus = async (fetchStatus, objectId, type) => {
    try {
        await FetchStatus.create()
    } catch (error) {
        
    }
}

// Function to create or insert a new status
export const createFetchStatus = async (data) => {
    try {
        const fetchStatus = new FetchStatus(data);
        const result = await fetchStatus.save();
        return result;
    } catch (error) {
        console.error('Error creating fetch status:', error);
        return null;
    }
};

// Function to fetch all records or by a specific filter
export const getFetchStatuses = async (filter = {}) => {
    try {
        const fetchStatuses = await FetchStatus.find(filter);
        return fetchStatuses;
    } catch (error) {
        console.error('Error fetching statuses:', error);
        return null;
    }
};

// Function to update a status by `objectId`
export const updateFetchStatus = async (objectId, type, status) => {
    try {
        const updatedStatus = await FetchStatus.findOneAndUpdate(
            { objectId, type, status }, // Filter by `objectId`
            {
                status: 'COMPLETED'
            },   // Data to update
            { new: true } // Return the updated document
        );
        return updatedStatus;
    } catch (error) {
        console.error('Error updating fetch status:', error);
        return null;
    }
};

// Function to delete a status by `objectId`
export const deleteFetchStatus = async (objectId, type) => {
    try {
        const result = await FetchStatus.deleteOne({ objectId, type });
        return true;
    } catch (error) {
        console.error('Error deleting fetch status:', error);
        return false;
    }
};