import Hospital from '../models/Hospital.js';
import {capitalize} from '../utils/helpers.js';

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    const hospName = hospitals.map(hosp => {
      const name = capitalize(hosp.name);
      const wards = hosp.wards.map(ward => capitalize(ward.name));
      return {name, wards};
    });

    res.status(200).json(hospName);
  } catch (error) {
    throw error;
  }
};
