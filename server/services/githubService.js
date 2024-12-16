import Integration from '../models/Integration.js';
import Organization from '../models/Organization.js';
import Repository from '../models/Repository.js';
import Commit from '../models/Commit.js';
import PullRequest from '../models/PullRequest.js';
import Issue from '../models/Issue.js';
import { MongooseObjectId, FormatColumnFilter } from '../helpers/utils.js';

export const processIntegrations = async data => {
    return Integration.findOneAndUpdate(
        { username: data.username }, // Query to check if the username exists
        data,    // Data to update or insert
        { upsert: true, new: true } // Options: create if not found, return the updated document
    );
}

export const integrationFindOneById = async id => {
    return Integration.findOne({ _id: id });
}

export const fetchIntegrationList = async () => {
    return await Integration.find();
}

export const formatRepositoryFilterParams = (filter = {}) => {
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

        // Dynamic search across all fields
        if ('search' in filter && filter.search) {
            // Step 1: Fetch all field names dynamically
            filterPayload['$text'] = { $search: `"${filter.search.trim()}"`  };
        }

        if ('columnFilters' in filter && Array.isArray(filter.columnFilters) && filter.columnFilters.length > 0) {
            filter.columnFilters.forEach(filter => {
                const { type, key, value } = filter;
          
                // Format the filter condition using the separate function
                const formattedCondition = FormatColumnFilter(filter.filterType, key, type, value);
                if (formattedCondition) {
                    filterPayload[key] = formattedCondition;
                }
            });
        }
    }
    return filterPayload;
}

export const countRepositories = async (filter = {}) => {
    return await Repository.countDocuments(formatRepositoryFilterParams(filter));
}

export const fetchRepositories = async (filter = {}, pagination = {}) => {
    const pipeline = [
        { $match: formatRepositoryFilterParams(filter) }, // Filtering stage
    ];

    // Add pagination stages only if page and limit are provided
    if ('page' in pagination && 'limit' in pagination) {
        const page = parseInt(pagination.page, 10) || 0; // Default to page 0
        const limit = parseInt(pagination.limit, 10) || 100; // Default to 100 items per page
        const skip = (page - 1) * limit;

        pipeline.push({ $skip: skip }); // Add skip stage
        pipeline.push({ $limit: limit }); // Add limit stage
    }
    // Execute the aggregation pipeline
    return await Repository.aggregate(pipeline).exec();
}

export const fetchOrganizationsByIntegrationId = async integrationId => {
    const objectId = MongooseObjectId(integrationId);
    // Fetch organizations filtered by integrationId
    return Organization.find({ integrationId: objectId });
}

export const fetchIntegrations = async (limit, page) => {
    const skip = limit * page;
    return Integration.find({}, { token: 0 }).limit(limit).skip(skip);
}

export const fetchRepositoriesByIntegrationId = async (integrationId, limit, page) => {
    const skip = limit * page;
    const integrationObjectId = MongooseObjectId(integrationId);
    return Repository.find({ integrationId: integrationObjectId }).limit(limit).skip(skip);
}

export const findRepositoryById = async _id => {
    return Repository.findOne({ _id });
}

const formatCommitFilterParams = (filter = {}) => {
    const filterPayload = {};
    if (filter) {
        if ('integrationId' in filter) {
            filterPayload['integrationId'] = MongooseObjectId(filter['integrationId']);
        }

        if ('id' in filter) {
            filterPayload['_id'] = MongooseObjectId(filter['id']);
        }
        if ('repositoryId' in filter) {
            filterPayload['repositoryId'] = MongooseObjectId(filter['repositoryId']);
        }

        // Dynamic search across all fields
        if ('search' in filter && filter.search) {
            // Step 1: Fetch all field names dynamically
            filterPayload['$text'] = { $search: `"${filter.search.trim()}"`  };
        }

        if ('columnFilters' in filter && Array.isArray(filter.columnFilters) && filter.columnFilters.length > 0) {
            filter.columnFilters.forEach(filter => {
                const { type, key, value } = filter;
                console.log('filter: ', filter);
          
                // Format the filter condition using the separate function
                const formattedCondition = FormatColumnFilter(filter.filterType, key, type, value);
                if (formattedCondition) {
                    filterPayload[key] = formattedCondition;
                }
            });
        }
    }
    return filterPayload;
}

