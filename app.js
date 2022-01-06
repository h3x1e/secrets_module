//jshint esversion:6

require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/secretsModuleDB");
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const secret = process.env.SECRET

userSchema.plugin(encrypt,{secret: secret, encryptedFields:['password']}) //Insert this BEFORE the mongooseModel

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password,
    });

    newUser.save((error) => {
        if (error) {
            console.log(error);
        } else {
            res.render("secrets.ejs");
        }
    });
});

app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username},(error, foundUser)=>{
        if (error){
            console.log(error)
        }else {
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets.ejs")
                }
            }
        }
    })
})

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});
