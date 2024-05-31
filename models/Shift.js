import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const alloc = new Schema({time: String, id: ObjectId}, {_id: false});

const breakTime = new Schema(
  {staff: {name: String, id: ObjectId}, startTime: Number, duration: Number},
  {_id: false}
);

const staff = new Schema(
  {name: String, id: {type: ObjectId, ref: 'Staff'}, duty: String, band: Number},
  {_id: false}
);

const shift = new Schema(
  {
    date: {type: String, required: true},
    ward: {type: ObjectId, required: true, ref: 'Ward'},
    staff: {early: [staff], late: [staff], '9to5': [staff], twilight: [staff], night: [staff]},
    allocations: {day: [alloc], night: [alloc]},
    breaks: {day: [breakTime], night: [breakTime]},
  },
  {collection: 'shifts'}
);

export default mongoose.model('Shift', shift);
