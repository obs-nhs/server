import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const vital = new Schema(
  {
    patient: {type: ObjectId, ref: 'Patient'},
    ward: {type: ObjectId, ref: 'Ward', required: true},
    date: {type: String, required: true},
    time: {type: String, required: true},
    bp: {upper: Number, lower: Number},
    pulse: Number,
    spo2: Number,
    temp: Number,
    resp: Number,
    weight: Number,
    height: Number,
    bm: Number,
    covid: Boolean,
  },
  {collection: 'vitals'}
);

export default mongoose.model('Vitals', vital);
