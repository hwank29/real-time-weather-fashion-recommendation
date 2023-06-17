import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import cookieParser from 'cookie-parser';
// import notifier from 'node-notifier';
import mysql, { Connection } from 'mysql2';
import dotenv from 'dotenv';
import {authenticateToken, generateAccessToken, generateRefreshToken} from '../middleware/authMiddleware';
dotenv.config({ path: 'src/.env' });

const router: Router = express.Router();
router.use(express.static('src/public'));
router.use(express.json());
router.use(cookieParser());

export interface User {
  email: string;
  password: string;
}

// Create connection to MySQL AWS RDS
const dbConfig = {
  host: process.env.aws_host_endpoint,
  port: Number(process.env.port),
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
};

export const db: Connection = mysql.createConnection(dbConfig);

// Connect to AWS RDS
db.connect((err ) => {
  if (err) {
    console.log(err.message);
    return;
  }  
  else {
      // const querrrry= 
      // `CREATE TABLE IF NOT EXISTS users.refreshTokenTable (refreshToken VARCHAR(255) PRIMARY KEY,created_date INT);`
  
      const querrry= 'SELECT * FROM users.users_info;'
      db.query(querrry, (err, result) => {
          if (err) console.log(err);
          else {console.log(result);}
      })
  }
});

// Login page
router.get('/', (req: Request, res: Response) => {
  res.render('login/login', { title: 'loginPage' });
});

// Login verification NOT encrypted
router.post('/', async (req: Request, res: Response) => {
  const user: User = {
    email: req.body.email,
    password: req.body.password,
  };
  const getUserQuery = `SELECT * FROM users.users_info WHERE email = '${user.email}';`;
  // Get user info from RDS that matches 
  try {
    db.query(getUserQuery, async (err, result : any) => {
      if (err) {
        // Handle the error
        console.error(err);
        return res.status(500).send('Error executing query');
      }
      if (!result) {
        console.log('not registered');
        return res.status(500).send('Not registered');
      }
      const verifiedPassword = await bcrypt.compare(
        user.password,
        result[0].encrypted_password
      );
      if (!verifiedPassword) {
          console.log('fail');
          return res.status(401).json({ error: true, message: "Invalid email or password" });
      }
      const accessToken = generateAccessToken({ email: user.email, password: user.password });
      const refreshToken = generateRefreshToken({ email: user.email, password: user.password });
      // sets cooike on user's side lasting 1,800,000m,s equal to 30 minutes 
      res.cookie('jwt', accessToken, { httpOnly: true, maxAge: 1800000 });
      const insertRefreshTokenQuery = `INSERT INTO users.refreshTokenTable (refreshToken, created_date) VALUES ('${refreshToken}', '${Math.floor(Date.now() / 1000)}');`
      db.query(insertRefreshTokenQuery, (err, result) => {})
      res.redirect('/');
    })}catch (err) {
		console.log(err);
		res.status(500).json({ error: true, message: "Internal Server Error" });
	}})


// Registration page
router.get('/register', (req: Request, res: Response) => {
  res.render('login/register', { title: 'registerPage' });
});

// API endpoint for user registration
router.post('/register', async (req: Request, res: Response) => {
  let { name, email, password, age, city, sex} = req.body;  
  if (req.body.sex === "others") {
    sex = req.body.customValue;
  } else {
    sex = req.body.sex;
  }
  const userCount = `SELECT COUNT(*) AS count FROM users.users_info WHERE email = ('${email}');`;
  db.query(userCount, async (err, result) => {

  if (typeof result == 'number' && result > 0) {
    return res.status(400).json({ message: 'Invalid email' });
  }
  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedUserPassword = await bcrypt.hash(password, salt);

  const insertUserQuery = `INSERT INTO users.users_info (created_date, name, email, encrypted_password, age, sex, city) 
                           VALUES ('${Math.floor(Date.now() / 1000)}', '${name}', '${email}', '${hashedUserPassword}', '${age}', '${sex}', '${city}');`;

  try {
    db.query(insertUserQuery);
    res.redirect('/login');
  } catch (err) {
    res.sendStatus(500);
  }
})});

export default router;