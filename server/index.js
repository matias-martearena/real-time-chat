import express from 'express'
import logger from 'morgan'

import { Server } from 'socket.io'
import { createServer } from 'node:http'

const app = express()
const server = createServer(app)
const io = new Server(server)

io.on('connection', () => {
  console.log('An user has connected!')
})

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

const PORT = process.env.PORT ?? 3000

server.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`)
})
