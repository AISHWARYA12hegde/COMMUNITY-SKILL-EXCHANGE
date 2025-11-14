// ======================================================
//  SKILL EXCHANGE BACKEND (CLEAN + FIXED)
// ======================================================

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ======================================================
//  DATABASE CONNECTION
// ======================================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "skillexchange"
});

db.connect(err => {
  if (err) return console.log("❌ Database connection failed:", err);
  console.log("✅ Connected to MySQL");

  // USERS TABLE
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      bio TEXT,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      contact_number VARCHAR(30),
      location VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // SKILLS TABLE
  db.query(`
    CREATE TABLE IF NOT EXISTS skills (
      skill_id INT AUTO_INCREMENT PRIMARY KEY,
      skill_name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // USER_SKILLS TABLE
  db.query(`
    CREATE TABLE IF NOT EXISTS user_skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      skill_id INT NOT NULL,
      can_teach BOOLEAN DEFAULT 0,
      can_learn BOOLEAN DEFAULT 0,
      experience_level VARCHAR(50),
      UNIQUE(user_id, skill_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
});

// ======================================================
//  REGISTER
// ======================================================
app.post("/register", async (req, res) => {
  try {
    const { name, email, bio, username, password, contact_number, location } = req.body;

    if (!name || !email || !username || !password)
      return res.status(400).json({ message: "Required fields missing" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (name, email, bio, username, password_hash, contact_number, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, bio, username, hashedPassword, contact_number, location],
      (err, result) => {
        if (err) {
          console.error("❌ MySQL Error:", err);
          return res.status(500).json({ message: "Error registering user", error: err });
        }
        res.json({ message: "✅ Registered successfully!" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ======================================================
//  LOGIN
// ======================================================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (result.length === 0) return res.status(400).json({ message: "User not found" });

    const user = result[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    db.query(
      "SELECT COUNT(*) AS skillCount FROM user_skills WHERE user_id = ?",
      [user.user_id],
      (err2, countRes) => {
        if (err2) return res.status(500).json({ message: "Error checking skills" });

        res.json({
          message: "✅ Login successful",
          user_id: user.user_id,
          hasSkills: countRes[0].skillCount > 0
        });
      }
    );
  });
});

// ======================================================
//  ADD SKILLS (Teach / Learn)
// ======================================================
app.post("/add-skill", (req, res) => {
  const { user_id, teachSkill, learnSkill } = req.body;

  if (!user_id) return res.status(400).json({ message: "User ID required" });

  // --- create or fetch skill ---
  function getOrAddSkill(skill_name, description, callback) {
    db.query("SELECT skill_id FROM skills WHERE skill_name = ?", [skill_name], (err, result) => {
      if (err) return callback(err);

      if (result.length > 0) {
        return callback(null, result[0].skill_id);
      }

      db.query(
        "INSERT INTO skills (skill_name, description) VALUES (?, ?)",
        [skill_name, description || null],
        (err2, res2) => {
          if (err2) return callback(err2);
          callback(null, res2.insertId);
        }
      );
    });
  }

  // --- update user's skill relationship ---
  function updateUserSkill(user_id, skill_id, type, experience_level, callback) {
    const field = type === "Teach" ? "can_teach" : "can_learn";

    db.query(
      `INSERT INTO user_skills (user_id, skill_id, ${field}, experience_level)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE ${field} = 1, experience_level = VALUES(experience_level)`,
      [user_id, skill_id, experience_level || null],
      callback
    );
  }

  const tasks = [];

  if (teachSkill) {
    tasks.push(cb => {
      getOrAddSkill(teachSkill.skill_name, teachSkill.description, (err, skill_id) => {
        if (err) return cb(err);
        updateUserSkill(user_id, skill_id, "Teach", teachSkill.experience_level, cb);
      });
    });
  }

  if (learnSkill) {
    tasks.push(cb => {
      getOrAddSkill(learnSkill.skill_name, learnSkill.description, (err, skill_id) => {
        if (err) return cb(err);
        updateUserSkill(user_id, skill_id, "Learn", learnSkill.experience_level, cb);
      });
    });
  }

  let done = 0;

  tasks.forEach(task => {
    task(err => {
      if (err) return res.status(500).json({ message: "Error adding skill", error: err });

      done++;
      if (done === tasks.length) {
        res.json({ message: "✅ Skills added successfully!" });
      }
    });
  });
});

// ======================================================
//  GET ALL SKILLS (Explore Page)
// ======================================================
app.get("/skills", (req, res) => {
  const query = `
    SELECT 
      u.name AS user_name, 
      s.skill_name, 
      s.description,
      us.can_teach, 
      us.can_learn, 
      us.experience_level
    FROM user_skills us
    JOIN users u ON us.user_id = u.user_id
    JOIN skills s ON us.skill_id = s.skill_id;
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(result);
  });
});

// ======================================================
//  USER DASHBOARD
// ======================================================
app.get("/dashboard/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const userQuery = `SELECT name, email, username FROM users WHERE user_id = ?`;

  const skillQuery = `
    SELECT s.skill_name, us.can_teach, us.can_learn
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.skill_id
    WHERE us.user_id = ?;
  `;

  const exploreQuery = `
    SELECT 
      u.name AS user_name, 
      s.skill_name,
      CASE 
        WHEN us.can_teach = 1 THEN 'Teach' 
        WHEN us.can_learn = 1 THEN 'Learn'
      END AS type
    FROM user_skills us
    JOIN users u ON us.user_id = u.user_id
    JOIN skills s ON us.skill_id = s.skill_id
    WHERE us.user_id != ?;
  `;

  db.query(userQuery, [user_id], (err, userResult) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (userResult.length === 0) return res.status(404).json({ message: "User not found" });

    db.query(skillQuery, [user_id], (err2, skillResult) => {
      if (err2) return res.status(500).json({ message: "Error fetching skills" });

      db.query(exploreQuery, [user_id], (err3, exploreResult) => {
        if (err3) return res.status(500).json({ message: "Error fetching explore data" });

        const teachSkills = skillResult.filter(s => s.can_teach).map(s => s.skill_name);
        const learnSkills = skillResult.filter(s => s.can_learn).map(s => s.skill_name);

        res.json({
          user: userResult[0],
          teachSkills,
          learnSkills,
          explore: exploreResult
        });
      });
    });
  });
});

// ======================================================
//  CHECK IF USER HAS ADDED SKILLS
// ======================================================
app.get("/check-skills/:user_id", (req, res) => {
  const { user_id } = req.params;

  db.query(
    "SELECT COUNT(*) AS skill_count FROM user_skills WHERE user_id = ?",
    [user_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ hasSkills: result[0].skill_count > 0 });
    }
  );
});

// ======================================================
//  PROFILE PAGE ROUTES
// ======================================================
app.get("/get-user/:user_id", (req, res) => {
  const { user_id } = req.params;

  db.query(
    "SELECT name, email, username FROM users WHERE user_id = ?",
    [user_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error fetching user" });
      if (result.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(result[0]);
    }
  );
});

app.get("/user-skills/:user_id", (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT us.id, s.skill_name,
           CASE 
             WHEN us.can_teach = 1 THEN 'Teach'
             WHEN us.can_learn = 1 THEN 'Learn'
             ELSE 'Other'
           END AS type
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.skill_id
    WHERE us.user_id = ?;
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching skills" });
    res.json(result);
  });
});

// DELETE SKILL
app.delete("/delete-skill/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM user_skills WHERE id = ?", [id], err => {
    if (err) return res.status(500).json({ message: "Error deleting skill" });
    res.json({ message: "Skill deleted successfully!" });
  });
});

// UPDATE SKILL
app.put("/update-skill/:id", (req, res) => {
  const { id } = req.params;
  const { skill_name, type } = req.body;

  const can_teach = type === "Teach" ? 1 : 0;
  const can_learn = type === "Learn" ? 1 : 0;

  db.query("SELECT skill_id FROM skills WHERE skill_name = ?", [skill_name], (err, result) => {
    if (err) return res.status(500).json({ message: "Error checking skill" });

    if (result.length === 0) {
      db.query("INSERT INTO skills (skill_name) VALUES (?)", [skill_name], (err2, insertRes) => {
        if (err2) return res.status(500).json({ message: "Error adding skill" });
        updateSkill(insertRes.insertId);
      });
    } else {
      updateSkill(result[0].skill_id);
    }
  });

  function updateSkill(skill_id) {
    db.query(
      "UPDATE user_skills SET skill_id = ?, can_teach = ?, can_learn = ? WHERE id = ?",
      [skill_id, can_teach, can_learn, id],
      err => {
        if (err) return res.status(500).json({ message: "Error updating skill" });
        res.json({ message: "Skill updated successfully!" });
      }
    );
  }
});

// ======================================================
//  START SERVER
// ======================================================
app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));




