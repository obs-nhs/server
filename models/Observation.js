import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const staff = new Schema({id: {type: ObjectId, ref: 'Staff'}, name: String}, {_id: false});

const observation = new Schema(
  {
    date: {type: String, required: true},
    ward: {type: ObjectId, required: true, ref: 'Ward'},
    patient: {type: ObjectId, ref: 'Patient', required: true},
    staff: [staff],
    timeId: {type: String, required: true},
    timeIdInt: String,
    timeStamp: String,
    obs: {record: {type: String, required: true}, code: String},
    obsType: {type: String, required: true},
    obsCode: {type: Number, required: true},
  },
  {collection: 'observations'}
);

export default mongoose.model('Observation', observation);
