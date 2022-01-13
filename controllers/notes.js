//Conectar con postgres

const { Pool } = require('pg')
const pool = new Pool({
    connectionString: 'postgres://llqxnsbjwqcrna:a531c0f882b4e67f4bdae011c1e4638e06c9a6dad62060c16d885a05fec47f6d@ec2-3-225-41-234.compute-1.amazonaws.com:5432/df2im97ec5p3eh',
  ssl: {
    rejectUnauthorized: false
  }
})

Date.prototype.dateToInsert = function () {
    let mm = this.getMonth() + 1 // getMonth() is zero-based
    let dd = this.getDate()
    let hh = this.getHours()
    let min = this.getMinutes()
    let sec = this.getSeconds()

    arrayDate = [
        (dd > 9 ? '' : '0') + dd,
        (mm > 9 ? '' : '0') + mm,
        this.getFullYear()
    ]

    arrayTime = [
        (hh > 9 ? '' : '0') + hh,
        (min > 9 ? '' : '0') + min,
        (sec > 9 ? '' : '0') + sec,
    ]

    return arrayDate.join('/') + ' ' + arrayTime.join(':')
};

const getNotes = async (req, res) => {
    await pool.query("SELECT id, title, description, to_char(datecreated, 'DD/MM/YYYY HH12:MI:SS') as formatted_datecreated, to_char(datemodified, 'DD/MM/YYYY HH12:MI:SS') as formatted_datemodified, color FROM notes WHERE userid = $1 AND archived = false AND trash IS NULL ORDER BY datemodified DESC", [req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        // console.log('Result:', result.rows)
        if (result.rowCount == 0) {
            return res.status(404).send({
                message: 'There are no notes'
            })
        }
        let contador = 0
        for (let i = 0; i < result.rowCount; i++) {

            pool.query('SELECT name FROM tags WHERE noteid = $1', [result.rows[i].id], (err, result2) => {
                if (err) {
                    return res.status(500).send({
                        message: 'Error executing query 2'
                    })
                }
                const arrayTags = []
                for (let j = 0; j < result2.rowCount; j++) {
                    arrayTags.push(result2.rows[j].name)
                }

                result.rows[i].tags = arrayTags
                contador ++; 
                console.log('contador:', contador)
                if (contador == result.rowCount) {
                    console.log(result.rows)
                    return res.status(200).send(result.rows)
                }
            })


        }

    })
}

const createNote = async (req, res) => {
    let time = new Date()
    time = time.dateToInsert()
    const { title, description, color } = req.body
    await pool.query('INSERT INTO notes(title, description, userid, datecreated, datemodified, archived, color) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [title, description, req.user.id, time, time, false, color], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }   
        console.log(result)
        return res.status(200).send({
            message: 'Note created successfully',
            body: {
                 title, description, id: result.rows[0].id, dateCreated: time, dateModified: time, color  
            }
        })
    })

}

const updateNote = async (req, res) => {

    const { id, title, description, color } = req.body
    let time = new Date()
    time = time.dateToInsert()

    await pool.query('UPDATE notes SET title = $1, description = $2, datemodified = $3, color = $4 WHERE id = $5 AND userid = $6', [title, description, time, color, id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (result.rowCount == 0 ){
            return res.status(450).send({
                message: 'Note does not exist'
            })
        }
        return res.status(200).send({
            message: 'Note updated successfully',
            body: {
                 title, description, dateModified: time, color, id
            }
        })
    })

}


const getNoteById = async (req, res) => {
    const id = req.body.id

    await pool.query("SELECT title, description, to_char(datecreated, 'DD/MM/YYYY HH12:MI:SS') as datecreated, to_char(datemodified, 'DD/MM/YYYY HH12:MI:SS') as datemodified FROM notes WHERE id = $1 AND userid = $2", [id, req.user.id], (err, notes) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (notes.rowCount == 0) {
            return res.status(450).send({
                message: 'Note does not exist'
            })
        }

        pool.query('SELECT name FROM tags WHERE noteid = $1', [id], (err, tags) => {
            if (err) {
                return res.status(500).send({
                    message: 'Error executing query'
                })
            }
            const arrayTags = []
            for (let i = 0; i < tags.rowCount; i++) {
                arrayTags.push(tags.rows[i].name)
            }

            notes.rows[0].tags = arrayTags
            return res.status(200).send(notes.rows)
        })

    })

}

