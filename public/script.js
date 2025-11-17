// 🔄 Toggle between Login and Register
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toggleInputError = (input, hasError) => {
  if (!input) return;
  input.classList.toggle("input-error", hasError);
};

const updateErrorBox = (box, errors) => {
  if (!box) return;
  if (errors.length) {
    box.innerHTML = errors.map((msg) => `<span>${msg}</span>`).join("<br>");
    box.classList.add("active");
  } else {
    box.innerHTML = "";
    box.classList.remove("active");
  }
};

document.getElementById("showRegister").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
});

document.getElementById("showLogin").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
});


const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginErrors = document.getElementById("loginErrors");

const validateLoginForm = () => {
  const errors = [];
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email) {
    errors.push("Email is required.");
    toggleInputError(loginEmail, true);
  } else if (!emailRegex.test(email)) {
    errors.push("Enter a valid email address.");
    toggleInputError(loginEmail, true);
  } else {
    toggleInputError(loginEmail, false);
  }

  if (!password) {
    errors.push("Password is required.");
    toggleInputError(loginPassword, true);
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters.");
    toggleInputError(loginPassword, true);
  } else {
    toggleInputError(loginPassword, false);
  }

  updateErrorBox(loginErrors, errors);
  return errors.length === 0;
};

const registerFields = {
  name: document.getElementById("registerName"),
  email: document.getElementById("registerEmail"),
  bio: document.getElementById("registerBio"),
  username: document.getElementById("registerUsername"),
  password: document.getElementById("registerPassword"),
  phone: document.getElementById("registerPhone"),
  location: document.getElementById("registerLocation"),
};
const registerErrors = document.getElementById("registerErrors");

const validateRegisterForm = () => {
  const errors = [];
  const phoneDigits = registerFields.phone.value.replace(/\D/g, "");

  if (registerFields.name.value.trim().length < 3) {
    errors.push("Full name should be at least 3 characters.");
    toggleInputError(registerFields.name, true);
  } else {
    toggleInputError(registerFields.name, false);
  }

  if (!emailRegex.test(registerFields.email.value.trim())) {
    errors.push("Provide a valid email address.");
    toggleInputError(registerFields.email, true);
  } else {
    toggleInputError(registerFields.email, false);
  }

  if (registerFields.bio.value.trim().length < 10) {
    errors.push("Bio should describe you in at least 10 characters.");
    toggleInputError(registerFields.bio, true);
  } else {
    toggleInputError(registerFields.bio, false);
  }

  if (registerFields.username.value.trim().length < 3) {
    errors.push("User ID must be 3 characters or more.");
    toggleInputError(registerFields.username, true);
  } else {
    toggleInputError(registerFields.username, false);
  }

  if (registerFields.password.value.trim().length < 6) {
    errors.push("Password should be at least 6 characters.");
    toggleInputError(registerFields.password, true);
  } else {
    toggleInputError(registerFields.password, false);
  }

  if (phoneDigits.length < 10) {
    errors.push("Enter a valid contact number (10 digits).");
    toggleInputError(registerFields.phone, true);
  } else {
    toggleInputError(registerFields.phone, false);
  }

  if (!registerFields.location.value.trim()) {
    errors.push("Location cannot be empty.");
    toggleInputError(registerFields.location, true);
  } else {
    toggleInputError(registerFields.location, false);
  }

  updateErrorBox(registerErrors, errors);
  return errors.length === 0;
};

document.querySelectorAll("input, textarea").forEach((el) => {
  el.addEventListener("input", () => el.classList.remove("input-error"));
});

