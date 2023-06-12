require('dotenv').config();
const express = require('express');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  organization: "org-DtZcIZLgIWPcHk7DX7PVMHmU",
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

const router = express.Router();

router.get('/', (req, res) => {
  res.render("home", { title: 'homePage' });
});

async function fetchToWeatherAPI(city) {
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

router.post('/', async (req, res) => {
  const { city, age } = req.body;
  let sex;
  if (req.body.sex == "others") {
    sex = req.body.customValue;
  } else {
    sex = req.body.sex;
  }

  try {
    const [temp, desc, humidity] = await fetchToWeatherAPI(city);
    try {
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
      res.render('result.ejs', {title: 'resultPage', city, strMessage});
    } catch (error) {
      console.error("OpenAI API Error:", error);
      res.status(500).json({ error: "Failed to fetch fashion recommendation" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

module.exports = router;