export const countCommits = async (filter = {}) => {
    try {
        // Get the total count for pagination metadata
        return Commit.countDocuments(formatCommitFilterParams(filter));
    } catch (error) {
        throw error;
    }
}

export const findCommits = async (filter = {}, pagination = {}) => {
    try {
        const pipeline = [
            { $match: formatCommitFilterParams(filter) }, // Filtering stage
        ];

        // Add pagination stages only if page and limit are provided
        if ('page' in pagination && 'limit' in pagination) {
            const page = parseInt(pagination.page, 10) || 0; // Default to page 0
            const limit = parseInt(pagination.limit, 10) || 100; // Default to 100 items per page
            const skip = (page - 1) * limit;

            pipeline.push({ $skip: skip }); // Add skip stage
            pipeline.push({ $limit: limit }); // Add limit stage
        }

        return await Commit.aggregate(pipeline).exec();
    } catch (error) {
        throw error;
    }
}


export const formatPullRequestFilterParams = (filter = {}) => {
    const filterPayload = {};
    if (filter) {
        if ('integrationId' in filter) {
            filterPayload['integrationId'] = MongooseObjectId(filter['integrationId']);
        }

        if ('id' in filter) {
            filterPayload['_id'] = MongooseObjectId(filter['id']);
        }
        if ('repositoryId' in filter) {
            filterPayload['repositoryId'] = MongooseObjectId(filter['repositoryId']);
        }

        // Dynamic search across all fields
        if ('search' in filter && filter.search) {
            filterPayload['$text'] = { $search: `"${filter.search.trim()}"`  };
        }

        if ('columnFilters' in filter && Array.isArray(filter.columnFilters) && filter.columnFilters.length > 0) {
            filter.columnFilters.forEach(filter => {
                const { type, key, value } = filter;
          
                // Format the filter condition using the separate function
                const formattedCondition = FormatColumnFilter(filter.filterType, key, type, value);
                if (formattedCondition) {
                    filterPayload[key] = formattedCondition;
                }
            });
        }

    }
    return filterPayload;
}

export const countPullRequests = async (filter = {}) => {
    try {
        // Get the total count for pagination metadata
        return PullRequest.countDocuments(formatPullRequestFilterParams(filter));
    } catch (error) {
        throw error;
    }
}

export const findPullRequests = async (filter = {}, pagination = {}) => {
    try {
        const pipeline = [
            { $match: formatPullRequestFilterParams(filter) }, // Filtering stage
        ];

        // Add pagination stages only if page and limit are provided
        if ('page' in pagination && 'limit' in pagination) {
            const page = parseInt(pagination.page, 10) || 0; // Default to page 0
            const limit = parseInt(pagination.limit, 10) || 100; // Default to 100 items per page
            const skip = (page - 1) * limit;

            pipeline.push({ $skip: skip }); // Add skip stage
            pipeline.push({ $limit: limit }); // Add limit stage
        }

        // Execute the aggregation pipeline
        return await PullRequest.aggregate(pipeline).exec();
    } catch (error) {
        throw error;
    }
}

export const formatIssueFilterParams = (filter = {}) => {
    const filterPayload = {};
    if (filter) {
        if ('integrationId' in filter) {
            filterPayload['integrationId'] = MongooseObjectId(filter['integrationId']);
        }

        if ('id' in filter) {
            filterPayload['_id'] = MongooseObjectId(filter['id']);
        }
        if ('repositoryId' in filter) {
            filterPayload['repositoryId'] = MongooseObjectId(filter['repositoryId']);
        }

        // Dynamic search across all fields
        if ('search' in filter && filter.search) {
            filterPayload['$text'] = { $search: `"${filter.search.trim()}"`  };
        }

        if ('columnFilters' in filter && Array.isArray(filter.columnFilters) && filter.columnFilters.length > 0) {
            filter.columnFilters.forEach(filter => {
                const { type, key, value } = filter;
          
                // Format the filter condition using the separate function
                const formattedCondition = FormatColumnFilter(filter.filterType, key, type, value);
                if (formattedCondition) {
                    filterPayload[key] = formattedCondition;
                }
            });
        }
    }
    return filterPayload;
}

