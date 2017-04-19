
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const randomColor = () =>
  [
    getRandomInt(0, 255),
    getRandomInt(0, 255),
    getRandomInt(0, 255),
  ]

export {
  getRandomInt,
  randomColor,
}
