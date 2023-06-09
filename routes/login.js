const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const mysql = require('mysql2');
const { start } = require('repl');

router.use(express.static("public"));
router.use(express.json());
router.use(cookieParser());

// Create connection to MySQL AWS RDS 
const db = mysql.createConnection({
    host: process.env.aws_host_endpoint,
    port: process.env.port,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
});


// Connect to AWS RDS
db.connect((err) => {
    if (err) {
      console.log(err.message);
      return;
    }  
    else {
        console.log('Database Connected');
        db.query('SELECT * FROM users.users_info;', (err, result) => {
            if (err) console.log(err)
            console.log(result)
        })
    }
  });

// Generate jwt lasting 30 minutes
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m'});
}
// Generate jwt lasting 30 minutes
function generateRefreshToken(user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}
// // Get user info from DB
// function getUser(email, password) {
//     // When matching name and password in RDS
//     const matchQuery = `SELECT EXISTS(SELECT 1 FROM users.users_info WHERE email = ${email} and password = ${password}) AS match_found;`;}



// Middleware to verify jwt
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // Invalid Token
        if (err) return res.sendStatus(403);
        // Check if the access token is expired or about to expire (e.g., within a certain threshold)
        const currentTimestamp = Math.floor(Date.now() / 1000); // Convert current time to seconds
        const expirationTimestamp = user.exp; // expiration time left
        const tokenExpiryThreshold = 60; // Renew token if it's going to expire in 60 seconds or less

        if (expirationTimestamp - currentTimestamp <= tokenExpiryThreshold) {
            // Access token is about to expire or has expired
            const accessToken = generateAccessToken(user);
            res.setHeader('Authorization', accessToken);
        }
      
        next();
    })
}


// Login page
router.get('/', (req, res) => {
    res.render('login/login', {title: 'loginPage'})
});

// Login verfication NOT encrypted
router.post('/', (req, res) => {
    const {name, email, password} = req.body;
    const user = {email: email, 
                  password: password};
    const getUserQuery = `SELECT * FROM users.users_info WHERE email = '${email}'`;
    // Get user info from RDS that matches 
    connection.query(getUserQuery, (err, result) => {
        if (error) {
          // Handle the error
          console.error(error);
          return res.status(500).send('Error executing query');
        }
        const userInfo = result;
    })
    
    bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!result) {
            return res.status(401).json({ message: 'Authentication failed' });
        }})
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({ accessToken: accessToken, refreshToken: refreshToken });  
})

router.post('/token', authenticateToken, (req, res) => {
    const refreshToken = req.body.token
});

router.get('/register', (req, res) => {
    res.render('login/register', {title: 'reigsterPage'});
});
// Query list
// When using First time 
const startQuery = `
            CREATE DATABASE IF NOT EXISTS users;
            USE users;
            CREATE TABLE IF NOT EXISTS users_info (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                created_date date, 
                name VARCHAR(50),
                email VARCHAR(50) UNIQUE,
                encrypted_password VARCHAR(500));
            CREATE TABLE IF NOT EXISTS refresh_token (
                refreshtoken_id INT PRIMARY KEY AUTO_INCREMENT,
                refreshtoken VARCHAR(500)
            );`;
// // Create the 'users' database
// db.query('CREATE DATABASE IF NOT EXISTS users', (err, result) => {
// if (err) throw err;

// // Switch to the 'users' database
// db.query('USE users', (err, result) => {
//     if (err) throw err;

//     // Create the 'users_info' table
//     db.query(`CREATE TABLE IF NOT EXISTS users_info (
//     user_id INT PRIMARY KEY AUTO_INCREMENT,
//     created_date date, 
//     name VARCHAR(50),
//     email VARCHAR(50) UNIQUE,
//     encrypted_password VARCHAR(500)
//     )`, (err, result) => {
//     if (err) throw err;

//     // Create the 'refresh_token' table
//     db.query(`CREATE TABLE IF NOT EXISTS refresh_token (
//         refreshtoken_id INT PRIMARY KEY AUTO_INCREMENT,
//         refreshtoken VARCHAR(500)
//     )`, (err, result) => {
//         if (err) throw err;

//         console.log('Tables created successfully!');
//         // Close the connection
//         db.end();
//     });
//     });
// });
// });

// When pushing refreshtoken
// const pushRT = `USE users;
//                INSERT INTO refresh_token (refreshtoken)
//                VALUES (${refreshtoken})`; 


const today = new Date();
const year = today.getFullYear(); 
const month = today.getMonth() + 1; 
const day = today.getDate(); 

// bcrypt.compare(userEnteredPassword, storedHashedPassword, (error, result) => {
//     if (error) {
//       console.error('Error comparing passwords:', error);
//       return;
//     }
  
//     if (result) {
//       // Passwords match
//       console.log('Password is correct');
//     } else {
//       // Passwords don't match
//       console.log('Password is incorrect');
//     }
//   });

// API endpoint for user registration
router.post('/register', async (req, res) => {
    const { name, email, password, age} = req.body;
    if (req.body.sex == "others") {
        sex = req.body.customValue
    } else {
        sex = req.body.sex
    }

    try {
        if (Number.isInteger(Number(age)) && validator.isEmail(email) && password.length > 6) {
        // Hash the password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users_info (created_date, name, email, encrypted_password, age, sex ) 
               VALUES ('${year}-${month}-${day}', '${name}', '${email}', '${hashedPassword}', '${age}', '${sex}');`
        db.query('USE users', (err, result) => {
            if (err) {
                console.log(err.message);
                return;
            }     
            db.query(query, (err,result) => {
                if (err) {
                    console.log(err.message);
                    return;
                }
                else {
                    console.log('Successfully done')
                    // // End connection to AWS RDS
                    // db.end();
                }
            });
        });
        const queryCheckEmail = `SELECT COUNT(*) AS count FROM users.users_info WHERE email = ?`;
        db.query(queryCheckEmail, [email], (err, result) => {
        if (err) {
            console.error('Error executing the query: ' + err.message);
            return;
        }
        const count = result[0].count;

        if (count > 0) {
            req.
            res.redirect('/login/register');
        } else {
            res.redirect('/login');}
        });
    }}
    catch(err) {
        console.log('not working: ' + err.message);
    }
});

// router
//   .route("/:id")
//   .get((req, res) => {
//     console.log(req.user);
//     console.log(req.query);
//     res.send(`This User ID: ${req.params.id}`);
// }).put((req, res) => {
//     res.send(`User ID: ${req.params.id}`);
// }).delete((req, res) => {
//     res.send(`User ID: ${req.params.id}`);
// })


// router.param("id", (req, res, next, id) => {
//     req.user = users[id];
//     next();
// })
    
module.exports = router