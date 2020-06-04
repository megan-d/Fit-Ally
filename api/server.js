const express = require('express');
const port = process.env.PORT || 5000;
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Import routes
const auth = require('./routes/auth');
const users = require('./routes/users');
const profile = require('./routes/profile');

dotenv.config();
const app = express();




//Connect to Database. Dotenv npm package gives access to .env
const connectDatabase = async () => {
    try {await mongoose.connect(
        process.env.MONGO_URI,
        { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false },
        () => console.log('Connected to DB'))
    } catch(err) {
        console.error(err);
        process.exit(1);
    };
}
connectDatabase();

//MIDDLEWARES
//To get access to req.body (no longer need body parser npm package)
app.use(express.json());

// //Root route
// app.get('/', async (req, res) => {
//   res.send('API is running');
// });

//Route middlewares
    //Authenticate user and get token
    app.use('/api/auth', auth);
    //Register new user 
    app.use('/api/users', users);
    //Create, update, and delete profile. Add activity to profile.
    app.use('/api/profile', profile);

// Serve static assets in production. Heroku will automatically default the NODE_ENV to production.
if (process.env.NODE_ENV === 'production') {
    // Set static folder (to be public folder). We want index.html to be our static file.
    app.use(express.static('client/build'));
    //Return all requests to react app
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
  }

//Listen on port
app.listen(port, () => console.log(`App is listening on port ${port}`));
