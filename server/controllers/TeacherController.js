"use strict";

const teacherService = require("../services/TeacherService");

exports.accRefApplication = function accRefApplication(req, res, next) {
  if (req.body.accepted == undefined) {
    return res.status(400).json({ error: "Missing new status" });
  }
  teacherService
    .accRefApplication(
      req.body.accepted,
      req.params.id_professor,
      req.params.id_application
    )
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (response) {
      res.status(500).json(response);
    });
};

exports.listApplication = function listApplication(req, res, next) {
  teacherService
    .listApplication(req.params.id_professor)
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (response) {
      res.status(500).json(response);
    });
};

exports.acceptApplication = function acceptApplication(req, res, next) {
  if (req.body.accepted == undefined) {
    return res.status(400).json({ error: "Missing new status accpetApplication" });
  }
  console.log("acceptApplication CONTROLLER status = " + req.body.accepted);
  teacherService
    .acceptApplication(
      req.body.accepted,
      req.params.id_professor,
      req.params.id_application
    )
    .then(function (response) {
      res.status(200).json(response);
    })
    .catch(function (response) {
      res.status(500).json(response);
    });
};
