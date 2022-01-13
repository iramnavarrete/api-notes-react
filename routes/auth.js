let router = require('express').Router();

const multipart = require('connect-multiparty')

router.use(multipart({
    uploadDir: 'tmp'
}))

let AuthController = require('../controllers/Auth');

router.post('/uploadphoto', AuthController.uploadProfilePhoto)

router.post('/uploads3', AuthController.uploadToS3)


router.post('/register', AuthController.signUpUser);

router.post('/login', AuthController.logInUser);

router.post('/logout', AuthController.logOutUser);

router.get('/me', AuthController.getCurrentUser);

module.exports = router;



