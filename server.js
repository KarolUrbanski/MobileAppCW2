//Import the express, and properties-reader modules
const express = require("express");
let fs = require("fs");
const path = require("path")
let propertiesReader = require("properties-reader");
const { MongoClient, ServerApiVersion } = require("mongodb");
var ObjectId = require('mongodb').ObjectID;
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);
let cors = require("cors")


//Create express app and configure it with body-parser
const app = express();

app.use(cors());
//URL-Encoding of User and PWD
//for potential special characters
let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");
const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

//Set up express to serve static files from the directory called 'public'
app.use(express.static("public"));
app.use(express.json());

//Status codes defined in external file
require("./http_status.js");

app.use(function (req, res, next) {
  console.log("Recive request with method: " + req.method + " and url:" + req.url);
  next();
});
app.use('/static',function (req, res, next) {
  let filePath = path.join(__dirname, "static", req.url);
  fs.stat(filePath, function (err, fileInfo) {
    if (err) {
      next();
      return;
    }
    if (fileInfo.isFile()) {
      res.sendFile(filePath);
    } else {
      next();
    }

  })
});


app.param("collectionName", function (req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  console.log(collectionName);
  return next();
});
app.get("/lessons/:collectionName", (req, res) => {
  req.collection
    .find({}, { sort: [["price", -1]] })
    .toArray(function (err, results) {
      if (err) {
        return next(err);
      }
      res.set({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.send(results);
    });
});
app.post("/collections/:collectionName", function (req, res, next) {
  // TODO: Validate req.body
  console.log(req.body);
  req.collection.insertOne(req.body, function (err, results) {
    if (err) {
      return next(err);
    }
    res.send(results);
  });
});
app.put("/collections/:collectionName/:id", function (req, res, next) {
  // TODO: Validate req.body
  console.log(req.params.id);
  req.collection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $inc: { space: -1 } },
    { safe: true, multi: false },
    function (err, result) {
      if (err) {
        return next(err);
      } else {
        res.send(
          result.matchedCount === 1 ? { msg: "success" } : { msg: "error" }
        );
      }
    }
  );
});

app.use(function(req,res){
  res.status(404);
  res.send("file/site not found");
});
//Start the app listening on port 8080

const port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log("App started on port: " + port);
});