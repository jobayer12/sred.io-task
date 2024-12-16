import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
    orgId: { type: Number, unique: true },
    name: { type: String, required: true },
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'github-integration' },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
    org: Object,
});
OrganizationSchema.index({ '$**': 'text' });
export default mongoose.model('github-organization', OrganizationSchema);