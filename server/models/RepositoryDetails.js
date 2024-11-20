const mongoose = require('mongoose');

const RepositoryDetailSchema = new mongoose.Schema({
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-repository'},
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-integration' },
    totalCommits: { type: Number },
    totalIssues: { type: Number },
    totalPullRequests: { type: Number },
    user: { type: String },
    userId: { type: Number},
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
    updatedAt: {
        type: Date,
        require: false
    }
});

module.exports = mongoose.model('github-repository-detail', RepositoryDetailSchema);