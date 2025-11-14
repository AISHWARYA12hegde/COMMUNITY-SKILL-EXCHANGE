
document.addEventListener("DOMContentLoaded", async () => {
  const user_id = localStorage.getItem("user_id");

  if (!user_id) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  const userNameEl = document.getElementById("user-name");
  const userEmailEl = document.getElementById("user-email");
  const skillsContainer = document.getElementById("skills-container");

  try {
    // Fetch user data
    const userRes = await fetch(`http://localhost:3000/get-user/${user_id}`);
    const user = await userRes.json();

    userNameEl.innerText = user.name;
    userEmailEl.innerText = user.email;

    // Fetch user skills
    const skillRes = await fetch(`http://localhost:3000/user-skills/${user_id}`);
    const skills = await skillRes.json();

    if (!skills.length) {
      skillsContainer.innerHTML = `<p>No skills added yet.</p>`;
      return;
    }

    skillsContainer.innerHTML = skills
      .map(
        (s) => `
        <div class="skill-card">
          <span><b>${s.skill_name}</b> (${s.type})</span>

          <div class="buttons">
            <button class="edit-btn" onclick="editSkill(${s.id}, '${s.type}')">
              Edit
            </button>
            <button class="delete-btn" onclick="deleteSkill(${s.id})">
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    skillsContainer.innerHTML = `<p>Error loading data.</p>`;
  }
});

// Delete Skill
async function deleteSkill(id) {
  if (!confirm("Delete this skill?")) return;

  const res = await fetch(`http://localhost:3000/delete-skill/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();
  alert(data.message);
  location.reload();
}

// Edit Skill
function editSkill(id, currentType) {
  const newType = prompt("Teach or Learn?", currentType);
  if (!newType || !["Teach", "Learn"].includes(newType)) {
    return alert("Invalid type!");
  }

  fetch(`http://localhost:3000/update-skill/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: newType }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      location.reload();
    });
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}




// const USER_ID = 1; // temporary — normally from session

// // Load existing skills on page load
// window.onload = () => {
//   loadUserSkills();
// };

// function loadUserSkills() {
//   fetch(`/get-user-skills/${USER_ID}`)
//     .then(res => res.json())
//     .then(data => {
//       const list = document.getElementById("skillList");
//       list.innerHTML = "";

//       data.forEach(skill => {
//         const div = document.createElement("div");
//         div.innerHTML = `
//           <b>${skill.skill_name}</b>  
//           <select onchange="updateLevel(${skill.id}, this.value)">
//             <option ${skill.experience_level === "Beginner" ? "selected" : ""}>Beginner</option>
//             <option ${skill.experience_level === "Intermediate" ? "selected" : ""}>Intermediate</option>
//             <option ${skill.experience_level === "Expert" ? "selected" : ""}>Expert</option>
//           </select>

//           <label>
//             <input type="checkbox" ${skill.teach ? "checked" : ""} 
//               onchange="updateTeach(${skill.id}, this.checked)">
//             Teach
//           </label>

//           <label>
//             <input type="checkbox" ${skill.learn ? "checked" : ""} 
//               onchange="updateLearn(${skill.id}, this.checked)">
//             Learn
//           </label>

//           <button onclick="removeSkill(${skill.id})">Remove</button>
//         `;

//         list.appendChild(div);
//       });
//     });
// }

// function addSkill() {
//   const skill_name = document.getElementById("newSkill").value;
//   const experience = document.getElementById("experience").value;
//   const teach = document.getElementById("teach").checked;
//   const learn = document.getElementById("learn").checked;

//   fetch("/add-skill", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ user_id: USER_ID, skill_name, experience, teach, learn })
//   })
//     .then(res => res.json())
//     .then(() => loadUserSkills());
// }

// function removeSkill(id) {
//   fetch(`/remove-skill/${id}`, { method: "DELETE" })
//     .then(res => res.json())
//     .then(() => loadUserSkills());
// }

// function updateLevel(id, level) {
//   fetch("/update-level", {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ id, level })
//   });
// }

// function updateTeach(id, teach) {
//   fetch("/update-teach", {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ id, teach })
//   });
// }

// function updateLearn(id, learn) {
//   fetch("/update-learn", {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ id, learn })
//   });
// }
