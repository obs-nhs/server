import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const staff = new Schema(
  {_id: {type: ObjectId, required: true, ref: 'Staff'}, name: {type: String, required: true}},
  {_id: false}
);

const advanced = new Schema(
  {
    staff: [staff],
    patient: {type: ObjectId, ref: 'Staff', required: true},
    obsCode: {type: Number, required: true},
  },
  {_id: false}
);

const allocation = new Schema(
  {
    date: {type: String, required: true},
    ward: {type: ObjectId, required: true, ref: 'Ward'},
    timeId: {type: String, required: true},
    staff,
    advanced: [advanced],
  },
  {collection: 'allocations'}
);

export default mongoose.model('Allocation', allocation);
