import {pad, randomIndex} from '../utils/helpers.js';
import {shiftTimes} from './gen_shifts.js';
import {availableStaff} from './gen_staff.js';

import User from '../models/Users.js';
import Shift from '../models/Shift.js';
import Allocation from '../models/Allocation.js';
import Ward from '../models/Ward.js';

export async function allocate(shift) {
  await allocateRoles(shift);
  await allocateBreaks(shift);
  await allocateStaff(shift);
}

export async function allocateRoles(shift) {
  const hour = new Date().getHours();
  const checkHour = hour < 8 ? hour + 24 : hour;
  const shiftTimes = (await User.findOne({'ward.id': shift?.ward}))?.settings?.shiftTimes;

  const sortStaff = arr => {
    const nurses = arr?.filter(s => s?.band > 4);
    const sts = arr?.filter(s => s?.band < 5);
    return {nurses, sts, all: arr};
  };

  const checkRoles = arr => {
    const coordinator = arr?.filter(s => s?.duty === 'coordinator')?.[0];
    const medication = arr?.filter(s => s?.duty === 'medication')?.[0];
    const response = arr?.filter(s => s?.duty === 'response')?.[0];
    return {coordinator, medication, response};
  };

  const allocate = async shiftName => {
    const staff = [...(shift?.staff?.[shiftName] || [])];
    const {nurses, sts} = sortStaff(staff);
    const roles = checkRoles(staff);

    const index = {coor: undefined, meds: undefined, resp: undefined};

    if (!roles?.coordinator) {
      const id = nurses?.splice(randomIndex(nurses?.length), 1)?.[0]?.id;
      index.coor = staff?.findIndex(s => s?.id?.toString() === id?.toString());
    }

    if (!roles?.medication) {
      const id = nurses?.splice(randomIndex(nurses?.length), 1)?.[0]?.id;
      index.meds = staff?.findIndex(s => s?.id?.toString() === id?.toString());
    }

    if (!roles?.response) {
      const id = sts?.splice(randomIndex(sts?.length), 1)?.[0]?.id;
      index.resp = staff?.findIndex(s => s?.id?.toString() === id?.toString());
    }

    if (index?.coor !== undefined) staff[index.coor].duty = 'coordinator';
    if (index?.meds !== undefined) staff[index.meds].duty = 'medication';
    if (index?.resp !== undefined) staff[index.resp].duty = 'response';

    if (index.coor || index.meds || index.resp) {
      const field = `staff.${shiftName}`;
      await Shift.findByIdAndUpdate(shift?._id, {[field]: staff});
    }
  };

  if (checkHour >= shiftTimes?.early?.start) allocate('early');
  if (checkHour >= shiftTimes?.late?.start) allocate('late');
  if (checkHour >= shiftTimes?.night?.start) allocate('night');
}

export async function allocateBreaks(shift) {
  const staff = availableStaff(shift);

  const breaks = {
    longDay: {start: 18, duration: 1},
    night: {start: 5, duration: 2},
    early: {start: 14.5, duration: 0.5},
    late: {start: 19.5, duration: 0.5},
    '9to5': {start: 16.5, duration: 0.5},
    twilight: {start: 23.5, duration: 0.5},
  };

  const generateBreaks = shiftName => {
    return staff?.all?.[shiftName]
      ?.filter(s => {
        const shiftTime = shiftName === 'night' || shiftName === 'twilight' ? 'night' : 'day';
        const existingBreaks = shift?.breaks?.[shiftTime];
        const arr = existingBreaks?.map(s => s?.staff?.id?.toString());
        return !arr?.includes(s?.id?.toString());
      })
      ?.map((s, i, arr) => {
        if (!s) return undefined;
        const {duration} = breaks?.[shiftName];
        const turnover = 7 * Math.floor(i / 7) * (duration > 1 ? 1 : duration);
        const factor = i * (duration > 1 && arr?.length > 4 ? 1 : duration);

        let startTime = breaks?.[shiftName]?.start - factor + turnover;
        if (s?.duty === 'medication' && startTime === 17) --startTime;
        if (startTime < 0) startTime += 24;
        if (startTime >= 24) startTime -= 24;

        const obj = {
          staff: {id: s?.id, name: s?.name},
          startTime,
          duration: breaks?.[shiftName]?.duration,
        };

        return obj;
      });
  };

  const breaksList = {
    day: ['longDay', 'early', 'late', '9to5'].flatMap(s => generateBreaks(s)),
    night: ['night', 'twilight'].flatMap(s => generateBreaks(s)),
  };

  const hour = new Date().getHours() < 8 ? new Date().getHours() + 24 : new Date().getHours();

  if (hour >= 8) {
    await Shift.findByIdAndUpdate(shift?._id, {
      'breaks.day': [...shift?.breaks?.day, ...breaksList.day],
    });
  }

  if (hour >= 20) {
    await Shift.findByIdAndUpdate(shift?._id, {
      'breaks.night': [...shift?.breaks?.night, ...breaksList.night],
    });
  }
}

