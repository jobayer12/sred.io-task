import Integration from '../models/Integration.js';
import Organization from '../models/Organization.js';
import mongoose from 'mongoose';
import Repository from '../models/Repository.js';
import RepositoryDetails from '../models/RepositoryDetails.js';

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

export const fetchOrganizationsByIntegrationId = async integrationId => {
    const objectId = new mongoose.Types.ObjectId(integrationId);
    // Fetch organizations filtered by integrationId
    return Organization.find({ integrationId: objectId });
}

export const fetchRepositoriesByIntegrationId = async (integrationId ) => {
  const integrationObjectId = new mongoose.Types.ObjectId(integrationId);
  return Repository.find({ integrationId: integrationObjectId });
}

export const findRepositoryById = async _id => {
  return Repository.findOne({_id});
}

export const findRepositoryDetailList = async repositoryId => {
  const repositoryIdObjectId = new mongoose.Types.ObjectId(repositoryId);
  return RepositoryDetails.find({repositoryId: repositoryIdObjectId});
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

// New function to handle the database update for RepositoryDetails
export const processRepositoryDetails = async (user, integrationId, repositoryId) => {
  try {
      await RepositoryDetails.findOneAndUpdate(
          { userId: user.userId, repositoryId },
          { repositoryId, integrationId, ...user },
          { upsert: true, new: true }
      );
  } catch (error) {
      console.error('Error processing repository details for user:', user.userId, error);
  }
};