const API_URL = "http://localhost:3000/api/users";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

const userList = document.getElementById("userList");
const form = document.getElementById("userForm");
const searchInput = document.getElementById("search");
const notification = document.getElementById("notification");
const offlineIndicator = document.getElementById("offlineIndicator");

let allUsers = [];

async function fetchUsers() {
  try {
    if (navigator.onLine) {
      const res = await fetch(API_URL, { headers });
      if (res.status === 401) return handleUnauthorized();

      const data = await res.json();
      allUsers = data.users;

      await addUsersToIDB(allUsers);
    } else {
      showNotification("You are offline", "warning");
      allUsers = await getUsersFromIDB();
    }
    renderUsers(allUsers);
    saveUsersLocally(allUsers);
  } catch (err) {
    console.error("Napaka pri pridobivanju uporabnikov:", err);
    try {
      allUsers = await getUsersFromIDB();
      renderUsers(allUsers);
      showNotification("Uporabljeni so lokalni podatki", "warning");
    } catch (localErr) {
      showNotification("Napaka pri pridobivanju uporabnikov.", "error");
    }
  }
}

function renderUsers(users) {
  userList.innerHTML = "";

  users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.ime}</td>
      <td>${user.priimek}</td>
      <td>${user.email}</td>
      <td>
        <button onclick="editUser('${user._id}')">Uredi</button>
        <button onclick="deleteUser('${user._id}')">Izbriši</button>
      </td>
    `;
    userList.appendChild(tr);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("userId").value;
  const user = {
    ime: document.getElementById("ime").value,
    priimek: document.getElementById("priimek").value,
    email: document.getElementById("email").value,
    geslo: document.getElementById("geslo").value,
  };

  try {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;

    if (navigator.onLine) {
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(user),
      });

      if (res.status === 401) return handleUnauthorized();

      if (method === "POST") {
        const data = await res.json();
        await addUserToIDB(data.data);
      } else if (method === "PUT") {
        const updatedUser = { ...user, _id: id };
        await addUserToIDB(updatedUser);
      }
    } else {
      if (method === "POST") {
        const tempUser = { ...user, _id: "temp_" + Date.now() };
        await addUserToIDB(tempUser);
        await addPendingOperation({
          operation: "CREATE",
          userData: user,
          timestamp: Date.now(),
        });
      } else if (method === "PUT") {
        const updatedUser = { ...user, _id: id };
        await addUserToIDB(updatedUser);
        await addPendingOperation({
          operation: "UPDATE",
          userId: id,
          userData: user,
          timestamp: Date.now(),
        });
      }
    }

    form.reset();
    document.getElementById("userId").value = "";
    fetchUsers();
    showNotification("Podatki so uspešno shranjeni.", "success");
  } catch (err) {
    console.error("Napaka:", err);
    showNotification("Napaka pri shranjevanju.", "error");
  }
});

async function deleteUser(id) {
  if (confirm("Res želite izbrisati uporabnika?")) {
    try {
      if (navigator.onLine) {
        const res = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers,
        });

        if (res.status === 401) return handleUnauthorized();
      } else {
        await addPendingOperation({
          operation: "DELETE",
          userId: id,
          timestamp: Date.now(),
        });
      }

      await deleteUserFromIDB(id);
      fetchUsers();
      showNotification("Uporabnik je bil uspešno izbrisan.", "success");
    } catch (err) {
      console.error("Napaka pri brisanju:", err);
      showNotification("Napaka pri brisanju uporabnika.", "error");
    }
  }
}

async function editUser(id) {
  try {
    let user;

    if (navigator.onLine) {
      const res = await fetch(`${API_URL}/${id}`, { headers });
      if (res.status === 401) return handleUnauthorized();
      const data = await res.json();
      user = data.data;
    } else {
      const users = await getUsersFromIDB();
      user = users.find((u) => u._id === id);
    }

    if (user) {
      document.getElementById("userId").value = user._id;
      document.getElementById("ime").value = user.ime;
      document.getElementById("priimek").value = user.priimek;
      document.getElementById("email").value = user.email;
    } else {
      showNotification("Uporabnik ni najden.", "error");
    }
  } catch (err) {
    console.error("Napaka pri urejanju:", err);
    showNotification("Napaka pri nalaganju uporabniških podatkov.", "error");
  }
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  const filtered = allUsers.filter(
    (u) =>
      u.ime.toLowerCase().includes(q) ||
      u.priimek.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  );
  renderUsers(filtered);
});

function handleUnauthorized() {
  alert("Seja je potekla. Prijavi se znova.");
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

function showNotification(message, type) {
  notification.innerHTML = message;

  if (type === "success") {
    notification.style.color = "green";
  } else if (type === "error") {
    notification.style.color = "red";
  } else if (type === "warning") {
    notification.style.color = "orange";
  }

  setTimeout(() => (notification.innerHTML = ""), 5000);
}

function saveUsersLocally(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "d") {
    e.preventDefault();
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("ime").focus();
  }

  if (e.ctrlKey && e.key === "k") {
    e.preventDefault();
    document.getElementById("search").focus();
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Se želite odjaviti?")) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "q") {
    e.preventDefault();
    document.getElementById("logoutBtn").click();
  }
});

function updateOnlineStatus() {
  if (navigator.onLine) {
    if (offlineIndicator) {
      offlineIndicator.style.display = "none";
    }

    syncData();
  } else {
    if (offlineIndicator) {
      offlineIndicator.style.display = "block";
    }
    showNotification("Delate v načinu brez povezave", "warning");
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

fetchUsers();
updateOnlineStatus();
