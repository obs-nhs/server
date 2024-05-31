import mongoose from 'mongoose';
const {Schema} = mongoose;

const staff = new Schema(
  {
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    band: {type: Number, required: true},
    position: {type: String, required: true},
    rioNumber: {type: Number, required: true},
    pin: {type: String, required: true},
  },
  {collection: 'staff'}
);

export default mongoose.model('Staff', staff);
