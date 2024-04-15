import express from 'express'
import logger from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'

import { Server } from 'socket.io'
import { createServer } from 'node:http'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  connectionStateRecovery: {}
})

const db = createClient({
  url: 'libsql://lenient-gargoyle-matias-martearena.turso.io',
  authToken: process.env.DB_TOKEN
})

await db.execute(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  user TEXT
);
`)

io.on('connection', async (socket) => {
  socket.on('chat message', async (msg) => {
    let result
    const username = socket.handshake.auth.username ?? 'Anonymous'
    console.log({ username })

    try {
      result = await db.execute({
        sql: 'INSERT INTO messages (content, user) VALUES (:msg, :username);',
        args: { msg, username }
      })
    } catch (e) {
      console.error(e)
      return
    }

    io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
  })

  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: 'SELECT id, content, user FROM messages WHERE id > ?;',
        args: [socket.handshake.auth.serverOffset ?? 0]
      })

      results.rows.forEach(row => {
        socket.emit('chat message', row.content, row.id.toString(), row.user)
      })
    } catch (e) {
      console.error(e)
    }
  }
})

app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

const PORT = process.env.PORT ?? 3000

server.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`)
})

// TODO: Poner fechas
// TODO: Mejorar el diseño
// TODO: Tablas mas complejas y que guarden mas info
// TODO: Dependiendo del usuario que se vea un fondo distinto
// TODO: Validacion de datos
// TODO: Cookies para el usuario
