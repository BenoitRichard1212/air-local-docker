const mysql = require('mysql')

const create = function (dbname) {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      user: 'root',
      password: 'password'
    })

    connection.connect(function (err) {
      if (err) {
        reject(err)
      }
    })

    connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbname}\`;`, function (
      err,
      results
    ) {
      connection.destroy()
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

const deleteDatabase = function (dbname) {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      user: 'root',
      password: 'password'
    })

    connection.connect(function (err) {
      if (err) {
        reject(err)
      }
    })

    connection.query(`DROP DATABASE IF EXISTS \`${dbname}\`;`, function (
      err,
      results
    ) {
      connection.destroy()
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

const assignPrivs = function (dbname) {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      user: 'root',
      password: 'password'
    })

    connection.connect(function (err) {
      if (err) {
        reject(err)
      }
    })

    connection.query(
      `GRANT ALL PRIVILEGES ON \`${dbname}\`.* TO 'root'@'%' IDENTIFIED BY 'password';`,
      function (err, results) {
        connection.destroy()
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

module.exports = { create, deleteDatabase, assignPrivs }
