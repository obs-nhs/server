import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const wardSchema = new Schema(
  {name: {type: String}, id: {type: Schema.Types.ObjectId, ref: 'Ward'}},
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
