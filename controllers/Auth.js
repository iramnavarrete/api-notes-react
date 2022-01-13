module.exports = {
    logInUser,
    logOutUser,
    getCurrentUser,
    signUpUser,
    uploadProfilePhoto,
    uploadToS3
}

let User = require('../models/User')
const AWS = require('aws-sdk')
const fs = require('fs')
//bucket-example-1
const s3 = new AWS.S3({
    region:"us-west-2",
    accessKeyId: "AKIAJ7CTHS7E7TEPF64Q",
    secretAccessKey: "SkID88S9+dGnZJLDPPgoAvCQuzqTa07YnXOUdtwW"
})
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const sha256 = require('sha256')
const cloudinary = require('cloudinary').v2
Random = require('meteor-random')
cloudinary.config({
    cloud_name:'ravenegg',
    api_key: '173273979277351',
    api_secret: 'zGjYH6vwUSalJPm2sgSevqUMNaM'
})

function logInUser(req, res){
    console.info("body from request", req.body)
    const email = req.body.email
    const pass = req.body.password
    let passwordIsValid  = false
    User.findOne({'profile.email': email}).then((user)=>{
        console.log(user)
        if(!user) return res.status(404).send('No user found')
        //let passwordIsValid = bcrypt.compareSync(req.pass,user.profile.password)
        if(pass === user.profile.password) passwordIsValid = true
        
        if(!passwordIsValid) return res.status(401).send({auth: false, message: 'Password is not valid'})
        let token = jwt.sign({email: user.profile.email}, process.env.JWT_SECRET, { expiresIn: 864000}  //expires in 24 hours
        )
        res.status(200).send({auth: true, token: token, name: user.profile.username, email:user.profile.email});
    })
}

function logoutUser(req, res) {
    res.status(200).send({auth: false, token: null});
}


function getCurrentUser(req, res) {
    let token = req.headers['authorization'];
    if (!token) return res.status(401).send({auth: false, message: 'No token provided.'});

    let fields = ['id', 'username', 'email'];

    verifyToken(token)
        .then((decoded) => models.findOne({id: decoded.id}))
        .then((user) => {
            if (!user) return res.status(401).send({auth: false, message: 'No user found'});
            res.status(200).send(user)
        })
        .catch((err) => res.status(500).send({err}));

}

function logOutUser(){
    
}

function signUpUser(req, res) {
    console.info("Body from request", req.body)
    const user = new User({
        displayName: req.body.username,
        profile: {
            name:  req.body.name,
            lastname:  req.body.lastname,
            email:  req.body.email,
            password:  req.body.password,
            phone:  req.body.phone,
            birthDate:  req.body.birthDate,
            address:  req.body.address,
            gender:  req.body.gender,
            maritalStatus:  req.body.maritalStatus,
            profileImg:  req.body.profileImg,
            degree:  req.body.degree,
            roles:  req.body.roles
        }
    })

    user.save((err) => {
        let token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {
            expiresIn: 864000 // expires in 24 hours
        });

        if (err) return res.status(500).send({ message: `Error al crear el usuario: ${err}` })

        return res.status(201).send({ token: token, message:'User created' })
    })
}

function uploadProfilePhoto(req, res){
    const path = req.files.file.path
    const uniqueFilename = Random.id()
    const cloudinary = require('cloudinary').v2;
    cloudinary.uploader.upload(path, { public_id: `data/${uniqueFilename}`, tags: `blog` }, (err, result)=> { 
        if (err) return res.send(err)
        fs.unlinkSync(path)
        res.status(200).send({message: "upload image success", imageData: result})
    });
}

function uploadToS3(req,res){
    const path = req.files.file.path
    const file = req.files.file
    let key = ""
    if(file.type==='image/png'){
        key = Random.id() + ".png"
    } else if(file.type==='image/jpg'){
        key = Random.id() + ".jpg"
    } else if(file.type==='image/jpeg'){
        key = Random.id() + ".jpeg"
    }
    fs.readFile(path, (err, data)=>{
        if(err) { throw err }
        const params = {
            Body: data,
            Bucket: "bucket-example-1",
            ACL: 'public-read',
            Key: key
        }
        const url = "https://bucket-example-1.s3-us-west-2.amazonaws.com/"
        s3.putObject(params).promise().then((data)=>{
            fs.unlinkSync(path)
            res.status(200).send({s3Data: data, url: `${url}${key}`})
        }).catch(
            (err)=> res.status(500).send({message: `Error on request ${err}`}
        ))
    })
}