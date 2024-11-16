const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

module.exports = mongoose.model('github-integration', IntegrationSchema);