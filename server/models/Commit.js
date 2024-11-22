import mongoose from 'mongoose';

const CommitSchema = new mongoose.Schema({
    sha: { type: String, unique: true },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-repository' },
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-integration' },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
    commit: Object
});

export default mongoose.model('github-commit', CommitSchema);