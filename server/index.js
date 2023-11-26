"use strict";
const express = require("express");
const morgan = require("morgan"); // logging middleware
const session = require("express-session"); // enable sessions
const cors = require("cors");
const passport = require('./config/passport').passport;
const metadata = require('./config/passport').metadata;
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(session({
  secret: "myLittleDirtySecret",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({ extended: false })); // Replaces Body Parser

const isLoggedIn = (req, res, next)=>{
  if (!req.isAuthenticated()) {
    return res.status(401).json({error: 'Unauthorized'});
  } 
  return next();
}

/******************************************************************Route*********************************************************************************************/

const thesisController = require("./controllers/ThesisController");
const teacherController = require("./controllers/TeacherController");
const studentController = require("./controllers/StudentController");
const vc = require('./dayjsvc/index.dayjsvc')

app.get("/thesis", isLoggedIn, thesisController.advancedResearchThesis);

app.get("/thesis/supervisor/emails", isLoggedIn, thesisController.getAllCoSupervisorsEmails);

app.get("/professor/:id_professor/applications", (req, res) =>
  teacherController.listApplication(req, res)
);

app.post("/thesis", (req, res) => thesisController.addThesis(req, res));

app.put("/thesis/:id", (req, res) => thesisController.updateThesis(req, res));

app.put("/professor/:id_professor/applications/:id_application", (req, res) =>
  teacherController.acceptApplication(req, res)
);

app.post("/thesis/:id_thesis/applications", (req, res) => studentController.applyForProposal(req, res));

app.get("/student/:id_student/applications", isLoggedIn, studentController.browserApplicationStudent(req, res));

app.get('/professor/thesis', (req, res) => teacherController.browseProposals(req, res))

app.post("/testing/vc/set", (req, res) => vc.vc_set(req, res))

app.post("/testing/vc/restore", (req, res) => vc.vc_restore(req, res))

app.get("/testing/vc/get", (req, res) => vc.vc_current(req, res))

/******************************************************************Login*********************************************************************************************/

app.get('/login', passport.authenticate('samlStrategy'),(req, res)=>res.redirect('http://localhost:5173/homepage'));

app.post('/login/callback', passport.authenticate('samlStrategy'), (req, res)=>res.redirect('http://localhost:5173/homepage'));

app.get('/logout', passport.logoutSaml);

app.post('/logout/callback', passport.logoutSamlCallback);

app.get("/metadata", (req, res)=>res.type("application/xml").status(200).send(metadata()));

app.get("/session/current", isLoggedIn, (req, res)=>{req.user.email = req.user.nameID; delete req.user.nameID; res.status(200).send(req.user)})

const PORT = 3001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
module.exports = app;