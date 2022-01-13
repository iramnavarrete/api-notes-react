const { Router } = require('express')
const router = Router()

const userController = require('../controllers/users')

router.get('/', userController.getUsers)
router.get('/:id', userController.getUserById)
router.post('/register', userController.signUpUser)
router.post('/login', userController.signInUser)
router.delete('/:id', userController.deleteUser)
router.put('/:id', userController.updateUser)



module.exports = router