const path = require('path');
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt')
const session = require('express-session');
require('dotenv').config();
const users = [];

// create app var with express and middleware function
const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true}));
app.use(session({
  secret: process.env.secret_key,
  resave: false,
  saveUninitialized: true
}));

// // Set MySQL Configuration
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'your_username',
//     password: 'your_password',
//     database: 'your_database_name',
// });

// // Connect to MySQL db
// db.connect(err => {
//     if (err) {
//       console.error('Failed to connect to MySQL:', err);
//       return;
//     }
//     console.log('Connected to MySQL database');
// });

// uses ejs and use views as directory for ejs 
app.set('view engine', 'ejs');
app.set('views', 'views');

// import router from routes/home.js
const homeRouter = require('./routes/home');
// import router from routes/login.js
const loginRouter = require('./routes/login');
// import router from routes/user.js
const userRouter = require('./routes/users');
// import router from routes/about.js
const aboutRouter = require('./routes/about');

app.use('/login', loginRouter);
app.use('/users', userRouter);
app.use('/', homeRouter);
app.use('/about', aboutRouter);

app.listen(5000, ()=> {
  console.log('Server is running on port 5000');
});

// fetch('https://api.example.com/data')
//   .then(function (response) {
//     if (response.ok) {
//       return response.json();
//     }
//     throw new Error('Network response was not ok.');
//   })
//   .then(function (data) {
//     console.log(data);
//   })
//   .catch(function (error) {
//     console.error('Error:', error);
//   });


//   app.listen(port=3000)
