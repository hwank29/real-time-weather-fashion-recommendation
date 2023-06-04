require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

router.use(express.json);

// Create connection to MySQL AWS RDS 
const db = mysql.createPool({
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
        return ;
    }
    console.log("Database Connected!");
});

// Generate jwt lasting 30 minutes
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m'});
}
// Generate jwt lasting 30 minutes
function generateRefreshToken(user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

// Middleware to verify jwt
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // Invalid Token
        if (err) return res.sendStatus(403);

        req.user = user;
        next();
    })
}


// Login page
router.get('/', authenticateToken, (req, res) => {
    res.render('login/login', {title: 'loginPage'})
});

// Login verfication NOT encrypted
router.post('/', async (req, res) => {
    const {name, email, password} = req.body;
    const user = {name: name,
                  email: email, 
                  password: password};
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    db.query(pushRT, (err, result) => {
        if (err) throw err;

    })

    res.json({ accessToken: accessToken, refreshToken: refreshToken });  

    // const user = users.find(user => user.name = req.body.name);
    // if (user == null) {
    //     return res.status(400).send("No User Found");
    // };
    // try {
    //     if (await bcrypt.compare(req.body.password, user.password)) {
    //         res.send('Success');
    //     };
    // } catch {
    //     res.status(500).send();
    // }
})

router.get('/register', (req, res) => {
    res.render('login/register', {title: 'reigsterPage'});
});
// Query list
// When using First time 
const startQuery = `CREATE DATABASE IF NOT EXISTS users;
            USE users;
            CREATE TABLE IF NOT EXISTS users_info (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                created_date date, 
                name VARCHAR(50),
                email VARCHAR(50),
                encrypted_password VARCHAR(500));
            CREATE TABLE IF NOT EXISTS refresh_token (
                refreshtoken_id INT PRIMARY KEY AUTO_INCREMENT,
                refreshtoken VARCHAR(500)
            );`;
// When matching name and password in RDS
const matchQuery = `SELECT EXISTS(SELECT 1 FROM users WHERE email = ${email} and password = ${password}) AS match_found;`;
// When pushing refreshtoken
const pushRT = `USE users;
               INSERT INTO refresh_token (refreshtoken)
               VALUES (${refreshtoken})`;


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
    const { name, email, password } = req.body;

    try {
        // Hash the password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users_info (created_date, name, email, encrypted_password) 
               VALUES ('${year}-${month}-${day}', '${name}', '${email}', '${hashedPassword}');`
        res.redirect('/login');
    } catch {
        res.redirect('/login/register');
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

// End connection to AWS RDS
db.end();

module.exports = router