//jshint esversion:6

require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create')


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
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy())

passport.serializeUser((user, done)=> {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done)=> {
    User.findById(id, (err, user)=> {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SEC,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  (accessToken, refreshToken, profile, cb)=> {
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
    User.find({secret:{$ne:null}}, (error, foundUsers)=>{
        if(error){
            console.log(error)
        } else {
            if (foundUsers){
                res.render('secrets.ejs', {usersWithSecrets: foundUsers})
            }
        }
    })
})

app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render('submit.ejs')
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
    req.login(user, function(err){
        if (err) {
          console.log(err);
        } else {
          passport.authenticate("local")(req, res, ()=>{
            res.redirect("/secrets");
          });
        }
      });
    
    });

app.post('/submit', (req, res)=>{
    const submittedSecret = req.body.secret

    console.log(req.user.id)

    User.findById(req.user.id, (error, foundUser)=>{
        if (error){
            console.log(error)
        } else {
            if (foundUser){
                foundUser.secret = submittedSecret
                foundUser.save(()=>{
                    res.redirect('/secrets')
                })
            }
        }
    })
})


app.listen(3000, () => {
    console.log("Server started on port 3000.");
});
