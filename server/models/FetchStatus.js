import mongoose from "mongoose";

const { Schema } = mongoose;
const FetchStatusSchema = new Schema({
    objectId: {type: String, require: true},
    status: {
        type: String,
        enum: ['STARTED', 'COMPLETED'],
        default: 'STARTED'
    },
    type: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp
    },
});

export default mongoose.model('github-fetch-status', FetchStatusSchema);