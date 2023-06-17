import { Router, Request, Response } from 'express';
import { Configuration, OpenAIApi, CreateChatCompletionRequest } from "openai";
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { decodeAccessToken } from '../middleware/authMiddleware';
import { db } from './login';
dotenv.config({ path: 'src/.env' });

const configuration = new Configuration({
  organization: "org-DtZcIZLgIWPcHk7DX7PVMHmU",
  apiKey: process.env.OPENAI_API_KEY || ''
});
const openai = new OpenAIApi(configuration);

const router = Router();

async function fetchWeatherAPI(city: string): Promise<[number, string, number]> {
  try {
    const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.apiKey}`);
    const data = await response.json();
    const temp = data['main']['temp'];
    const desc = data['weather'][0]['description'];
    const humidity = data['main']['humidity'];
    return [temp, desc, humidity];
  } catch (error) {
    console.error('FetchError:', error);
    throw error;
  }
}

async function fetchopenAiAPI(city: string, age: string, sex: string) {
    // weather api
    const [temp, desc, humidity] = await fetchWeatherAPI(city);
    // openai api
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant" },
        {
          role: "user",
          content: `Can you do a fashion recommendation? I am ${age} years ${sex}. 
                    I live in ${city}. Today's weather is ${desc} with temperature at 
                    ${temp} Kelvin and humidity at ${humidity}. Give the answer in brief bullet points`
        }
      ],
      temperature: 0.4
    });
  
  const strMessage = JSON.stringify(completion.data.choices[0].message.content, (key, value) => {
        if (typeof value === "string") {
          return value.replace(/\n/g, "<br>");
        }
        return value;
      });
  return strMessage;
}


router.get('/', (req: Request, res: Response) => {
  const accessToken = req.cookies.jwt;
  if (!accessToken) { res.render("home", { title: 'homePage' }); }
  else {
    // decode accesstoken to User 
    const decodedUser = decodeAccessToken(accessToken);
    // Connect to AWS RDS
    db.connect((err ) => {
      if (err) {
        console.log(err.message);
        return;
      }  
      else {
          console.log('Database Connected');
          const getUserQuery = `SELECT * FROM users.users_info where email = '${decodedUser.email}';`      
          db.query(getUserQuery, async (err, result) => {
              if (err) console.log(err);
              const { city, age, sex } = result[0];
              try {
                const strMessage = await fetchopenAiAPI(city, age, sex);
                res.render('home.ejs', { title: 'resultPage', city, strMessage });
                } catch (error) {
                  console.error("OpenAI API Error:", error);
                  res.status(500).json({ error: "Failed to fetch fashion recommendation" });
                }
          })
      }
       
});

  }
});

router.post('/', async (req: Request, res: Response) => {
  const { city, age } = req.body;
  let sex: string;

  if (req.body.sex == "others") {
    sex = req.body.customValue;
  } else {
    sex = req.body.sex;
  }
  try {
    const strMessage = await fetchopenAiAPI(city, age, sex)      
      res.render('home.ejs', { title: 'resultPage', city, strMessage });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      res.status(500).json({ error: "Failed to fetch fashion recommendation" });
    }
});

// logout get 
router.get('/logout', (req: Request, res: Response) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
})

export default router;
