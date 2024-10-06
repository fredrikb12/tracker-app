const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const prisma = require("./prisma");
const bcrypt = require("bcryptjs");
const customFields = {
    usernameField: "email",
    passwordField: "password",
};


const verifyCallback = async (email, password, done) => {
    try {
        console.log({email, password});
        const user = await prisma.user.findUnique({
            where: {email}
        });
        if(!user) {
            return done(null, false);
        }
        const match = await bcrypt.compare(password, user.password);
        if(match) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
        return done(err);
    }
}


const strategy = new LocalStrategy(customFields, verifyCallback)
passport.use(strategy);
passport.serializeUser((user, done) => {
    done(null, user.id);
})
passport.deserializeUser(async (userId, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: {id: userId}
        });
        done(null, user);
    } catch (err) {
        done(err);
    }
})