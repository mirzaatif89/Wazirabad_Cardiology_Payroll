export const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (username === "admin" && password === "admin123") {
    return res.json({
      message: "Login successful.",
      user: {
        id: 1,
        name: "Hospital Admin",
        username: "admin",
        role: "admin"
      }
    });
  }

  return res.status(401).json({ message: "Invalid username or password." });
};
