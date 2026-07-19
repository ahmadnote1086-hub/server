import moment from "moment-timezone";

// Returns true if today is a training day
export const shouldAssignDailyQuests = (timezone, trainingDays) => {
  const today = moment.tz(timezone).isoWeekday();

  return trainingDays.includes(today);
};

// Returns the next reminder datetime based on the user's schedule
export const getNextTrainingReminder = (
  now,
  reminderTime,
  trainingDays,
) => {
  const [hour, minute] = reminderTime.split(":");

  let nextReminder = now.clone().set({
    hour: Number(hour),
    minute: Number(minute),
    second: 0,
  });

  if (nextReminder.isBefore(now)) {
    nextReminder.add(1, "day");
  }

  while (!trainingDays.includes(nextReminder.isoWeekday())) {
    nextReminder.add(1, "day");
  }

  return nextReminder;
};