// 📝 Handle Registration
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateRegisterForm()) return;

  const form = e.target;

  const userData = {
    name: form.querySelector('input[placeholder="Full Name"]').value,
    email: form.querySelector('input[placeholder="Email Address"]').value,
    bio: form.querySelector('textarea').value,
    username: form.querySelector('input[placeholder="User ID"]').value,
    password: form.querySelector('input[placeholder="Password"]').value,
    contact_number: form.querySelector('input[placeholder="Contact Number"]').value,
    location: form.querySelector('input[placeholder="Location"]').value,
  };

  try {
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    document.querySelector("#register-answer").innerText = data.message;

    if (response.ok) {
      showToast("Registration successful! You can log in now.", "success");
    } else {
      showToast(data.message || "Registration failed", "error");
    }

    if (response.ok) {
      // ✅ Auto-switch to login after successful registration
      setTimeout(() => {
        document.getElementById("registerBox").style.display = "none";
        document.getElementById("loginBox").style.display = "block";
      }, 1000);
    }

  } catch (error) {
    console.error("❌ Error during registration:", error);
    showToast("Error connecting to server", "error");
  }
});


// 🔐 Handle Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateLoginForm()) return;

  const credentials = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  };

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Login successful! Redirecting you...", "success");
      // ✅ Store user_id and email
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_email", credentials.email);

      // ✅ Check if user already has skills
      const checkRes = await fetch(`http://localhost:3000/check-skills/${data.user_id}`);
      const checkData = await checkRes.json();

      // ✅ Redirect based on skill status
      if (checkData.hasSkills) {
        window.location.href = "explore.html";
      } else {
        window.location.href = "addskills.html";
      }

    } else {
      document.querySelector("#login-answer").innerText = data.message || "Login failed";
      showToast(data.message || "Login failed", "error");
    }
  } catch (error) {
    console.error("❌ Error during login:", error);
    showToast("Login failed. Please try again.", "error");
  }
});





// // 🔄 Toggle between Login and Register
// document.getElementById("showRegister").addEventListener("click", (e) => {
//   e.preventDefault();
//   document.getElementById("loginBox").style.display = "none";
//   document.getElementById("registerBox").style.display = "block";
// });

// document.getElementById("showLogin").addEventListener("click", (e) => {
//   e.preventDefault();
//   document.getElementById("registerBox").style.display = "none";
//   document.getElementById("loginBox").style.display = "block";
// });

// //📝 Handle Registration
// // 📝 Handle Registration
// document.getElementById("registerForm").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   // ✅ Define the form element from the event
//   const form = e.target;

//   // ✅ Use querySelector safely within this form
//   const userData = {
//     name: form.querySelector('input[placeholder="Full Name"]').value,
//     email: form.querySelector('input[placeholder="Email Address"]').value,
//     bio: form.querySelector('textarea').value,
//     username: form.querySelector('input[placeholder="User ID"]').value,
//     password: form.querySelector('input[placeholder="Password"]').value,
//     contact_number: form.querySelector('input[placeholder="Contact Number"]').value,
//     location: form.querySelector('input[placeholder="Location"]').value,
//   };

//   try {
//     const response = await fetch("http://localhost:3000/register", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(userData),
//     });

//     const data = await response.json();
//     document.querySelector("#register-answer").innerText = data.message;

//     if (response.ok) {
//       // ✅ Auto-switch to login after successful register
//       setTimeout(() => {
//         document.getElementById("registerBox").style.display = "none";
//         document.getElementById("loginBox").style.display = "block";
//       }, 1000);
//     }

//   } catch (error) {
//     console.error("❌ Error during registration:", error);
//     alert("Error connecting to server");
//   }
// });


// // 🔐 Handle Login
// document.getElementById("loginForm").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const credentials = {
//     email: document.getElementById("loginEmail").value,
//     password: document.getElementById("loginPassword").value,
//   };

//   try {
//     const response = await fetch("http://localhost:3000/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(credentials),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       // ✅ Store user_id or email locally
//       localStorage.setItem("user_id", data.user_id);
//       localStorage.setItem("user_email", credentials.email);

//       // ✅ Redirect to addskills.html
//       window.location.href = "addskills.html";
//     } else {
//       // Show backend message on page
//       document.querySelector("#login-answer").innerText = data.message || "Login failed";
//     }
//   } catch (error) {
//     console.error("❌ Error during login:", error);
//     alert("Login failed. Please try again.");
//   }
// });
