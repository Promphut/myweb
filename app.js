var express = require('express')
var app = express()
var mongo = require('mongodb').MongoClient
var multer = require('multer')
var upload = multer({dest:'uploads/'})
var crypto = require('crypto')
var fs = require('fs')
var granted =[]

app.use(token)
app.use(express.static('public'))
app.use(express.static('img'))
app.use(express.static('uploads'))
app.engine('html',require('ejs').renderFile)
app.get('/',home)
app.get('/test',sentData)
app.get('/kkk',(req,res)=>res.render('test.html',[]))
app.get('/login',(req,res)=>res.render('login.html'))
app.get('/register',(req,res)=>res.render('register.html'))
app.get('/homeuser/:user',(req,res)=>res.render('homeuser.html',{user : granted[req.token]}))
app.post('/register',upload.array(),registerNewUser)
app.post('/login',upload.array(),checkLogin)
app.post('/save-photo', upload.single('photo'))
app.post('/save-photo', savePhoto)
app.get('/profile/:name',(req,res)=>res.render('profile.html',{user:granted[req.token]}))
app.get('/logout',(req,res)=>{
	delete granted[req.token]
	res.render('logout.html')})
app.use((req,res,next)=>{res.send("<h1>404 Not Found</h1>")})	
app.listen(2000)	

function home(req,res) {
	if(granted[req.token]== null){
		res.render('index.html')
	}else{
		res.redirect('/homeuser/'+granted[req.token].fullname)
	}
}
function token(req,res,next) {
	if(req.headers.cookie == null){
		req.headers.cookie = ''
	}
	var t = req.headers.cookie.split(';');
	var d = t[0].split('=')
	if(d[0]=='token'){
		req.token=d[1]
	}
	if(req.token== null){
		req.token = parseInt(Math.random()*1000000000)+'-'+parseInt(Math.random()*1000000000)
		res.set('Set-Cookie','token='+req.token)
	}
	next()
}

function encode(password) {
    return crypto.createHmac('sha512',password).update('ggwp').digest('hex')
}
function checkLogin(req,res) {
    var mail = req.body.email
    var pass = encode(req.body.password)
    mongo.connect('mongodb://127.0.0.1/myweb',
        (er, db) => {
            db.collection('user').find({email:mail, password:pass})
            .toArray(
                (e,d)=>{
                    if(d.length == 0){
                        res.redirect('/login?Incorrect email or password')
                    }else{
						granted[req.token]=d[0]
						//res.send(d[0].fullname)
                        res.redirect('/homeuser/'+granted[req.token].fullname)
                    }
                }
            )
        }
    )
}
function registerNewUser(req, res) {
	var data = {}
	if(req.body.fullname != null || req.body.email != null || req.body.password != null ){
	data.fullname = req.body.fullname
	data.email    = req.body.email
	data.password = encode(req.body.password)
	mongo.connect("mongodb://127.0.0.1/myweb",
		(e, db) => {
			db.collection('user').find({email: data.email})
			.toArray(
				(e, d) => {
					if (d.length == 0) {
						db.collection('user').insert(data)
						res.redirect('/login')
					} else {
						res.redirect('/register?Duplicated')
					}
				}
			)
		}	
	)
	}else{
		res.redirect('/register?Duplicated')
	}
}
function savePhoto(req, res) {
	var data = req.file.originalname.split('.')
	var ext  = data[data.length - 1]
	if (ext == 'jpg' || ext == 'png' || ext == 'gif') {
	} else {
		ext = 'png'
	}
	fs.renameSync(req.file.path, req.file.path + '.' + ext)
	
	var user = granted[req.token];
	user.photo = req.file.filename + '.' + ext
	mongo.connect('mongodb://127.0.0.1/myweb',
		(error, db) => {
			var x = {}
			x._id = user._id
			db.collection('user').update(x, user)
			res.redirect('/profile/'+granted[req.token].fullname)
		}	
	)
}

function sentData(req,res){
	var data =[]
	console.log(req.query)
	mongo.connect("mongodb://127.0.0.1/myweb",
      (er,db)=>{
        db.collection('user').find().toArray(
          (e,d)=>{
            data = d
			res.send(data)
          }
        )
      }
      )
}
