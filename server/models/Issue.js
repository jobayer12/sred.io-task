import mongoose from 'mongoose';

const IssueSchema = new mongoose.Schema({
    issueId: { type: Number, unique: true },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-repository' },
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-integration' },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
    issue: {
       type: Object,
    }
});

IssueSchema.index({ '$**': 'text' });

export default mongoose.model('github-issue', IssueSchema);