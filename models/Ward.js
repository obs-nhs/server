import mongoose from 'mongoose';
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const patient = new Schema(
  {name: String, obsCode: Number, id: {type: ObjectId, ref: 'Patient'}},
  {_id: false}
);

const bedStatus = new Schema(
  {
    bed: {type: Number, required: true},
    status: {type: String, required: true},
    patientId: {type: ObjectId, ref: 'Patient'},
  },
  {_id: false}
);

const label = new Schema({
  location: {type: String, required: true},
  code: {type: String, required: true},
  engagement: [{type: String}],
});

const ward = new Schema(
  {
    name: {type: String, required: true},
    hospital: {type: ObjectId, ref: 'Hospital', required: true},
    beds: {type: Number, required: true},
    ageGroup: {type: String, required: true},
    gender: {type: String, required: true},
    patients: [patient],
    bedStatus: [bedStatus],
    labels: [label],
  },
  {collection: 'wards'}
);

export default mongoose.model('Ward', ward);
