// Returns pseudo random number based on input string.

// https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const getRandomNumber = (str: string, min: number, max: number) => {
  const hash = simpleHash(str);
  const seededRandom = mulberry32(hash);

  return Math.floor(seededRandom() * (max - min)) + min;
};

export default getRandomNumber;
