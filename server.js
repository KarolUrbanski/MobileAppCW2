//Import the express, and properties-reader modules
const express = require("express");
let propertiesReader = require("properties-reader");
const { MongoClient, ServerApiVersion } = require("mongodb");
var ObjectId = require('mongodb').ObjectID;
const path = require("path");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

//Create express app and configure it with body-parser
const app = express();

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

app.param("collectionName", function (req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  return next();
});

app.get("/lessons/:collectionName", (req, res) => {
  req.collection
    .find({}, { sort: [["price", -1]] })
    .toArray(function (err, results) {
      if (err) {
        return next(err);
      }
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
    { $inc: {space:-1} },
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

async function lessons(request, response) {
  response.json(data);
}

//Start the app listening on port 8080
const port = process.env.PORT || 8080;
app.listen(port, function() {
console.log("App started on port: " + port);
});