const addTag = async (req, res) => {
    const tag = req.body.tags
    const id = req.body.id


    await pool.query('SELECT * FROM notes WHERE id = $1 AND userid = $2', [id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        if (result.rowCount == 0) {
            return res.status(450).send({
                message: 'Note does not exist'
            })
        }

        pool.query('SELECT name FROM tags WHERE noteid = $1', [id], (err, result) => {
            add = true
            if (err) {
                return res.status(500).send({
                    message: 'Error executing query'
                })
            }
            
            for (let i = 0; i < result.rowCount; i++) {
                console.log(result.rows[i])
                if (result.rows[i].name == tag) {
                    add = false
                    return res.status(205).send({
                        message: 'Tag already exist!'
                    })
                }

            }
            if (add) {
                pool.query('INSERT INTO tags (noteid, name) VALUES($1, $2)', [id, tag], (err, result) => {
                    if (err) {
                        return res.status(500).send({
                            message: 'Error executing query'
                        })
                    }

                    return res.status(200).send({
                        message: 'Tag added'
                    })
                })

            }

        })


    })

}


const removeTagById = async (req, res) => {
    const tag = req.body.tags
    const id = req.body.id
    await pool.query('DELETE FROM tags WHERE noteid = $1 AND name = $2', [id, tag], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error removing tag'
            })
        }
        if (result.rowCount == 0) {
            return res.status(450).send({
                message: 'Note does not exist'
            })
        }
        return res.status(200).send({
            message: 'Tag Removed'
        })
    })
}

//TODO getNotesByTag
const getNotesByTag = async (req, res) => {
    const tag = req.body.tag

    await pool.query("SELECT notes.id, title, description, to_char(datecreated, 'DD/MM/YYYY HH12:MI:SS') as datecreated, to_char(datemodified, 'DD/MM/YYYY HH12:MI:SS') as datemodified FROM tags, notes WHERE name = $1 AND notes.id = tags.noteid AND userid = $2", [tag, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query'
            })
        }
        if (result.rowCount == 0) {
            return res.status(450).send({
                message: 'Tag does not exist'
            })
        }
        res.status(200).send(result.rows)

    })
}

const getTags = async (req, res) => {

    arrayTags = []
    await pool.query('SELECT DISTINCT name FROM tags, notes WHERE  notes.id = tags.noteid AND userid = $1', [req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query'
            })
        }
        if (result.rowCount == 0) {
            return res.status(450).send({
                message: 'There are no tags'
            })
        }
        let tags = []
        for (let i = 0; i < result.rowCount; i++) {
            tags.push(result.rows[i].name)
        }
        return res.status(200).send(tags)

    })
}

const removeTag = async (req, res) => {
    tag = req.body.tag

    await pool.query("DELETE FROM tags WHERE name = $1 AND noteid IN (SELECT id FROM notes WHERE userid = $2)", [tag, req.user.id], (err, result) => {
        console.log(result)
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                Error: err
            })
        }
        if (result.rowCount == 0) {
            return res.status(450).send({
                message: 'Tag does not exist'
            })
        }

        return res.status(200).send({
            message: 'Tag removed successfully!',
        })


    })
}

const sendToTrash = async (req, res) => {
    const id = req.body.id
    let time = new Date()
    time = time.dateToInsert()
    await
        pool.query("UPDATE notes SET trash = $1 WHERE id = $2 AND trash IS NULL", [time, id], (err, result) => {
            if (err) {
                return res.status(500).send({
                    message: 'Error sending note to the trash'
                })
            }
            if (result.rowCount == 0) {
                return res.status(450).send({
                    message: 'Note does not exist'
                })
            }
            return res.status(200).send({
                message: 'OK',
                body: 'Note moved to the trash'
            })
        })
}

