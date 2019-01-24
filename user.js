//npm modules
const mongoose  =   require ('mongoose')

const schema_history = {
    //1 = merge, 2 = artist, 3 = shared
    command: {type: Number, required: true},
    desc: String,       //merged my playlists
                        //crete new playlist based on artist
                        //merge playlist with another user
    pl_1: String,       //1st PL id
    pl_2: String,       //2nd PL id
    pl_new: String,     //new PL id
    uid_shares: String, //id of user who shared playlist
                        //if not shared then null
    art_id: String,     //artist id
                        //if merge then null
    art_name: String    //artist name
}
const History = new mongoose.Schema(schema_history)

const schema_user = {
    //Spotify id
    id: {type: String, required: true},
    //Refresh Token
    RT: {type: String, required: true},
    //Access Token
    AT: {type: String, required: true},
    //Spotify display_name
    name: {type: String, required: true},
    //Spotify images[0].url
    img: String,
    //History array
    history: [History]
}
const user_schema = new mongoose.Schema(schema_user)
const User = new mongoose.model('User', user_schema)

module.exports = User