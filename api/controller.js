import {refreshShifts} from '../generators/gen_shifts.js';
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

export const refresh = async (req, res) => {
  try {
    await refreshShifts();
    res.status(200).json({response: 'Successfully refreshed shifts'});
  } catch (error) {
    throw error;
  }
};

export const populate = async (req, res) => {
  try {
    await populateShifts();
    res.status(200).json({response: 'Successfully populated shifts'});
  } catch (error) {
    throw error;
  }
};
