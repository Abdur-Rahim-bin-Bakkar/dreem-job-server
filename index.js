const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const applicationCollection = hireloopUsersDB.collection('applications');
    const plans = hireloopUsersDB.collection('plans')
    const subscriptions = hireloopUsersDB.collection('subscriptions')
    const userCollection = hireloopUsersDB.collection('user')



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

    //get single job
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      const job = await jobCollections.findOne({ _id: new ObjectId(id) })
      res.send(job)

    })




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


    //get all company
    app.get('/all/company', async (req, res) => {
      const result = await companyCollection.find().toArray()
      res.send(result || [])
      console.log(result, 'this is company resule')
    })
    //update company status

    app.patch('/company/:id/status', async (req, res) => {
      try {
        const companyId = req.params.id;
        const { status } = req.body;

        // optional: validate status
        const allowedStatus = ['pending', 'approved', 'rejected'];
        if (!allowedStatus.includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }

        const result = await companyCollection.updateOne(
          { _id: new ObjectId(companyId) },
          {
            $set: {
              status: status,
            },
          }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'Company not found or status not changed' });
        }

        res.json({
          message: 'Status updated successfully',
          result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    });


    //post applications:
    app.post('/application', async (req, res) => {
      const application = req.body;
      const newApplication = {
        ...application,
        createAt: new Date()
      }
      const result = await applicationCollection.insertOne(newApplication);
      res.send(result)
      console.log(result, 'application post console')
    })

    app.get("/application", async (req, res) => {
      try {
        // const { applicantId } = req.query;
        const query = { applicantId: req.query.applicantId }
        // if(req.query.applicantId){
        //   query.applicantId = req.query.applicantId
        // }

        const applications = await applicationCollection
          .find(query)
          .toArray();

        res.send(applications);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch applications",
        });
      }
    });


    // get plans:
    app.get('/plans', async (req, res) => {
      const query = {}
      if (req.query.plan_id) {
        query.id = req.query.plan_id
      }
      const result = await plans.findOne(query);
      res.send(result)
    })


    //post subscription history:
    app.post('/subscription', async (req, res) => {
      const data = req.body;
      const newData = {
        ...data,
        createAt: new Date()
      }
      const result = await subscriptions.insertOne(newData);
      res.send(result)

      const filter = { email: data?.email }
      const updateDocument = {
        $set: {
          plan: data?.planType
        }
      }
      const updateResult = await userCollection.updateOne(filter, updateDocument)

    })


    //get all users:
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
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