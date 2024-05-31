import {configDotenv} from 'dotenv';
import * as fs from 'fs';
configDotenv();

export const read = path => {
  const file = fs.readFileSync(path, 'utf-8');
  const parsedFile = JSON.parse(file);
  return parsedFile;
};

export const errorPrompt =
  "Couldn't connect to the database, please ensure you have a stable internet connection";

export const dbLink = `mongodb+srv://${process.env.user}:${process.env.password}@nhs.ttgfpzq.mongodb.net/hospitalDB?retryWrites=true&w=majority`;

export const capitalize = string => {
  const arr = string.split(' ');
  const noCaps = ['and', 'to', 'a'];

  const caps = arr.map(word => {
    if (noCaps.includes(word)) return word.toLowerCase();
    else return word[0].toUpperCase() + word.slice(1).toLowerCase();
  });

  return caps.join(' ');
};

export const convertDate = date => {
  if (!date) return undefined;
  return new Date(date).toISOString().split('T')[0];
};

export const randomIndex = (max, min) => {
  if (min) return Math.floor(Math.random() * (max - min + 1) + min);
  else return Math.trunc(Math.random() * max);
};

export function pad(value, quantity = 2, char = 0, pos = 'start') {
  if (pos === 'start') return `${value}`.padStart(quantity, `${char}`);
  if (pos === 'end') return `${value}`.padEnd(quantity, `${char}`);
}

export const randomTime = (hourValue, maxMinutes, minMinutes) => {
  const hour = pad(`${hourValue || randomIndex(23)}`);
  const minutes = pad(`${randomIndex(maxMinutes || 59, minMinutes)}`);
  return `${hour}:${minutes}`;
};
