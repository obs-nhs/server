import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const wardSchema = new Schema(
  {name: {type: String}, id: {type: ObjectId, ref: 'Ward'}},
  {_id: false}
);

const hospital = new Schema(
  {
    name: {type: String, required: true},
    location: {
      area: {type: String, required: true},
      address: {type: String, required: true},
      postcode: {type: String, required: true},
      contact: {type: String, required: true},
    },

    wards: [wardSchema],
  },
  {collection: 'hospitals'}
);

export default mongoose.model('Hospital', hospital);
