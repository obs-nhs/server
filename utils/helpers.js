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
