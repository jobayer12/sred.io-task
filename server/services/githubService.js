const Integration = require('../models/Integration');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');
const Repository = require('../models/Repository');
const RepositoryDetails = require('../models/RepositoryDetails');

exports.integrationFindOneAndUpdate = async data => {
    return Integration.findOneAndUpdate(
        { username: data.username }, // Query to check if the username exists
        data,    // Data to update or insert
        { upsert: true, new: true } // Options: create if not found, return the updated document
    );
}

exports.integrationFindOneById = async id => {
    return Integration.findOne({_id: id});
}

exports.fetchOrganizationsByIntegrationId = async integrationId => {
    const objectId = new mongoose.Types.ObjectId(integrationId);
    // Fetch organizations filtered by integrationId
    return Organization.find({ integrationId: objectId });
}

exports.fetchRepositoriesByIntegrationId = async (integrationId ) => {
  const integrationObjectId = new mongoose.Types.ObjectId(integrationId);
  // Fetch Repositories filtered by integrationId
  return Repository.find({ integrationId: integrationObjectId });
}

exports.findRepositoryById = async _id => {
  // Fetch Repositories filtered by _id
  return Repository.findOne({_id});
}

exports.findRepositoryDetailList = async repositoryId => {
  const repositoryIdObjectId = new mongoose.Types.ObjectId(repositoryId);
  // Fetch RepositoryDetails filtered by repositoryId
  return RepositoryDetails.find({repositoryId: repositoryIdObjectId});
}