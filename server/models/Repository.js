import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema({
    repoId: { type: String, unique: true },
    name: { type: String, required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-organization' },
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-integration' },
    link: { type: String, required: true },
    slug: { type: String, required: true },
    repo: Object,
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
    updatedAt: {
        type: Date,
        require: false
    }
});

RepositorySchema.index({ '$**': 'text' });

export default mongoose.model('github-repository', RepositorySchema);