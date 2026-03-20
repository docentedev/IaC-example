const usersService = require("../service/usersService");

function getUsers(req, res) {
  const users = usersService.listUsers();
  return res.status(200).json(users);
}

function getUserById(req, res) {
  const userId = Number(req.params.id);
  const user = usersService.findUserById(userId);

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  return res.status(200).json(user);
}

function postUser(req, res) {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "name y email son obligatorios" });
  }

  const newUser = usersService.createUser({ name, email, role });
  return res.status(201).json(newUser);
}

module.exports = {
  getUsers,
  getUserById,
  postUser
};
