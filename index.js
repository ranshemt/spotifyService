//npm modules
const express       =   require ('express')
//my modules
const ctrl          =   require ('./controller')
const asyncWrapper  =   require ('./async.wrapper')

//Establish app()
const app   =   express()
const port  =   process.env.PORT || 3000

//Middleware(s)
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//Routes
app.get('/basicData/:id', asyncWrapper(ctrl.basicData))
app.get('/newAT/:id', asyncWrapper(ctrl.newAT))
app.get('/invalidAT/:id', asyncWrapper(ctrl.invalidAT))
app.get('/welcomeMsg/:id', asyncWrapper(ctrl.welcomeMsg))
app.get('/getPlaylists/:id', asyncWrapper(ctrl.getPlaylists))
app.get('/getTracks/:id&:pl_id', asyncWrapper(ctrl.getTracks))
app.get('/getTopArtists/:id', asyncWrapper(ctrl.getTopArtists))
app.get('/artistTopTracks/:id&:art_id', asyncWrapper(ctrl.artistTopTracks))

app.post('/newPL/:id', asyncWrapper(ctrl.newPL))
app.put('/addToPL/:id&:pl_id', asyncWrapper(ctrl.addToPL))


//Run the server
app.listen(port,
    () => console.log(`Express server ready on port: ${port}`))