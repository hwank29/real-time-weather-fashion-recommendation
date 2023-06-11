require('dotenv').config();
const express = require('express');
// import openAI API
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: "org-DtZcIZLgIWPcHk7DX7PVMHmU",
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

const router = express.Router();

router.get('/', (req, res) => {
    res.render("home.ejs", {title: 'homePage'})
});

async function fetchToWeatherAPI(city) {
  try {
    const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.apiKey}`);
    const data = await response.json();
    const temp = data['main']['temp'];
    const desc = data['weather'][0]['description'];
    const humidity = data['main']['humidity']
    console.log([temp, desc]);
    return [temp, desc, humidity];
  } catch (error) {
    console.error('FetchError:', error);
    throw error;
  }
}

router.post('/', async (req, res) => {
    const { city, age} = req.body;
    if (req.body.sex == "others") {
        sex = req.body.customValue;
    } else {
        sex = req.body.sex;
    }
    try {
        const weatherArray = await fetchToWeatherAPI(city);
        const [temp, desc, humidity] = weatherArray
        res.json({ temp: temp, desc:desc, humidity:humidity});
      } catch (error) {
        console.error('HereError:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
      }
    openai.chatCompletion.create({
        model: 'gpt-3.5-turbo',
        messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who won the world series in 2020?' },
        ],
    })
    


    
})
// export router to app 
module.exports = router