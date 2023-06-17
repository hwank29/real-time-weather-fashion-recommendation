import express, { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from '../routes/login';

// Generate accesstoken lasting 30 minutes
export function generateAccessToken(user: User): string {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!, { expiresIn:  '30m'});
  }
  
// Generate refreshtoken lasting 60 days
export function generateRefreshToken(user: User): string {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET!, {expiresIn: '60d'});
}

export function decodeAccessToken(accessToken: string): User | null {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as User;
      return decoded;
    } catch (error) {
      console.error('Error decoding access token:', error);
      return null;
    }
  }

// Middleware to verify jwt
export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    // Connect to AWS RDS
    db.connect((err ) => {
    if (err) {
      console.log(err.message);
      return;
    }  
    else {
    }});
    // get accessToken stored as cookie from user
    const token = req.cookies.jwt;
    const user_one: User = {
        email: req.body.email,
        password: req.body.password,
      };
    // check if token exists and verify it
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err: Error, decodedToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                  res.locals.user = user_one;
                  next();}
                })
    }
    else {
        const refreshToken = generateRefreshToken(user_one)
        const getUserQuery = `SELECT * FROM users.refreshTokenTable WHERE refreshToken = '${refreshToken}';`;
        db.query(getUserQuery, (error, result) => {
            if (error) {
                res.locals.user = null;
                next();
            } else {
                try {
                const created_date = result[0]['created_date'];
                const currentTimestamp = Math.floor(Date.now() / 1000); // Convert current time to seconds
                const tokenExpiryThreshold = 60; // Renew token if it's going to expire in 60 seconds or less
                if (currentTimestamp - created_date <= 1800 - tokenExpiryThreshold) {
                    // Access token is about to expire or has expired
                    const accessToken = generateAccessToken(user_one);
                    res.cookie('jwt', accessToken, { httpOnly: true, maxAge: 1800000 });
                    res.locals.user = user_one;
                    next();
                }} catch (error) {
                    res.locals.user = null;
                    next();
                }
            }
        })
  };
}
  