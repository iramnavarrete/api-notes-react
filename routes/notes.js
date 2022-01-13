const { Router } = require('express')
const router = Router()

const notesController = require('../controllers/notes')

router.post('/createNote', notesController.createNote)
router.get('/getNotes', notesController.getNotes) 
router.patch('/updateNote', notesController.updateNote)
router.post('/getNote', notesController.getNoteById)
router.patch('/addTag', notesController.addTag)
router.delete('/removeTagById', notesController.removeTagById)
router.post('/getNoteByTag', notesController.getNotesByTag)
router.get('/getTags', notesController.getTags)
router.delete('/removeTag', notesController.removeTag) 
router.patch('/sendToTrash', notesController.sendToTrash)
router.patch('/deleteFromTrash', notesController.deleteFromTrash)
router.patch('/archive', notesController.archive)
router.patch('/unarchive', notesController.unarchive)
router.get('/getArchived', notesController.getNotesArchived)
router.get('/getTrashNotes', notesController.getTrashNotes)




module.exports = router