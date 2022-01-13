//Conectar con postgres
const { Pool } = require('pg')
const pool = new Pool({
    connectionString: 'postgres://llqxnsbjwqcrna:a531c0f882b4e67f4bdae011c1e4638e06c9a6dad62060c16d885a05fec47f6d@ec2-3-225-41-234.compute-1.amazonaws.com:5432/df2im97ec5p3eh',
  ssl: {
    rejectUnauthorized: false
  }
})
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
// require('dotenv').config()

const getUsers = async (req, res) => { //es asíncrona, por lo que está esperando respuesta
    await pool.query('SELECT * FROM users', [], (err, result) => {
        if (err) {
            res.status(500).json({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (result.rowCount == 0) return res.status(404).send({
            message: 'There are no users'
        })
        res.status(200).json(result.rows)
    })

}


const signUpUser = async (req, res) => {
    const { name, email, password } = req.body
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    if (name != null || email != null || password != null) {

        await pool.query('INSERT INTO users(name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING', [name, email, hash], (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Error executing query',
                    errMessage: err
                })
            }
            if(result.rowCount == 0) {
                return res.status(450).send({
                    message: 'User already exist'
                })
            }
            res.status(200).json({
                message: 'User created successfully',
                body: {
                    user: { name, email, password: hash }
                }
            })
        })
    } else {
        res.status(404).send({
            message: 'Error: Check yout JSON content, the information is invalid'
        })
    }

}

const getUserById = async (req, res) => {
    const id = req.params.id
    await (await pool.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (result.rowCount == 0) return res.status(404).send({
            message: 'User does not exists'
        })

        res.status(200).send(
            result.rows[0]
        )
    }))

}

const deleteUser = async (req, res) => {
    const id = req.params.id
    await pool.query('DELETE FROM users WHERE id = $1', [id], (err, result) => {

        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (result.rowCount == 0) return res.status(404).send({
            message: 'User does not exists'
        })

        res.status(200).send({
            message: 'User does not exists'
        })
    })
}

const updateUser = async (req, res) => {
    const id = req.params.id
    const { name, email } = req.body
    await pool.query('UPDATE users SET name = $1, email = $2 WHERE id =$3', [name, email, id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        res.status(201).json({
            message: 'User updated successfully',
            body: {
                user: {
                    id,
                    name,
                    email
                }
            }
        })
    })

}
const createUsersTable = async (req, res) => {
    // const id = req.params.id
    // const { name, email } = req.body
    await pool.query('CREATE TABLE users (id integer NOT NULL,name character varying(40),email text,password text);', (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        res.status(201).json({
            message: 'table created',
            // body: {
            //     user: {
            //         id,
            //         name,
            //         email
            //     }
            // }
        })
    })

}

const signInUser = async (req, res) => {

    const email = req.body.email
    const password = req.body.password
    let passwordIsValid = false
    await pool.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (result.rowCount == 0) {
            return res.status(404).send({
                auth: false, 
                message: 'Incorrect email'
            })
        }

        if (bcrypt.compareSync(password, result.rows[0].password)) {
            passwordIsValid = true
        }
        if (!passwordIsValid) return res.status(401).send({ auth: false, message: 'Password is not valid' })
        let token = jwt.sign(
            { id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: 86400 }  //expires in 24 hours
        )
        res.status(200).send({ auth: true, token: token, name: result.rows[0].name, email: result.rows[0].email });
    })
}

module.exports = {
    getUsers,
    signUpUser,
    getUserById,
    deleteUser,
    updateUser,
    signInUser,
    createUsersTable
}



//TODO Preveer que no se hagan usuarios repetidos