export const countIssues = async (filter = {}) => {
    try {

        // Get the total count for pagination metadata
        return Issue.countDocuments(formatIssueFilterParams(filter));
    } catch (error) {
        throw error;
    }
}

export const findIssues = async (filter = {}, pagination = {}) => {
    try {
        const pipeline = [
            { $match: formatIssueFilterParams(filter) }, // Filtering stage
        ];

        // Add pagination stages only if page and limit are provided
        if ('page' in pagination && 'limit' in pagination) {
            const page = parseInt(pagination.page, 10) || 0; // Default to page 0
            const limit = parseInt(pagination.limit, 10) || 100; // Default to 100 items per page
            const skip = (page - 1) * limit;

            pipeline.push({ $skip: skip }); // Add skip stage
            pipeline.push({ $limit: limit }); // Add limit stage
        }

        // Execute the aggregation pipeline
        return await Issue.aggregate(pipeline).exec();
    } catch (error) {
        throw error;
    }
}

export const findRepositoryActivies = async repositoryId => {
    const repositoryActivityMap = {};
    try {
        const commits = await findCommits({ repositoryId });
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
        const issues = await findIssues({ repositoryId });
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
        const pullRequests = await findPullRequests({ repositoryId });
        // Aggregate pull requests by user
        pullRequests.forEach(pr => {
            const username = pr.pull.user?.login || 'Unknown';
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

const sanitizeRepositoryObject = (payload) => {
    if (!payload || typeof payload !== 'object') return payload;

    const sanitized = { ...payload };
    if (sanitized.language) {
        sanitized.language_field = sanitized.language
    }
    // Remove problematic fields
    delete sanitized.language_override;
    delete sanitized.$text;
    delete sanitized.language; // If this field is present and causes issues

    return sanitized;
};

export const processRepositories = async (repositories, orgId, integrationId) => {
    try {
        // Use Promise.all to handle DB updates in parallel
        await Promise.all(repositories.map(async (repo) => {
            const payload = {
                repoId: repo.id,
                name: repo.name,
                link: repo.html_url,
                slug: repo.full_name,
                integrationId,
                organizationId: orgId,
                repo: sanitizeRepositoryObject(repo),
            }

            // Insert/update repository data in the database
            return Repository.findOneAndUpdate(
                { repoId: payload.repoId }, // Find by repoId (repository id)
                payload,
                { upsert: true, new: true, strict: false } // Upsert if not found, return the updated document
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
                            commit: commit,
                            integrationId,
                            repositoryId,
                        },
                        { upsert: true, new: true, strict: false } // Upsert if not found, return the updated document
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

const sanitizePullRequestObject = (payload) => {
    if (!payload || typeof payload !== 'object') return payload;

    const sanitized = { ...payload };
    if (sanitized.head.repo.language) {        
        sanitized.head.repo.language_field = sanitized.head.repo.language
    }
    if (sanitized.base.repo.language) {        
        sanitized.base.repo.language_field = sanitized.base.repo.language
    }
    // Remove problematic fields
    
    delete sanitized.base.repo.language; // If this field is present and causes issues
    delete sanitized.head.repo.language
    return sanitized;
};

export const processPullRequests = async (pulls, integrationId, repositoryId) => {
    try {
        // Use Promise.all to handle DB updates in parallel
        await Promise.all(
            pulls.map(async (pull) => {
                
                try {

                    const payload = {
                        integrationId,
                        repositoryId,
                        pull: sanitizePullRequestObject(pull),
                    }

                    // Insert/update repository data in the database
                    return await PullRequest.findOneAndUpdate(
                        { pullRequestId: pull.id }, // Find by pullRequestId (pull request id)
                        payload,
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
                            issue: issue,
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