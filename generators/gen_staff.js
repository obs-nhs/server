import Staff from '../models/Staff.js';
import Shift from '../models/Shift.js';
import {convertDate, randomIndex} from '../utils/helpers.js';
import {shiftTimes} from './gen_shifts.js';

export async function getStaff(amount) {
  const allStaff = await Staff.find({});
  const nurses = allStaff.filter(s => s.band > 4);
  const b4s = allStaff.filter(s => s.band === 4);
  const b3s = allStaff.filter(s => s.band === 3);

  const numOfNurses = 2;
  const numOfB4s = 2;
  const numOfB3s = amount - numOfNurses - numOfB4s;

  const staff = [];

  if (amount < 4) {
    for (let i = 0; i < amount; i++) {
      const index = randomIndex(allStaff?.length);
      const staffMember = allStaff?.splice(index, 1);
      staff.push(staffMember?.[0]);
    }
  } else {
    for (let i = 0; i < numOfNurses; i++) {
      const index = randomIndex(nurses.length);
      const nurse = nurses.splice(index, 1);
      staff.push(nurse?.[0]);
    }

    for (let i = 0; i < numOfB4s; i++) {
      const index = randomIndex(b4s.length);
      const b4 = b4s.splice(index, 1);
      staff.push(b4?.[0]);
    }

    for (let i = 0; i < numOfB3s; i++) {
      const index = randomIndex(b3s.length);
      const b3 = b3s.splice(index, 1);
      staff.push(b3?.[0]);
    }
  }

  return staff;
}

export async function shiftStaff() {
  const day = await getStaff(7);
  const night = await getStaff(6);
  const early = await getStaff(1);
  const late = await getStaff(1);
  const twilight = await getStaff(1);
  const nine2five = await getStaff(1);

  const mutate = arr => {
    const array = arr.map(s => ({
      name: `${s.firstName} ${s.lastName}`,
      id: s._id,
      duty: '',
      band: s.band,
    }));

    return array;
  };

  return {
    early: mutate(day.concat(...early)),
    late: mutate(day.concat(...late)),
    '9to5': mutate(nine2five),
    twilight: mutate(twilight),
    night: mutate(night),
  };
}

export function availableStaff(shift, hour) {
  const times = shiftTimes(hour);

  const longDay = shift?.staff?.early?.filter(s => {
    const arr = shift?.staff?.late?.map(st => st?.id?.toString());
    return arr?.includes(s?.id?.toString());
  });

  const early = shift?.staff?.early?.filter(s => {
    const arr = longDay?.map(st => st?.id?.toString());
    return !arr?.includes(s?.id?.toString());
  });

  const late = shift?.staff?.late?.filter(s => {
    const arr = longDay?.map(st => st?.id?.toString());
    return !arr?.includes(s?.id?.toString());
  });

  const staff = [];

  if (times.early) staff.push(...early);
  if (times.late) staff.push(...late);
  if (times.day) staff.push(...longDay);
  if (times.night) staff.push(...shift?.staff?.night);
  if (times.twilight) staff.push(...shift?.staff?.twilight);
  if (times.nine2five) staff.push(...shift?.staff?.['9to5']);

  return {all: {...shift?.staff, early, late, longDay}, available: staff};
}
