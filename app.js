//jshint esversion:6

require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(session({secret:"Our little secret.", resave: false, saveUninitialized: false}))

app.use(passport.initialize())
app.use(passport.session())


main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/secretsModuleDB");
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy())

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SEC,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile)
    User.findOrCreate({ googleId: profile.id },  (err, user)=> {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res)=> {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get('/logout', (req, res)=>{
    req.logout()
    res.redirect("/")
})

app.get('/secrets', (req, res)=>{
    if(req.isAuthenticated()){
        res.render('secrets.ejs')
    } else{
        res.redirect('/login')
    }
})

app.post("/register", (req, res) => {
    User.register({username: req.body.username}, req.body.password, (error, user)=>{
        if(error){
            console.log(error)
            res.render('/register.ejs')
        } else{
            passport.authenticate("local")(req, res,()=>{
                res.redirect('/secrets')
            })
        }
    })
   
});

app.post("/login", (req, res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user, (error)=>{
        if(error){
            console.log(error)
        } else{
            passport.authenticate("local")
            res.redirect("/secrets")
        }
    })
})


app.listen(3000, () => {
    console.log("Server started on port 3000.");
});
