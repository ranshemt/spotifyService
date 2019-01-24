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

//Routes - Utilities
app.get('/basicData/:id', asyncWrapper(ctrl.basicData))
app.get('/newAT/:id', asyncWrapper(ctrl.newAT))
app.get('/invalidAT/:id', asyncWrapper(ctrl.invalidAT))
//Routes - View
app.get('/welcomeMsg/:id', asyncWrapper(ctrl.welcomeMsg))
app.get('/getPlaylists/:id', asyncWrapper(ctrl.getPlaylists))
app.get('/getTopArtists/:id', asyncWrapper(ctrl.getTopArtists))
app.get('/getTracks/:id&:pl_id', asyncWrapper(ctrl.getTracks))
app.get('/getHistory/:id', asyncWrapper(ctrl.getHistory))
//Routes - Functionality
app.get('/makePLbyArtist/:id&:art_id', asyncWrapper(ctrl.makePLbyArtist))
//Routes - Functionality (Utilities)
app.get('/artistTopTracks/:id&:art_id', asyncWrapper(ctrl.artistTopTracks))
app.post('/newPL/:id', asyncWrapper(ctrl.newPL))
app.put('/addToPL/:id&:pl_id', asyncWrapper(ctrl.addToPL))
app.put('/addHistory/:id', asyncWrapper(ctrl.addHistory))

//Run the server
app.listen(port,
    () => console.log(`Express server ready on port: ${port}`))