export async function allocateStaff(shift) {
  const hours = Array.from(Array(24).keys()).filter(time => {
    const hour = new Date().getHours();
    const checkTime = time < 8 ? time + 24 : time;
    const checkHour = hour < 8 ? hour + 24 : hour;
    return checkTime <= checkHour;
  });

  const ward = await Ward.findById(shift?.ward);
  const advPatients = ward?.patients?.filter(p => `${p?.obsCode}`.length === 3);

  const allocations = await Allocation.find({ward: shift?.ward, date: shift.date});
  const usedStaff = allocations.flatMap(a => [
    a?.staff?._id?.toString(),
    ...a?.advanced?.flatMap(adv => adv?.staff?.flatMap(s => s?._id?.toString())),
  ]);

  for (let hour of hours) {
    const shiftName = hour > 7 && hour < 20 ? 'day' : 'night';
    const staff = populateStaff();

    function excludeBreaks(array) {
      shift?.breaks?.[shiftName]
        ?.filter(b => {
          const checkHour = hour < 8 ? hour + 24 : hour;
          const start = Math.trunc(b?.startTime);
          let end = start + b?.duration;
          if (end < start) end += 24;
          return checkHour >= start && checkHour < end;
        })
        .forEach(b => {
          const index = array?.findIndex(s => s?.id?.toString() === b?.staff?.toString());
          if (index >= 0) array?.splice(index, 1);
        });
    }

    function excludeNurses(array) {
      array?.forEach((s, i, arr) => {
        if (s?.duty === 'coordinator' && (hour === 7 || hour === 8 || hour === 19 || hour === 20))
          arr.splice(i, 1);
        if (s?.duty === 'medication' && (hour === 9 || hour === 17 || hour === 21))
          arr.splice(i, 1);
      });
    }

    function excludeOverworked(array) {
      const advObsAmount = advPatients
        ?.map(p => +`${p?.obsCode}`.slice(0, -2))
        ?.reduce((a, b) => Math.trunc(a) + Math.trunc(b));

      const totalObs = (1 + advObsAmount) * 12;
      const obsPerStaff = totalObs / array?.length;
      array.forEach((s, i, arr) => {
        const checkArr = usedStaff?.filter(a => a === s?.id?.toString());
        if (checkArr.length > obsPerStaff) arr?.splice(i, 1);
      });
    }

    function sortStaff(array) {
      const frequency = s => usedStaff?.filter(a => a === s?.id?.toString())?.length;
      array?.sort((a, b) => frequency(a) - frequency(b));
    }

    function populateStaff() {
      const array = [...availableStaff(shift, hour).available];
      excludeBreaks(array);
      excludeNurses(array);
      excludeOverworked(array);
      sortStaff(array);
      return array;
    }

    function getStaff(prevStaff) {
      if (staff?.length < 1) staff?.push(...populateStaff());
      let index = 0;

      //Skip duplicate allocations
      const previous = [prevStaff].flat(2);
      previous?.forEach(prev => {
        if (prev?._id?.toString() === staff?.[index]?.id?.toString()) {
          if (staff?.length < 2) staff.push(populateStaff(time));
          ++index;
        }
      });

      //Select Medication staff
      if (!Array.isArray(prevStaff) && (hour === 8 || hour === 20)) {
        const medsIndex = staff?.findIndex(s => s?.duty === 'medication');
        if (medsIndex > -1) index = medsIndex;
      }

      if (index > staff?.length - 1) index = 0;
      const staffMember = staff?.splice(index, 1)?.[0];
      usedStaff?.push(staffMember?.id?.toString());
      return {_id: staffMember?.id, name: staffMember?.name};
    }

    //Construct allocations
    const timeId = `${pad(hour)}00`;
    let prevTime = hour - 1 < 0 ? hour - 1 + 24 : hour - 1;

    const allocation = allocations?.filter(a => a?.timeId === timeId)?.[0];
    const prevAlloc = allocations?.filter(a => a?.timeId === `${pad(prevTime)}00`)?.[0];

    if (allocation) {
      //Allocations that exist
      if (!allocation?.staff?._id) allocation.staff = getStaff(prevAlloc?.staff);

      const advanced = allocation?.advanced
        ?.concat(
          ...advPatients?.map(p => {
            const obj = {patient: p?.id, obsCode: p?.obsCode, staff: []};
            const index = allocation?.advanced?.findIndex(
              a => a?.patient?.toString() === p?.id?.toString()
            );
            if (index < 0) return obj;
          })
        )
        .filter(adv => adv !== undefined)
        .map(adv => {
          const staffAmount = +`${adv?.obsCode}`.slice(0, -2) - adv?.staff?.length;
          const prevAdvAlloc = prevAlloc?.advanced?.filter(
            prev => prev?.patient?.toString() === adv?.patient?.toString()
          )?.[0];

          if (staffAmount > 0)
            return {
              patient: adv?.patient,
              obsCode: adv?.obsCode,
              staff: Array.from(Array(staffAmount).keys()).map((_, i) =>
                getStaff(prevAdvAlloc?.staff?.[i])
              ),
            };

          return adv;
        });

      allocation.advanced = advanced;
      await allocation.save();
    }

    if (!allocation) {
      //Allocations that dont exist
      const advanced = advPatients?.map(p => {
        const staffAmount = +`${p?.obsCode}`.slice(0, -2);
        const prevAdvAlloc = prevAlloc?.advanced?.filter(
          a => a?.patient?.toString() === p?.id?.toString()
        )?.[0];

        return {
          patient: p?.id,
          obsCode: p?.obsCode,
          staff: Array.from(Array(staffAmount).keys()).map((_, i) =>
            getStaff(prevAdvAlloc?.staff?.[i])
          ),
        };
      });

      const obj = new Allocation({
        ward: shift?.ward,
        date: shift?.date,
        timeId,
        staff: getStaff(prevAlloc?.staff),
        advanced,
      });

      const shiftName = hour > 7 && hour < 20 ? 'day' : 'night';
      const field = `allocations.${shiftName}`;
      const shiftObj = {time: obj?.timeId, id: obj?._id};

      await Shift.findByIdAndUpdate(shift?._id, {$push: {[field]: shiftObj}});
      await obj?.save();
    }
  }
}
