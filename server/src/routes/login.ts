import express, { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import cookieParser from 'cookie-parser';
// import notifier from 'node-notifier';
import mysql, { Connection } from 'mysql2';
import dotenv from 'dotenv';
dotenv.config({ path: 'src/.env' });

const router: Router = express.Router();
router.use(express.static('src/public'));
router.use(express.json());
router.use(cookieParser());

interface User {
  email: string;
  password: string;
}

interface TokenPayload {
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

const db: Connection = mysql.createConnection(dbConfig);

// Connect to AWS RDS
db.connect((err ) => {
  if (err) {
    console.log(err.message);
    return;
  }  
  else {
      console.log('Database Connected');
      const querrry= 'SELECT * FROM users.users_info;'
      db.query(querrry, (err, result) => {
          if (err) console.log(err)
          console.log(result)
      })
  }
});

// Generate jwt lasting 30 minutes
function generateAccessToken(user: TokenPayload): string {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: '3d' });
}

// Generate jwt lasting 30 minutes
function generateRefreshToken(user: TokenPayload): string {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET!);
}

// Middleware to verify jwt
async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  const token = req.headers.authorization;
  // const authHeader = req.headers['authorization'];
  // const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).send('Access Token not found');

  try {
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;

    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert current time to seconds
    const expirationTimestamp = (user as any).exp; // expiration time left
    const tokenExpiryThreshold = 60; // Renew token if it's going to expire in 60 seconds or less

    if (expirationTimestamp - currentTimestamp <= tokenExpiryThreshold) {
      // Access token is about to expire or has expired
      const accessToken = generateAccessToken(user);
      res.setHeader('Authorization', accessToken);
    }

    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

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
      console.log(result);
      console.log(`here ${user.password} and ${result[0].encrypted_password}`);
      console.log(result[0].encrypted_password);
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
      res.status(200).json({
        error: false,
        accessToken,
        refreshToken,
        message: "Logged in sucessfully",
      });
  })}catch (err) {
		console.log(err);
		res.status(500).json({ error: true, message: "Internal Server Error" });
	}})
  
// Token refresh
router.post('/refresh', authenticateToken, (req: Request, res: Response) => {
  const refreshToken: string = req.body.refreshToken;
  if (!refreshToken) return res.sendStatus(401);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ email: user.email, password: user.password });
    res.json({ accessToken });
  });
});

// Registration page
router.get('/register', (req: Request, res: Response) => {
  res.render('login/register', { title: 'registerPage' });
});

// User registration
router.post('/register', async (req: Request, res: Response) => {
  const user: User = {
    email: req.body.email,
    password: req.body.password,
  };

  const userCount = `SELECT COUNT(*) AS count FROM users.users_info WHERE email = ('${user.email}');`;
  db.query(userCount, [user.email], async (err, result) => {

  if (typeof result == 'number' && result > 0) {
    return res.status(400).json({ message: 'Invalid email' });
  }
  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedUserPassword = await bcrypt.hash(user.password, salt);

  const insertUserQuery = `INSERT INTO users.users_info (email, password) VALUES ('${user.email}', '${hashedUserPassword}');`;

  try {
    db.query(insertUserQuery);
    res.redirect('/login');
  } catch (err) {
    res.sendStatus(500);
  }
})});

export default router;
