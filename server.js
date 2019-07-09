const express = require('express')
const app = express()
const multer = require('multer');
const fs = require('fs-extra')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId

app.use(express.urlencoded({extended: true}))

// Connection to mongodb
const myurl = 'mongodb://localhost:27017';

// Specify the storage type
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

// Configure the multer middleware
const upload = multer({ storage: storage })

// Create a connection to the mongodb database
MongoClient.connect(myurl, (err, client) => {
  if (err) return console.log(err)
  db = client.db('test') 
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

// Render the html form page
app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');

});

/* 
  upload single file 
  ** This is image is not stored in the db

*/
app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
  const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
  res.send(file)
 
})

/* 
  Uploading multiple files for a single field
  ** This is image is not stored in the db

*/
app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
  const files = req.files
  if (!files) {
    const error = new Error('Please choose files')
    error.httpStatusCode = 400
    return next(error)
  }
  res.send(files)
})

/* 
  Uploading multiple images for multiple fields
  ** These images are stored into the mongodb database

*/
app.post('/uploadphoto', upload.fields([{name:'profilePic',maxCount:1},{name:'UACE',maxCount:1}]), (req, res) => {
  const files = req.files
  console.log(files)
  if(!files || Object.keys(files).length === 0){
    return res.send({error: "Please upload atleast one image"})
  }

  const profilePic = files['profilePic'][0]
  const UACE = files['UACE'][0]

  
  const profilePic1 = files['profilePic'] ? fs.readFileSync(profilePic.path): null
  const UACE1 = files['UACE'] ? fs.readFileSync(UACE.path): null


 const profilePicEncoded = profilePic ? profilePic1.toString('base64'): null
 const UACEEncoded = UACE ? UACE1.toString('base64'):null
 
 const images =  [
   { 
    name: "profile",
    contentType: profilePic ? profilePic.mimetype: null,
    image:  profilePicEncoded ? new Buffer(profilePicEncoded, 'base64'): null
  },
  { 
    name: "UACE",
    contentType: UACE ? UACE.mimetype: null,
    image:  UACEEncoded ? new Buffer(UACEEncoded, 'base64'): null
  }
 ]

db.collection('mycollection').insertMany(images, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/')
  })
})


app.get('/photos', (req, res) => {
db.collection('mycollection').find().toArray((err, result) => {

  	const imgArray= result.map(element => element._id);
			console.log(imgArray);

   if (err) return console.log(err)
   res.send(imgArray)
  })
});

app.get('/photo/:id', (req, res) => {
var filename = req.params.id;

db.collection('mycollection').findOne({'_id': ObjectId(filename) }, (err, result) => {
    if (err) return console.log(err)
    const {image, contentType} = result;
   res.contentType(contentType);
   res.send(image.buffer)
  })
})


app.get('/photos/:id', (req, res) => {
  var filename = req.params.id;
  
  db.collection('mycollection').findOne({'_id': ObjectId(filename) }, (err, result) => {
  
      if (err) return console.log(err)
  
      const {name, _id} = result;
     res.send({
      status: 200,
      data: {
        name: name,
        image: `http://localhost:3000/photo/${_id}`,
      }
     })
    })
  })
  

  /*
  
  taxRegistrationDoc: { type: String, trim: true },
        // taxRegistrationDoc: { image: Buffer, contentType: String },

        nationalIdDoc: { type: String, trim: true },
        // nationalIdDoc: { image: Buffer, contentType: String },
        nationalIdNumber: { type: Number, trim: true, unique: true, sparse: true },
  */