const deleteFromTrash = async (req, res) => {
    id = req.body.id
    await
        pool.query("UPDATE notes SET trash = NULL WHERE id = $1 AND userid = $2 AND trash IS NOt NULL", [id, req.user.id], (err, result) => {
            if (err) {
                return res.status(500).send({
                    message: 'Error deleting note from trash'
                })
            }
            if (result.rowCount == 0) {
                return res.status(450).send({
                    message: 'Note not exist'
                })
            }
            return res.status(200).send({
                message: 'Note delete from trash'
            })
        })
}

const archive = async (req, res) => {
    id = req.body.id
    await
        pool.query("UPDATE notes SET archived = true WHERE id = $1 AND userid = $2 AND archived = false", [id, req.user.id], (err, result) => {
            if (err) {
                return res.status(500).send({
                    message: 'Error executing query'
                })
            }
            if (result.rowCount == 0) {
                return res.status(450).send({
                    message: 'Note does not exist'
                })
            }
            return res.status(200).send({
                message: 'Note archived'
            })
        })

}


const unarchive = async (req, res) => {
    id = req.body.id
    await
        pool.query("UPDATE notes SET archived = false WHERE id = $1 AND userid = $2 AND archived != false", [id, req.user.id], (err, result) => {
            if (err) {
                return res.status(500).send({
                    message: 'Error executing query'
                })
            }
            if (result.rowCount == 0) {
                return res.status(450).send({
                    message: 'Note does not exist'
                })
            }
            return res.status(200).send({
                message: 'Note unarchived'
            })
        })

}

const getNotesArchived = async (req, res) => {
    
    await pool.query("SELECT id, title, description, to_char(datecreated, 'DD/MM/YYYY HH12:MI:SS') as datecreated, to_char(datemodified, 'DD/MM/YYYY HH12:MI:SS') as datemodified FROM notes WHERE userid = $1 AND archived = true AND trash IS NULL", [req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        // console.log('Result:', result.rows)
        if (result.rowCount == 0) {
            return res.status(404).send({
                message: 'There are no notes'
            })
        }
        let contador = 0
        for (let i = 0; i < result.rowCount; i++) {

            pool.query('SELECT name FROM tags WHERE noteid = $1', [result.rows[i].id], (err, result2) => {
                if (err) {
                    return res.status(500).send({
                        message: 'Error executing query 2'
                    })
                }
                const arrayTags = []
                for (let j = 0; j < result2.rowCount; j++) {
                    arrayTags.push(result2.rows[j].name)
                }

                result.rows[i].tags = arrayTags
                contador ++; 
                console.log('contador:', contador)
                if (contador == result.rowCount) {
                    console.log(result.rows)
                    return res.status(200).send(result.rows)
                }
            })


        }

    })
}

const getTrashNotes = async (req, res) => {
    
    await pool.query("SELECT id, title, description, to_char(datecreated, 'DD/MM/YYYY HH12:MI:SS') as datecreated, to_char(datemodified, 'DD/MM/YYYY HH12:MI:SS') as datemodified FROM notes WHERE userid = $1 AND trash IS NOT NULL", [req.user.id], (err, result) => {
        if (err) {
            return res.status(500).send({
                message: 'Error executing query',
                errMessage: err
            })
        }
        // console.log('Result:', result.rows)
        if (result.rowCount == 0) {
            return res.status(404).send({
                message: 'There are no notes'
            })
        }
        let contador = 0
        for (let i = 0; i < result.rowCount; i++) {

            pool.query('SELECT name FROM tags WHERE noteid = $1', [result.rows[i].id], (err, result2) => {
                if (err) {
                    return res.status(500).send({
                        message: 'Error executing query 2'
                    })
                }
                const arrayTags = []
                for (let j = 0; j < result2.rowCount; j++) {
                    arrayTags.push(result2.rows[j].name)
                }

                result.rows[i].tags = arrayTags
                contador ++; 
                console.log('contador:', contador)
                if (contador == result.rowCount) {
                    console.log(result.rows)
                    return res.status(200).send(result.rows)
                }
            })


        }

    })
}

//TODO modificar las rutas para archivar y papelera

module.exports = {
    getNotes,
    createNote,
    updateNote,
    getNoteById,
    addTag,
    removeTagById,
    getNotesByTag,
    getTags,
    removeTag,
    sendToTrash,
    deleteFromTrash,
    archive,
    unarchive,
    getNotesArchived,
    getTrashNotes
}

