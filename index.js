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
app.get('/basicData', asyncWrapper(ctrl.basicData))
app.get('/newAT', asyncWrapper(ctrl.newAT))
app.get('/welcomeMsg/:id', asyncWrapper(ctrl.welcomeMsg))

//Run the server
app.listen(port,
    () => console.log(`Express server ready on port: ${port}`))