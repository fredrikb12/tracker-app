const express = require("express");
const session = require("express-session");
const prisma = require("./config/prisma");
const {PrismaSessionStore} = require("@quixo3/prisma-session-store");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(session({
    secret: "test secret 123",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
    }),
    cookie: {maxAge: 1000 * 60 * 60 * 24}
}))

require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());


app.get("/", (req, res) => {
    res.render("index");
})
app.get("/login", (req,res,next) => {
    res.render("login");
})
app.post("/login", passport.authenticate("local"), async (req,res,next) => {
    res.redirect("/logged-in");
})
app.get("/logged-in", passport.authenticate("session"), (req,res,next) => {
    res.render("logged-in");
})
app.get("/register", (req,res,next) => {
    res.render("register");
})
app.post("/register", async (req,res,next) => {
    try {
        const {email, password} = req.body;
    if(!email || !password) {
        return res.sendStatus(500);
    }
    const user = await prisma.user.findUnique({
        where: {email}
    })
    if(user) {
        return res.sendStatus(500);
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            email,
            password: hash,
        }
    })
    res.redirect("/login");
    } catch (err) {
        console.error("Error: ", err);
        res.sendStatus(500);
    }
})

app.listen(3000, () => {
    console.log("Listening on 3000");
})