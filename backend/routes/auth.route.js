const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.registracija);
router.post("/login", authController.prijava);

module.exports = router;
