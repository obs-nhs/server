import mongoose from 'mongoose';
const {Schema} = mongoose;

const patient = new Schema(
  {
    general: {
      firstName: {$type: String, required: true},
      lastName: {$type: String, required: true},
      dob: {$type: String, required: true},
      gender: {$type: String, required: true},
      hospNumber: {$type: Number, required: true},
      rioNumber: {$type: Number, required: true},
      address: {street: String, postcode: String},
      outOfBorough: {$type: Boolean, required: true},
      phone: String,
      email: String,
      nextOfKin: {relationship: String, contact: String},
    },

    mha: {
      section: {$type: Number, required: true},
      diagnosis: [String],
      risk: [String],
      consultant: String,
    },

    admission: {
      hospital: {
        name: {$type: String, required: true},
        id: {$type: Schema.Types.ObjectId, ref: 'Hospital', required: true},
      },

      ward: {
        name: {$type: String, required: true},
        id: {$type: Schema.Types.ObjectId, ref: 'Ward', required: true},
      },

      date: {$type: String, required: true},
      status: {$type: String, required: true},
      leadNurse: {$type: String, required: true},
      leave: {$type: String, required: true},

      observation: {
        type: {$type: String, required: true},
        code: {$type: Number, required: true},
        level: String,
      },
    },

    transit: {
      active: {$type: Boolean, required: true},
      type: String,
      date: String,
      transferInfo: {
        from: {id: Schema.Types.ObjectId, name: String},
        to: {id: Schema.Types.ObjectId, name: String},
      },
    },
  },
  {collection: 'patients', typeKey: '$type'}
);

export default mongoose.model('Patient', patient);
