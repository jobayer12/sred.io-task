import mongoose from 'mongoose';

export const MongooseObjectId = id => {
    return new mongoose.Types.ObjectId(id);
}