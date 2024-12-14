import mongoose from 'mongoose';

const PullRequestSchema = new mongoose.Schema({
    pullRequestId: { type: Number, unique: true },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-repository' },
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-integration' },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
    pull: {
        type: Object
    },
});

PullRequestSchema.index({ '$**': 'text' });

export default mongoose.model('github-pull-request', PullRequestSchema);