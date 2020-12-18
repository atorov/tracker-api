const bodyParser = require('body-parser')
const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    site: {
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

itemSchema.set('timestamps', true)

const Item = mongoose.model('Item', itemSchema);

(async () => {
    try {
        console.log('::: Connecting to the database...')
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
        let items
        try {
            items = await Item.find({})
        }
        catch (reason) {
            return res.status(500).send(reason.message)
        }

        const sites = [...new Set(items
            .map((item) => item.toObject().site)
            .filter((site) => site))]

        return res.json(sites)
    })

    server.get('/api/items/:site', async (req, res) => {
        const { site } = req.params

        let item
        try {
            item = await Item.findOne({ site })
        }
        catch (reason) {
            return res.status(500).send(reason.message)
        }

        if (!item) {
            return res.status(404).send('Could not find the item!')
        }

        return res.json(item.toObject({ getters: true }))
    })

    server.post('/api/items', async (req, res) => {
        // Validate ------------------------------------------------------------
        const { site, data: _itemData } = req.body
        if (!site || !_itemData) {
            return res.status(422).send('Invalid data!')
        }

        const itemData = Object.entries(_itemData).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: Number(value),
        }), {})

        const isValid = Object.entries(itemData)
            .reduce((acc, [key, value]) => !key.startsWith('__') && (Number(value) > 0 ? acc : false), true)
        if (!isValid) {
            return res.status(422).send('Invalid data!')
        }
        // ---------------------------------------------------------------------

        // Retrieve client IPs --------------------------------------------------
        const hips = req.headers['x-forwarded-for'] ?? ''
        const rips = req.connection.remoteAddress ?? ''
        const ip = (hips ? hips.split(',').pop() : rips.split(',').pop()) ?? ''
        if (ip) {
            itemData[`__clientIp;;${ip.replace(/\./g, '(dot)')}`] = 1
        }
        // ---------------------------------------------------------------------

        // Try to find an existing item ----------------------------------------
        let item
        try {
            item = await Item.findOne({ site })
        }
        catch (reason) {
            return res.status(500).send(reason.message)
        }
        // ---------------------------------------------------------------------

        // Create a new item ---------------------------------------------------
        if (!item) {
            try {
                item = new Item({
                    site, data: itemData,
                })
                await item.save()
            }
            catch (reason) {
                return res.status(500).send(reason.message)
            }

            return res.status(201).json(item.toObject({ getters: true }))
        }
        // ---------------------------------------------------------------------

        // Update an existing item ---------------------------------------------
        try {
            const data = { ...item.data }
            Object.entries(itemData).forEach(([key, value]) => {
                data[key] = data[key] ? data[key] + Number(value) : Number(value)
            })

            item.data = data
            await item.save()
        }
        catch (reason) {
            return res.status(500).send(reason.message)
        }

        return res.status(200).json(item.toObject({ getters: true }))
        // ---------------------------------------------------------------------
    })

    server.options('/api/*', (req, res) => {
        res.sendStatus(200)
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
