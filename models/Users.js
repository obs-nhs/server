import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const user = new Schema(
  {
    name: String,
    userId: ObjectId,
    ward: {id: {type: ObjectId}, name: String},
    hospital: {id: {type: ObjectId}, name: String},
    settings: {},
  },
  {strict: false, collection: 'users'}
);

export default mongoose.model('User', user);
