const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    res.render()
});

router.post('/', (req, res) => {
    const isValid = true;
    console.log(req.body.firstName);
    res.send('Hi');
})
router.get('/new', (req, res) => {
    // pass
});


router
  .route("/:id")
  .get((req, res) => {
    console.log(req.user);
    console.log(req.query);
    res.send(`This User ID: ${req.params.id}`);
}).put((req, res) => {
    res.send(`User ID: ${req.params.id}`);
}).delete((req, res) => {
    res.send(`User ID: ${req.params.id}`);
})

const users = [{name: "Hwanhee"}, {name: "Kim"}];

router.param("id", (req, res, next, id) => {
    req.user = users[id];

    next();
})
module.exports = router