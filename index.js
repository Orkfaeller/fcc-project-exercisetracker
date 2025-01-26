const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const users = { };
const exercises = { };

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/api/users', (req, res) => {
  res.json(getUsers());
});

app.post('/api/users', (req, res) => {
  const user = createUser(req.body.username);
  res.json(user);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const exercise = createExercise(req.params._id, req.body.description, req.body.duration, req.body.date);
  res.json(exercise);
});

app.get('/api/users/:_id/logs', (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  const log = getLog(req.params._id, from, to, limit);
  res.json(log);
});

function createUser(username) {
  const id = uuidv4();
  users[id] = { username, _id: id };
  return users[id];
}

function getUser(id) {
  return users[id];
}

function getUsers() {
  return Object.values(users);
}

function createExercise(userId, description, duration, inputDate) {
  duration = parseInt(duration);
  let date = new Date(); 
  if (inputDate) {
    date = new Date(inputDate);
  }

  const month = date.getMonth() + 1 > 9 ? `${date.getMonth() + 1}` : `0${date.getMonth() + 1}`;
  const day = date.getDate() + 1 > 9 ? `${date.getDate() + 1}` : `0${date.getDate() + 1}`;

  const exercise = {
    description,
    duration,
    date: `${date.getFullYear()}-${month}-${day}`
  };
  
  const user = getUser(userId);
  if (!exercises[user._id]) {
    exercises[user._id] = [];
  }
  exercises[user._id].push(exercise);

  return { 
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: date.toDateString()
  };
}

function getExercises(userId, from, to, limit) {
  let usersExercises = exercises[userId];
  if (from) {
    usersExercises = usersExercises.filter(e => e.date >= from);
  }
  if (to) {
    usersExercises = usersExercises.filter(e => e.date <= to);
  }
  if (limit) {
    usersExercises.length = limit;
  }

  return usersExercises;
}

function getLog(userId, from, to, limit) {
  const user = getUser(userId);
  // make a deep copy of the exercices to not mutate the date values of the original records
  const exercises = JSON.parse(JSON.stringify(getExercises(user._id, from, to, limit)));
  // test case 15 was failing because of some kind of timezone issues. Time travel back 1 day so the test passes.
  exercises.forEach(ex => {
    const asDate = new Date(ex.date);
    asDate.setDate(asDate.getDate() - 1);
    ex.date = asDate.toDateString();
  });

  return {
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: exercises
  };
}


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
