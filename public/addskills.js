const toastStack = document.getElementById("toastStack");

const showToast = (message, type = "info", timeout = 3200) => {
  if (!toastStack) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
  }, timeout - 300);
  setTimeout(() => toast.remove(), timeout);
};

const skillErrors = document.getElementById("skillErrors");
const learnFields = {
  name: document.getElementById("learn_skill_name"),
  description: document.getElementById("learn_description"),
  level: document.getElementById("learn_level"),
};
const teachFields = {
  name: document.getElementById("teach_skill_name"),
  description: document.getElementById("teach_description"),
  level: document.getElementById("teach_level"),
};

const toggleError = (input, hasError) => {
  if (!input) return;
  input.classList.toggle("input-error", hasError);
};

const validateSkillForm = () => {
  const errors = [];

  if (learnFields.name.value.trim().length < 2) {
    errors.push("Please add the skill you want to learn (min 2 characters).");
    toggleError(learnFields.name, true);
  } else {
    toggleError(learnFields.name, false);
  }

  if (learnFields.description.value.trim().length < 10) {
    errors.push("Share a short reason for learning (10+ characters).");
    toggleError(learnFields.description, true);
  } else {
    toggleError(learnFields.description, false);
  }

  if (teachFields.name.value.trim().length < 2) {
    errors.push("Please add the skill you can teach (min 2 characters).");
    toggleError(teachFields.name, true);
  } else {
    toggleError(teachFields.name, false);
  }

  if (teachFields.description.value.trim().length < 10) {
    errors.push("Describe what you teach in at least 10 characters.");
    toggleError(teachFields.description, true);
  } else {
    toggleError(teachFields.description, false);
  }

  if (errors.length) {
    skillErrors.innerHTML = errors.map((msg) => `<span>${msg}</span>`).join("<br>");
    skillErrors.classList.add("active");
  } else {
    skillErrors.innerHTML = "";
    skillErrors.classList.remove("active");
  }

  return errors.length === 0;
};

document.querySelectorAll("#skillForm input, #skillForm textarea").forEach((field) => {
  field.addEventListener("input", () => field.classList.remove("input-error"));
});

document.getElementById("skillForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateSkillForm()) return;

  // Example: stored user_id after login
  const user_id = localStorage.getItem("user_id"); 
  if (!user_id) {
    showToast("Please log in first!", "error");
    return;
  }

  // Collect Learn Skill
  const learnSkill = {
    user_id,
    skill_name: document.getElementById("learn_skill_name").value.trim(),
    description: document.getElementById("learn_description").value.trim(),
    type: "Learn",
    experience_level: document.getElementById("learn_level").value
  };

  // Collect Teach Skill
  const teachSkill = {
    user_id,
    skill_name: document.getElementById("teach_skill_name").value.trim(),
    description: document.getElementById("teach_description").value.trim(),
    type: "Teach",
    experience_level: document.getElementById("teach_level").value
  };

  try {
    const res = await fetch("http://localhost:3000/add-skill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ user_id, learnSkill, teachSkill }),
   });
 
    const result = await res.json();

    // Show message
    document.getElementById("skilladded").innerText = result.message || "Skills added successfully!";

    // Optional: redirect after success
    if (res.ok) {
      showToast("Skills added successfully!", "success");
      setTimeout(() => window.location.href = "explore.html", 1500);
    } else {
      showToast(result.message || "Unable to add skills", "error");
    }

    // Clear the form
    document.getElementById("skillForm").reset();

  } catch (err) {
    console.error(err);
    showToast("Error adding skills!", "error");
  }
});
