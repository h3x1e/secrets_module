//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/mongooseSecretsTest");
}

const userSchema = {
    email: String,
    password: String,
};

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
        eail: req.body.username,
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

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});
