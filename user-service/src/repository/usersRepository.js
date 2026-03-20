const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../data/data.json");

function ensureDataFile() {
  const dirPath = path.dirname(dataPath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (!fs.existsSync(dataPath)) {
    const defaultUsers = [
      {
        id: 1,
        name: "Ana Torres",
        email: "ana.torres@duocuc.cl",
        role: "student"
      },
      {
        id: 2,
        name: "Carlos Moya",
        email: "carlos.moya@duocuc.cl",
        role: "teacher"
      },
      {
        id: 3,
        name: "Josefina Rojas",
        email: "josefina.rojas@duocuc.cl",
        role: "student"
      }
    ];

    fs.writeFileSync(dataPath, JSON.stringify(defaultUsers, null, 2), "utf-8");
  }
}

function getAllUsers() {
  ensureDataFile();
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
}

function getUserById(id) {
  const users = getAllUsers();
  return users.find((user) => user.id === id);
}

function saveUsers(users) {
  fs.writeFileSync(dataPath, JSON.stringify(users, null, 2), "utf-8");
}

module.exports = {
  getAllUsers,
  getUserById,
  saveUsers
};
