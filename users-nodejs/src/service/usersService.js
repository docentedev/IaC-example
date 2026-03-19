const usersRepository = require("../repository/usersRepository");

function listUsers() {
  return usersRepository.getAllUsers();
}

function findUserById(id) {
  return usersRepository.getUserById(id);
}

function createUser(payload) {
  const users = usersRepository.getAllUsers();

  const nextId = users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1;

  const newUser = {
    id: nextId,
    name: payload.name,
    email: payload.email,
    role: payload.role || "student"
  };

  users.push(newUser);
  usersRepository.saveUsers(users);

  return newUser;
}

module.exports = {
  listUsers,
  findUserById,
  createUser
};
