import mongoose from 'mongoose';
import {convertDate} from '../utils/helpers.js';
import moment from 'moment';

import Shift from '../models/Shift.js';
import User from '../models/Users.js';
import Ward from '../models/Ward.js';
import {shiftStaff} from './gen_staff.js';
import {allocate} from './gen_allocations.js';
import {generateObs} from './gen_observations.js';

export async function refreshShifts() {
  await eraseShift();
  await createShift();
}

export async function populateShifts() {
  const development = (await User.find({'settings.developerMode': true})).map(u => u?.ward?.id);
  const wards = await Ward.find({_id: {$in: development}});

  for (let ward of wards) {
    const hour = new Date().getHours();
    const today = new Date(new Date().setHours(1, 0, 0, 0));
    const date = convertDate(hour < 8 ? moment(today).subtract(1, 'day')?.toDate() : today);
    const shift = await Shift.findOne({date, ward: ward?._id});

    await allocate(shift);
    await generateObs(shift);
  }
}

export async function eraseShift() {
  const now = new Date(convertDate(new Date()));
  const limitDate = moment(now).subtract(14, 'd').toDate();
  const shifts = await Shift.find({});
  const filteredShifts = shifts?.filter(s => new Date(s?.date)?.getTime() < limitDate?.getTime());

  for (let i = 0; i < filteredShifts.length; i++) {
    const shift = filteredShifts[i];
    await Shift.findByIdAndDelete(shift?._id);
  }
}

export async function createShift() {
  const development = (await User.find({'settings.developerMode': true})).map(u => u?.ward?.id);
  const wards = await Ward.find({_id: {$in: development}});

  for (let i = 0; i < wards.length; i++) {
    const ward = wards[i];
    const targetDate = convertDate(moment().add(7, 'd').toDate());
    const shift = (await Shift.find({date: targetDate, ward: ward?._id}))?.[0];

    if (!shift) {
      const obj = new Shift({
        ward: ward?._id,
        date: targetDate,
        staff: await shiftStaff(),
        allocations: {day: [], night: []},
        breaks: {day: [], night: []},
      });

      obj.save();
    }
  }
}

export function shiftTimes(hour = new Date().getHours()) {
  const obj = {
    early: hour > 7.5 && hour < 15,
    late: hour > 13 && hour < 20,
    day: hour > 7.5 && hour < 20,
    nine2five: hour > 9 && hour < 17,
    twilight: hour > 16,
    night: hour > 19.5 || hour < 8,
  };

  return obj;
}
