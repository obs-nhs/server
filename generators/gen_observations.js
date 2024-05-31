import Allocation from '../models/Allocation.js';
import Observation from '../models/Observation.js';
import Ward from '../models/Ward.js';
import {pad, randomTime, read, randomIndex} from '../utils/helpers.js';

const labels = read('./api/data/labels.json');
const advObs = read('./api/data/obs.json');

export async function generateObs(shift) {
  const ward = await Ward.findById(shift?.ward);
  const patients = ward?.patients;
  const intPatients = patients?.filter(p => `${p?.obsCode}`?.length === 2);

  const hours = Array.from(Array(24).keys()).filter(time => {
    const hour = new Date().getHours();
    const checkTime = time < 8 ? time + 24 : time;
    const checkHour = hour < 8 ? hour + 24 : hour;
    return checkTime < checkHour;
  });

  for (let hour of hours) {
    const timeId = `${pad(hour)}00`;
    const allocation = await Allocation.findOne({ward: shift?.ward, date: shift?.date, timeId});

    const hourly = [];
    const intermittent = [];
    const advanced = [];

    for (let patient of patients) hourly.push(await gensObj(allocation, patient));
    for (let patient of intPatients) intermittent.push(...(await intObj(allocation, patient)));
    advanced.push(...(await advObj(allocation)));

    const observations = [...hourly, ...intermittent, ...advanced]
      ?.filter(o => o !== undefined)
      .map(o => new Observation(o));

    await Observation.create(observations);
  }
}

async function gensObj(allocation, patient) {
  const hour = allocation.timeId.slice(0, 2);
  const timeStamp = randomTime(hour, 18);

  const existing = await Observation.findOne({
    date: allocation.date,
    ward: allocation.ward,
    timeId: allocation.timeId,
    patient: patient.id,
    obsType: 'hourly',
  });

  const obj = {
    date: allocation.date,
    ward: allocation.ward,
    timeId: allocation.timeId,
    timeStamp,
    patient: patient.id,
    staff: [{id: allocation?.staff?._id, name: allocation?.staff?.name}],
    obs: randomObs('gen', allocation.timeId),
    obsType: 'hourly',
    obsCode: 1,
  };

  if (!existing) return obj;
}

async function intObj(allocation, patient) {
  const obsFrequency = 60 / patient?.obsCode;
  const hour = allocation.timeId.slice(0, 2);
  const obs = [];

  for (let i = 0; i < obsFrequency; i++) {
    const record = randomObs('int', allocation.timeId);
    const maxMinutes = (60 / obsFrequency) * (i + 1) - 1;
    const minMinutes = (60 / obsFrequency) * i;
    const timeStamp = randomTime(hour, maxMinutes, minMinutes);

    const existing = await Observation.findOne({
      date: allocation.date,
      ward: allocation.ward,
      timeId: allocation.timeId,
      timeIdInt: `00${pad(minMinutes)}`,
      patient: patient.id,
      obsType: 'intermittent',
    });

    if (!existing)
      obs.push({
        date: allocation.date,
        ward: allocation.ward,
        timeId: allocation.timeId,
        timeIdInt: `00${pad(minMinutes)}`,
        timeStamp,
        patient: patient.id,
        staff: [{id: allocation?.staff?._id, name: allocation?.staff?.name}],
        obs: {record},
        obsType: 'intermittent',
        obsCode: patient?.obsCode,
      });
  }

  return obs;
}

async function advObj(allocation) {
  const adv = allocation?.advanced;
  const obs = [];
  const hour = allocation?.timeId?.slice(0, 2);

  for (let i = 0; i < adv.length; i++) {
    const alloc = adv?.[i];
    const timeStamp = randomTime(hour, 18);
    const record = randomObs('adv', allocation.timeId);

    const existing = await Observation.findOne({
      date: allocation.date,
      ward: allocation.ward,
      timeId: allocation.timeId,
      patient: alloc.patient,
      obsType: 'advanced',
    });

    if (!existing)
      obs.push({
        date: allocation.date,
        ward: allocation.ward,
        timeId: allocation.timeId,
        timeStamp,
        patient: alloc.patient,
        staff: alloc?.staff?.map(s => ({id: s?._id, name: s?.name})),
        obs: {record},
        obsType: 'advanced',
        obsCode: alloc.obsCode,
      });
  }

  return obs;
}

function randomObs(type, timeId) {
  const asleep = +timeId < 800;

  if (type === 'gen') {
    const {location, code} = labels[randomIndex(labels.length - 1)];
    if (asleep) return {record: 'bedroom asleep', code: 'bs'};
    return {record: location, code};
  }

  if (type === 'int') {
    const {location, engagement} = labels[randomIndex(labels.length - 1)];
    const engageString =
      engagement.length > 0 ? engagement[randomIndex(engagement.length - 1)] : '';
    if (asleep) return 'bedroom asleep';
    return `${location} ${engageString}`.trim();
  }

  if (type === 'adv') {
    if (asleep) return 'Remained asleep. Breathing and movement observed throughout the hour.';
    return advObs[randomIndex(advObs.length - 1)];
  }
}
