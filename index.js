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


    app.post('/jobspost', async (req, res) => {
      const job = req.body;
      const result = await jobCollections.insertOne(job)
      console.log(result)
      res.send(result)
    })


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