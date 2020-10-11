const bodyParser = require('body-parser')
const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    site: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    route: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    data: {
        // type: mongoose.Schema.Types.Mixed,
        type: Object,
        required: true,
    },
})

visitSchema.set('timestamps', true)

const Visit = mongoose.model('Visit', visitSchema);

(async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ekid9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
        )
        console.log('::: Connected to the database successfully.')
    }
    catch (reason) {
        console.log('::: Error! Could not connected to the database!', reason)
    }

    const server = express()

    server.use(helmet())
    server.use(compression())
    server.use(bodyParser.json())

    server.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-With, Content-Type, Accept, Authorization')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
        next()
    })

    server.get('/api/health', (req, res) => res.json({ message: 'Server is up and running.' }))

    server.get('/api/sites', async (req, res) => {
        let sites
        try {
            sites = await Visit.find({})
        }
        catch (reason) {
            return res.status(500).send(reason.message)
        }

        sites = [...new Set(sites
            .map((site) => site.toObject().site)
            .filter((site) => site))]

        return res.json(sites)
    })

    server.get('/api/visits/:site', async (req, res) => {
        const { site } = req.params

        let visits
        try {
            visits = await Visit.find({ site })
        }
        catch (reason) {
            return res.status(500).send(reason.message)
        }

        return res.json(visits.map((visit) => visit.toObject({ getters: true })))
    })

    server.post('/api/visits', async (req, res) => {
        const { site, route, data } = req.body

        if (!site || !route || !data) {
            return res.status(422).send('Invalid data!')
        }

        let visit
        try {
            visit = new Visit({
                site,
                route,
                data,
            })
            await visit.save()
        }
        catch (reason) {
            return res.status(500).send('Could not save the data!')
        }

        return res.status(201).json(visit.toObject({ getters: true }))
    })

    server.use((req, res) => {
        res.status(404).send('Could not find this route!')
    })

    server.use((err, req, res, next) => {
        console.log('::: Error!:', err)

        if (res.headersSent) {
            return next(err)
        }

        res.status(err.code || 500)
        return res.send(err.message)
    })

    const s = server.listen(process.env.PORT, () => {
        const h = s.address().address
        const p = s.address().port
        console.log(`::: Server listening at http://${h}:${p}.`)
    })
})()
