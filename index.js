//strict mode which helps catch coding errros
'use strict';

//imports the express module
const express = require('express');
//imports the handlebars engine for express
const { engine } = require('express-handlebars');
//imports the cookie-parser module
const cookieParser = require('cookie-parser');
//imports the file system module
const fs = require('fs');
//imports the path module
const path = require('path');

//creates an express application
const app = express();
//sets the port number to 4000
const PORT = 4000;

//middleware to parse URL-encoded data and cookies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//serves static files from the public directory which isnt needed here because we are using handlebars
app.use(express.static('public'));

//sets up handlebars as the view engine with '.hbs' as the file extension
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false}));
//sets view engine to handlebars
app.set('view engine', 'hbs');

//route for the root URL 
app.get('/', (req, res) => {
  //gets the username from the cookies
  const username = req.cookies.username;
  //renders the home view with the username
  res.render('home', { username });
});


//route for the login page
app.get('/login', (req, res) => {
  //renders the login view
  res.render('login');
});

//route for the login form submission
app.post('/login', (req, res) => {
  //reads and parse user data from JSON file
  const userData = JSON.parse(fs.readFileSync('./userData.json', 'utf8'));
  //extracts username and password from the request body
  const { username, password } = req.body;
  //gets the user data for the provided username
  const validUser = userData[username];
  //if the username is not found
  if (!validUser) {
    //renders the login view with an error message
    res.render('login', { errorMessage: 'Invalid username' });
    //if the password is incorrect
  } else if (validUser.password !== password) {
    //renders the login view with an error message
    res.render('login', { errorMessage: 'Invalid password' });
  } else {
    //sets a cookie with the username
    res.cookie('username', username);
    //redirects to the home page
    res.redirect('/');
  }
});

app.get('/sign-up', (req, res) => {
    res.render('sign-up'); // Render the sign-up view
  });

app.post('/sign-up', (req, res) => {
    // Reads and parses user data from JSON file
    let userData = {};
    try {
      userData = JSON.parse(fs.readFileSync('./userData.json', 'utf8'));
    } catch (err) {
      console.error('Error reading userData.json:', err);
    }
  
    // Extracts username and password from the request body
    const { username, password } = req.body;
  
    // Check if the username is already taken
    if (userData[username]) {
      res.render('sign-up', { errorMessage: 'Username taken' });
      return;
    }
  
    // Validate the password to ensure it has at least 2 special characters
    const specialCharRegex = /[^A-Za-z0-9]/g;
    const specialCharCount = (password.match(specialCharRegex) || []).length;
  
    if (specialCharCount < 2) {
      res.render('sign-up', { errorMessage: 'Password needs to have at least 2 special characters' });
      return;
    }
  
    // If validation passes, save the new user data
    userData[username] = { password };
  
    // Write the updated user data back to the JSON file
    try {
      fs.writeFileSync('./userData.json', JSON.stringify(userData, null, 2));
    } catch (err) {
      console.error('Error writing to userData.json:', err);
      res.render('sign-up', { errorMessage: 'Error saving user data. Please try again.' });
      return;
    }
  
    // Sets a cookie with the username
    res.cookie('username', username);
  
    // Redirects to the home page
    res.redirect('/');
  });

const scansRouter = require('./routes/note-scans');
app.use('/note-scans', scansRouter);

const flashcardsRouter = require('./routes/flashcards');
app.use('/flashcards', flashcardsRouter);

  
//route to handle logout
app.get('/logout', (req, res) => {
  //clears the username cookie
  res.clearCookie('username');
  //redirects to the root URL
  res.redirect('/');
});



//starts the server and listen on the specified port
app.listen(PORT, () => {
  //logs a message indicating that the server is running
  console.log(`Server is running on http://localhost:${PORT}`);
});
