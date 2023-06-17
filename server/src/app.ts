import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import {authenticateToken } from './middleware/authMiddleware';


interface User {
  // Define the structure of the User object
  username: string;
  password: string;
}
const users: User[] = [];

// create app var with express and middleware function
const app = express();
app.use(express.static("src/public"));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(cookieParser());

// uses ejs and use views as directory for ejs 
app.set('view engine', 'ejs');
app.set('views', 'src/views');

// Import router from routes/home.ts
import homeRouter from './routes/home.ts';
// Import router from routes/login.ts
import loginRouter from './routes/login.ts';


app.get('*', authenticateToken);
app.use('/login', loginRouter);
app.use('/', homeRouter);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
