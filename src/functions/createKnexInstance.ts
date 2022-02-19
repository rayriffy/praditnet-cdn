import knex from 'knex'
import dotenv from 'dotenv'

dotenv.config()

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USER,
  DATABASE_PASS,
  DATABASE_PANET_NAME,
} = process.env

export const createKnexInstance = (database: string = DATABASE_PANET_NAME) => {
  return knex({
    client: 'mysql',
    connection: {
      host: DATABASE_HOST,
      port: Number(DATABASE_PORT),
      user: DATABASE_USER,
      password: DATABASE_PASS,
      database: database,
    },
  })
}
