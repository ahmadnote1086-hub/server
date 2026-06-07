export const getMaxReps = (level) => {
    if (level >= 10) {
    return 8;
  } else if (level >= 5) {
    return 5;
  } else {
    return 3;
  }
}