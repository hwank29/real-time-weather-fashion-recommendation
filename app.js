const path = require('path');
// create app var with express
const express = require('express');
const app = express();

// uses ejs and use views directory for ejs 
app.set('view engine', 'ejs');
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render()
    res.send('Hello, World!');
  });

app.listen(3000, ()=> {
  console.log('Server is running on port 3000');
});

// fetch('https://api.example.com/data')
//   .then(function (response) {
//     if (response.ok) {
//       return response.json();
//     }
//     throw new Error('Network response was not ok.');
//   })
//   .then(function (data) {
//     console.log(data);
//   })
//   .catch(function (error) {
//     console.error('Error:', error);
//   });


//   app.listen(port=3000)
