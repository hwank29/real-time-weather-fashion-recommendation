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

// End connection to AWS RDS
db.end();


router.get('/', authenticateToken, (req, res) => {
    res.render('login/login', {title: 'loginPage'})
});

router.post('/', async (req, res) => {
    const username = req.body.username;
    const user = { name: username};

    // const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN);

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN);
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

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '30m'});
}
router.get('/register', (req, res) => {
    res.render('login/register', {title: 'reigsterPage'});
});
const query = `
  CREATE TABLE IF NOT EXISTS your_table_name (
    id INT PRIMARY KEY AUTO_INCREMENT,
    column1 VARCHAR(255),
    column2 INT,
    column3 DATETIME
  )
`;
// When using First time 
const query = `CREATE DATABASE IF NOT EXISTS users;
            USE users;
            CREATE TABLE IF NOT EXISTS users_info (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                created_date date, 
                name VARCHAR(50),
                email VARCHAR(50),
                encrypted_password VARCHAR(500)
            );
`
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
    console.log(users);
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