const express = require('express')
const app = express()
app.use(express.json())
require('dotenv').config()
const Person = require('./models/person')

const morgan = require('morgan')
app.use(morgan('tiny'))

app.use(express.static('dist'))

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
app.use(requestLogger)

const errorHandler = (error, request, response, next) => {
  console.error('errorHandler: ', error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const cors = require('cors')
app.use(cors())


app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  // response.json(persons)
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/info', (request, response) => {
  Person.countDocuments({}).then(count => {
    const currentTime = new Date().toString()
    response.send(`<p>Phonebook has info for ${count} people<br/>${currentTime}</p>`)
  }).catch(error => {
    response.status(500).send({ error: 'something went wrong' })
  })
})

app.get('/api/persons/:id', (request, response) => {
  // const id = request.params.id
  // const person = persons.find(person => person.id === id)
  // if (person) {
  //     response.json(person)
  // } else {
  //     response.status(404).end()
  // }
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  }).catch(error => {
    console.log(error)
    response.status(400).send({ error: 'malformatted id' })
    //   response.status(500).end()
  })
})

app.delete('/api/persons/:id', (request, response, next) => {
  // const id = request.params.id
  // persons = persons.filter(person => person.id !== id)

  // response.status(204).end()

  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body
  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'content missing'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number
  })
  person.save().then(savedPerson => {
    response.json(savedPerson)
  }).catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => {
      if (error.name === 'ValidationError') {
        response.status(400).json({ error: error.message })
      } else {
        next(error)
      }
    })
})


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT)
console.log(`Server running on port ${PORT}`)