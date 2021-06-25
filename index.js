const express = require('express')
const app = express()
var cors = require('cors')
var bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
var admin = require("firebase-admin");
const port = 4000


app.use(cors())
app.use(bodyParser.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(fileUpload());

app.get('/', (req, res) => {
  res.send('Hello World!')
})




var serviceAccount = require("./landscaping-service-firebase-adminsdk-oq8se-de8c593363.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://LandScaping:M6PrfcivoZi7zO36@cluster0.nj4m0.mongodb.net/landScapingService?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("landScapingService").collection("booked");
  const service = client.db("landScapingService").collection("adds");
  const adminCollection = client.db("landScapingService").collection("admin");
  const reviewCollection = client.db("landScapingService").collection("review");

  app.post('/addService',(req,res) =>{
    const file = req.files.file
    const name = req.body.name
    const price = req.body.price
    const description = req.body.description
    const newImg = file.data
    const encImg = newImg.toString('base64')

    const image ={
      contentType:file.mimetype,
      size:file.size,
      img:Buffer.from(encImg,'base64')
    };
    
    service.insertOne({name,description,price,image})
    .then(result =>{
      res.send(result.insertedCount > 0)
      console.log(result)
    })
    console.log(name,description,image);
  })


  app.get('/serviceShow',(req,res) =>{
    service.find({})
    .toArray((err,document) =>{
      res.send(document)
    })
  })

  app.post('/bookinged', (req, res) => {
    const newBooking = req.body
    collection.insertOne(newBooking)
      .then(result => {
        res.send(result)
      })
    console.log(newBooking)
  })

  app.get('/showBooking', (req, res) => {
    const bearer = req.headers.authorization
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log(idToken)
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          console.log(tokenEmail);
          const email = req.query.email;
          if (tokenEmail === email) {
            collection.find({ email: email })
              .toArray((err, item) => {
                res.send(item)
                console.log(item)
              })
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  })

  app.post('/review',(req,res) =>{
    const inFo = req.body
    console.log(inFo)
    reviewCollection.insertOne(inFo)
    .then(result =>{
      res.send(result.insertedCount > 0)
    })
  })

  app.get('/reviewShow',(req,res) =>{
    reviewCollection.find({})
    .toArray((err,data) =>{
      res.send(data)
    })
  })

 app.get('/allBookingService',(req,res) =>{
   collection.find()
   .toArray((err,documents)=>{
     res.send(documents)
   })
 })

 app.post('/adminAdded',(req,res) =>{
   const admin = req.body.email
   console.log({email:admin})
   adminCollection.insertOne({email:admin})
   .then(result =>{
     res.send(result)
     console.log(result)
   })
 })

 app.post('/accessAdmin',(req,res) =>{
   const email = req.body.email
   adminCollection.find({email:email})
   .toArray((err,admins)=>{
     res.send(admins.length > 0)
   })
 })

});




app.listen(process.env.PORT || port)