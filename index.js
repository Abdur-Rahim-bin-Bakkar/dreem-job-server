const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv')
const cors = require('cors')
const dns = require("node:dns").promises;
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const app = express()
dotenv.config();
const port = 5000

app.use(cors())
app.use(express.json())

// this is home page for check server
app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = process.env.MONGO_DB_URI
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const hireloopUsersDB = client.db("hireloopUsers")
    const jobCollections = hireloopUsersDB.collection('jobs')
    const companyCollection = hireloopUsersDB.collection('company')



    // post job
    app.post('/jobspost', async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createAt: new Date()
      }
      const result = await jobCollections.insertOne(newJob)
      console.log(result)
      res.send(result)
    })

    //get all jos
    // app.get('/all/jobs', async (req, res) => {
    //   const jobs = await jobCollections.find().toArray();
    //   res.send(jobs)
    // })
    app.get('/all/jobs', async (req, res) => {
      const {
        search,
        category,
        type,
        remote
      } = req.query;

      const query = {};

      if (search) {
        query.jobTitle = {
          $regex: search,
          $options: "i"
        };
      }

      if (category) {
        query.jobCategory = category;
      }

      if (type) {
        query.jobType = type;
      }

      if (remote) {
        query.isRemote = remote === "true";
      }

      const jobs = await jobCollections.find(query).toArray();

      res.send(jobs);
    });


    // get recruiter jobs
    app.get('/jobs', async (req, res) => {
      try {
        const query = {};

        // যদি companyId আসে
        if (req.query.companyId) {
          query.companyId = req.query.companyId;
        }

        // যদি status আসে
        if (req.query.status) {
          query.status = req.query.status;
        }

        const jobs = await jobCollections.find(query).toArray();

        res.send(jobs);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server Error" });
      }
    });


    // post company
    app.post('/companypost', async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createAt: new Date()
      }
      const result = await companyCollection.insertOne(newCompany)
      console.log(result)
      res.send(result)
    })


    //get my company
    app.get('/my/company', async (req, res) => {
      const query = {}
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId
      }
      const result = await companyCollection.findOne(query)
      res.send(result || {})
      console.log(result, 'this is company resule')
    })









    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})