const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { middleware } = require("../middleware/auth.middleware");

router.post("/", middleware, userController.createUser);
router.get("/", middleware, userController.getAllUsers);
router.get("/:id", middleware, userController.getUserById);
router.put("/:id", middleware, userController.updateUser);
router.delete("/:id", middleware, userController.deleteUser);

module.exports = router;
