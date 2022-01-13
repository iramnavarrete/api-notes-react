module.exports = {
    getAllJobs,
    getOneJob,
    createJob,
    updateJob,
    deleteJob,
    getJobsByPage,
    uploadJobPhoto,
    nearMe,
    acceptJob,
    activeJobs,
    terminatedJobs,
    terminateJobs
}

const JobsSub = require('../models/Jobs')
const fs = require('fs')
const cloudinary = require('cloudinary').v2
Random = require('meteor-random')
cloudinary.config({
    cloud_name:'ravenegg',
    api_key: '173273979277351',
    api_secret: 'zGjYH6vwUSalJPm2sgSevqUMNaM'
})

function getAllJobs(req, res){
    JobsSub.find({}, (err, concepts)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concepts) return res.status(404).send({message: `Jobs does not exists`})

        res.status(200).send({message: 'Request successful', totalJobs: concepts.length, jobs: concepts})
    })
}

function getJobsByPage(req, res){
    const perPage = parseInt(req.body.perPage)
    const page = parseInt(req.body.page)
    let jobConcepts = null;

    let searchData = req.query.search
    let query = {}

    if(searchData){
        query.$or = [
            {category: {$regex: new RegExp(searchData), $options: 'i'}},
            {address: {$regex: new RegExp(searchData), $options: 'i'}},
        ]
    }

    JobsSub.find(query).skip((page-1)* perPage).limit(perPage).sort({
        publishDate: -1
    }).exec()
    .then((concepts)=>{
        res.set('X-limit', perPage)
        res.set('X-page', page)
        jobConcepts = concepts
        return JobsSub.count()
    }).then((total)=>{
        res.set('X-total', total)
        res.status(200).send({total: total, reqJobs: jobConcepts.length, jobs: jobConcepts})
    }).catch((err)=>{
        res.status(500).send({ message: `Error in the request ${err}` })
    })
}

function getOneJob(req, res){
    let  jobID = req.body._id
    JobsSub.findById(jobID, (err, concept)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concept) return res.status(404).send({message: `Job not exist`})

        res.status(200).send({message: 'Request successful', job: concept})
    })
}

function createJob(req, res){
    const j = {
        _id: Random.id(),
        ...req.body
    }
    let job = new JobsSub(j)

    job.save((err, jobStored)=>{
        if(err) return res.status(400).send({message: `Error on model ${err}`})

        res.status(200).send({job: jobStored})
    })
}

function updateJob(req, res){
     let jobid = req.body._id
     let update = req.body.job
     /*JobsSub.findByIdAndUpdate({_id: jobid}, update, 
        (err, concept)=>{
        if (err) return res.status(500).send({ message: `Error in the request ${err}` })
        res.status(201).send({message:'Job is updated', job: concept})
     })*/
     JobsSub.update({_id: jobid}, {$set: update}, (err, updated)=>{
        if (err) console.log(err)
        res.status(201).send({message:'Job is updated', job: updated})
     })
}

function deleteJob(req, res){
    let jobID = req.body._id

    JobsSub.remove({_id: jobID}, (err, concept)=>{
        if (err) return res.status(500).send({ message: `Error in the request ${err}` })
        res.status(200).send({message: `Remove Completed`, job: concept})
    })
}

function updateDescImages(id, update){
    const jobID = id
    const imgs = update
    console.log("id", jobID)
    console.log("update", imgs)

    JobsSub.findOneAndUpdate({_id: jobID}, 
        {"$push": {"description_img": imgs}}, 
        {"new": true, "upsert":true}, 
        (err, conceptUpdated)=>{
            if(err) res.status(500).send({message: `Error in request ${err}`})
            console.log("jobRequest", conceptUpdated);
            /*res.status(200).send({message: `Update Completed`, job: conceptUpdated})*/
        })
}

function uploadJobPhoto(req, res){
    const path = req.files.file.path
    const jobID = req.body._id
    console.log(jobID)
    const uniqueFilename = Random.id()
    const cloudinary = require('cloudinary').v2;
    cloudinary.uploader.upload(path, { public_id: `jobs/${uniqueFilename}`, tags: `jobs` }, (err, result)=> { 
        if (err) return res.send(err)
        console.log("Cloudinary result", result)
        // "url": "http://res.cloudinary.com/ravenegg/image/upload/v1585857527/jobs/38Mr7jtkz6HCWn5kk.gif",
        //Cesar String change
        /*let routeImg = result.url
        let arrayRoute = routeImg.split("/")
        let finalUrl = arrayRoute[6] + "/"  + arrayRoute[7] + "/" + arrayRoute[8]*/

        //Francisco string change
        let urlString = result.url
        let finalString = urlString.replace("http://res.cloudinary.com/ravenegg/image/upload/", "")

        //Amed String Change
        /*let routeImg = result.url
        let stringImg = routeImg.split("http://res.cloudinary.com/ravenegg/image/upload")
        console.log("string", stringImg)*/


        //console.log("Final Url", finalUrl)
        //updateDescImages(jobID, result.path)
        updateDescImages(jobID, finalString)
        fs.unlinkSync(path)
        res.status(200).send({message: "upload image success", imageData: result})
    });
}

function nearMe(req,res){
    const lat = req.body.lat
    const long = req.body.long
    const offset = 0.2
    const query = {
        "point.lat": {$gte: lat - offset,$lte: lat + offset},
        "point.lng": {$gte: long - offset,$lte: long + offset}
    }
    JobsSub.find(query, (err, concepts)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concepts) return res.status(404).send({message: `Jobs does not exists`})

        res.status(200).send({message: 'Request successful',totalJobs: concepts.length, jobs: concepts})
    })
}

function acceptJob(req,res){
    const userId = req.body.userId
    const jobId = req.body.jobId
    JobsSub.findById(jobId, (err, concept)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concept) return res.status(404).send({message: `Job not exist`})

        concept.workers.push(userId)
        concept.save()
        res.status(200).send({message: 'Request successful', job: concept})
    })
}

function activeJobs(req,res){
    const userId = req.body.userId
    const query = {
        "workers": {
            $elemMatch: { _id: userId } 
        },
        "done": false
    }
    JobsSub.find(query, (err, concept)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concept) return res.status(404).send({message: `Job not exist`})

        
        res.status(200).send({message: 'Request successful', jobs: concept})
    })
}

function terminatedJobs(req,res){
    const userId = req.body.userId
    const query = {
        "workers": {
            $elemMatch: { _id: userId } 
        },
        "done": true
    }
    JobsSub.find(query, (err, concept)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concept) return res.status(404).send({message: `Job not exist`})

        
        res.status(200).send({message: 'Request successful', jobs: concept})
    })
}

function terminateJobs(req,res){
    let  jobID = req.body.jobId
    JobsSub.findById(jobID, (err, concept)=>{
        if(err) return res.status(500).send({message: `Problem with the searching request ${err}`})
        if(!concept) return res.status(404).send({message: `Job not exist`})

        concept.done = true
        concept.save()
        res.status(200).send({message: 'Request successful', job: concept})
    })
}
