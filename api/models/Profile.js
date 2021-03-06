const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
  //Will need to address scenario where certain data isn't provided (either make all required or account for those scenarios in logic)
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  weight: {
    type: Number,
    required: true,
  },
  weightHistory: [
    {
      weight: {
        type: Number,
      },
        date: {
          type: Date,
          default: Date.now,
        },
      },
  ],
  height: {
    type: Number,
    required: true,
  },
  bmi: {
    type: Number,
  },
  goalWeight: {
    type: Number,
  },
  goalDailyCalories: {
    type: Number,
    default: 2000,
  },
  goalDays: {
    type: Number,
    default: 4,
  },
  caloriesConsumedToday: {
    //This will need to reset every day
    type: Number,
    default: 0,
  },
  caloriesRemainingToday: {
    type: Number,
  },
  activities: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      duration: {
        type: Number,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      calories: {
        type: Number,
      },
    },
  ],
});

module.exports = Profile = mongoose.model('Profile', profileSchema);
