const path = require('path');
const express = require('express');
const mysql = require('mysql');

// create app var with express
const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true}));

// Set MySQL Configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database_name',
  });

// Connect to MySQL db
db.connect(err => {
    if (err) {
      console.error('Failed to connect to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL database');
});

// uses ejs and use views directory for ejs 
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render("index")
    res.send('Hello, World!');
  });

// import router from routes/user.js
const userRouter = require('./routes/users');

app.use('/users', userRouter);

app.listen(3000, ()=> {
  console.log('Server is running on port 3000');
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
