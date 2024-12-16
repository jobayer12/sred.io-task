import mongoose from 'mongoose';

const { Schema } = mongoose;

const IntegrationSchema = new Schema({
    user: Object,
    username: {
        type: String,
        required: true,
        unique: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
});
IntegrationSchema.index({ '$**': 'text' });
// Export the model
export default mongoose.model('github-integration', IntegrationSchema);