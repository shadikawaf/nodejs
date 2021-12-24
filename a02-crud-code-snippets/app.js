/**
 * Application's entry point
 *
 * @author Chadi Kawaf
 * @version 1.0.0
 */

"use strict";

const express = require("express");
const hbs = require("express-hbs");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./configs/db");

const colors = require("colors");
const session = require("express-session");
const createError = require("http-errors");
dotenv.config({ path: "./configs/config.env" });
/**
 * db connection
 */
connectDB();

const PORT = process.env.PORT || 8000;

const app = express();

app.engine(
  "hbs",
  hbs.express4({
    defaultLayout: path.join(__dirname, "views", "layouts", "default"),
    partialsDir: path.join(__dirname, "views", "partials"),
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * setup sessions middleware
 */
const sessionOptions ={
  name: process.env.SESSION_NAME,
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false, //create a new session if needed
  resave: false, //every the time the user connect to the server the server will reset this cookie
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 1 day for the seesion cookie
}
}

app.use(session(sessionOptions))


app.use((req, res, next) => {
  if (req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  }

  next();
});

app.use((req, res, next) => {
  app.locals.expreq = req.session.userName;
  next();
});

app.use("/", require("./routes/router"));
app.use("/snippets", require("./routes/snippets"));
app.use("/login", require("./routes/login"));
app.use("/register", require("./routes/register"));
app.use("/logout", require("./routes/logout"));
app.use("*", (req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
  if (err.statusCode === 404) {
    return res
      .status(404)
      .sendFile(path.join(__dirname, "views", "errors", "404.html"));
  }

  if (req.app.get("env") !== "development") {
    return res
      .status(500)
      .sendFile(path.join(__dirname, "views", "errors", "500.html"));
  }


  res.status(err.statusCode || 500).render("errors/error", { error: err });
});

const server = app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => process.exit(1)); //close server
});
