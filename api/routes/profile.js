const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const verify = require('../middleware/verifyToken');

const User = require('../models/User');
const Profile = require('../models/Profile');

//ROUTE: GET api/profile/me
//DESCRIPTION: Get current user's profile
//ACCESS LEVEL: Private
router.get('/me', verify, async (req, res) => {
  try {
    //Find the current user based on the id that comes in with the request's token. Populate with the name from the user model.
    const profile = await (
      await Profile.findOne({ user: req.user.id })
    ).populate('User', 'name');
    console.log(req.user.id);
    //If there is no profile, return an error
    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'There is no profile available for this user.' });
    }
    //If there is a profile, send that profile
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

//ROUTE: POST api/profile
//DESCRIPTION: Create or update a user profile
//ACCESS LEVEL: Private
router.post(
  '/',
  [
    verify,
    [
      //User express validator to validate required inputs
      check('weight', 'Please provide a numeric weight in pounds.')
        .isNumeric(),
      check('height', 'Please provide a numeric height in inches.')
        .isNumeric()
    ]
  ],
  async (req, res) => {
    //Add in logic for express validator error check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    //Pull all of the fields out into variables from req.body. Don't include activities.
    const {
      weight,
      height,
      goalWeight,
      goalDailyCalories,
      goalDays,
      caloriesConsumedToday
    } = req.body;

    //Build the profileItems object. If the value is there, add it to the profileItems object.
    const profileItems = {};
    profileItems.user = req.user.id;
    if (weight) {
      profileItems.weight = weight;
    }
    if (height) {
      profileItems.height = height;
    }
    if (weight) {
      //need to see how to make this work when updating
      profileItems.bmi = ((weight / (height * height)) * 703).toFixed(1);
    }
    if (goalWeight) {
      profileItems.goalWeight = goalWeight;
    }
    if (goalDailyCalories) {
      profileItems.goalDailyCalories = goalDailyCalories;
    }
    if (goalDays) {
      profileItems.goalDays = goalDays;
    }
    //Might need to move these somewhere else - unsure yet
    if (caloriesConsumedToday > 0) {
      profileItems.caloriesConsumedToday = caloriesConsumedToday;
      caloriesRemainingToday = goalDailyCalories - caloriesConsumedToday;
    profileItems.caloriesRemainingToday = caloriesRemainingToday;
    }
    if (goalDailyCalories && caloriesConsumedToday) {
        caloriesRemainingToday = goalDailyCalories - caloriesConsumedToday;
        
    } else {
        caloriesRemainingToday = 2000 - caloriesConsumedToday;
    }
    profileItems.caloriesRemainingToday = caloriesRemainingToday;

    //Once all fields are prepared, update and populate the data
    try {
      //Use findOne to find profile
      let profile = await Profile.findOne({ user: req.user.id });

      //If profile is found, update the new fields
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileItems },
          { new: true }
        );
        //send back profile
        return res.json(profile);
      }
      //If profile isn't found, create a new one
      if (!profile) {
        profile = await new Profile(profileItems);
        await profile.save();
        res.json(profile);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

//ROUTE: DELETE api/profile
//DESCRIPTION: Delete profile and user
//ACCESS LEVEL: Private
router.delete('/', verify, async (req, res) => {
  try {
    //Find profile that corresponds to user id found in token and delete
    await Profile.findOneAndRemove({ user: req.user.id });

    //Find user that corresponds to user id found in token and delete
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'This user and corresponding profile has been deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//ROUTE: PUT api/profile/activity
//DESCRIPTION: Add activity
//ACCESS LEVEL: Private
router.put(
  '/activity',
  [
    verify,
    [
      //User express validator to validate required inputs
      check('duration', 'Please provide a numeric duration in minutes.')
        .isNumeric(),
      check('category', 'Please select a category.')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    //Add in logic for express validator error check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    //Pull all of the fields out into variables from req.body.
    const { date, duration, category, calories, comments } = req.body;

    //Create object for new activity
    const newActivity = {
      date,
      duration,
      category,
      calories,
      comments
    };

    try {
      //Find profile of user that comes in with token
      const profile = await Profile.findOne({ user: req.user.id });
      //Need to perform calculation to calculate calories based on weight, category, and duration. Mets derived from acsm.org.
      //To calculate calories burned: METS * 3.5 * weight in kg / 200 * duration; 
        const mets = {
            bicyclingLeisure: 6,
            bicyclingVigorous: 10,
            runningSlow: 8,
            runningFast: 11.5,
            swimming: 8,
            walkingLeisure: 3,
            walkingBrisk: 5,
            hiking: 7,
            nordicSkiing: 8,
            tennis: 8,
        }
        const category = newActivity.category;
        newActivity.calories = Math.round(mets[category] * 3.5 * (profile.weight / 2.2046) / 200 * newActivity.duration);

      //Add into activities array for profile. Add to beginning so most recent activity is shown first.
        profile.activities.unshift(newActivity);

      //Save to database and send profile to front end
      await profile.save();
      res.json(profile);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//ROUTE: DELETE api/profile/activity/:activity_id
//DESCRIPTION: Delete activity from profile by activity's id
//ACCESS LEVEL: Private
router.delete('/activity/:activity_id', verify, async (req, res) => {
    try {
        //Find profile based on the user id that comes in through the token
    const profile = await Profile.findOne({ user: req.user.id });

    //If profile is found, find the activity that matches the activity id from req.params and delete it
    if(profile) {
        //Remove the activity from the activities array where the index is equal to req.params.activity_id
        const activities = profile.activities;
        const activity = req.params.activity_id;
        const activityIds = activities.map(el => el._id);
        const index = activityIds.indexOf(activity);
        if(index > -1) {
            activities.splice(index, 1);
    
            //Update the profile record and save to database
            profile.activities = activities;
            await profile.save();
            res.json(profile);
        } else {
            return res.status(500).send('There was an error processing this request.')
        }
        
    }
    } catch(err) {
        console.error(err);
        res.status(500).send('There was an error processing your request.');
    }
})

module.exports = router;
