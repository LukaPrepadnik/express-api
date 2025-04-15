if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registriran:", registration);
      })
      .catch((error) => {
        console.log("Service Worker registracija ni uspela:", error);
      });
  });
}

const DB_NAME = "usersDB";
const DB_VERSION = 1;
const USERS_STORE = "users";
const PENDING_STORE = "pendingOperations";

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB napaka:", event.target.error);
      reject("IndexedDB ni na voljo");
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(USERS_STORE)) {
        db.createObjectStore(USERS_STORE, { keyPath: "_id" });
      }

      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = db.createObjectStore(PENDING_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        pendingStore.createIndex("operation", "operation", { unique: false });
      }
    };
  });
}

function addUserToIDB(user) {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction([USERS_STORE], "readwrite");
      const store = transaction.objectStore(USERS_STORE);
      const request = store.put(user);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject("Napaka pri shranjevanju uporabnika v IndexedDB");
      };
    });
  });
}

function addUsersToIDB(users) {
  return Promise.all(users.map((user) => addUserToIDB(user)));
}

function getUsersFromIDB() {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction([USERS_STORE], "readonly");
      const store = transaction.objectStore(USERS_STORE);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject("Napaka pri pridobivanju uporabnikov iz IndexedDB");
      };
    });
  });
}

function deleteUserFromIDB(userId) {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction([USERS_STORE], "readwrite");
      const store = transaction.objectStore(USERS_STORE);
      const request = store.delete(userId);

      request.onsuccess = (event) => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject("Napaka pri brisanju uporabnika iz IndexedDB");
      };
    });
  });
}

function addPendingOperation(operation) {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction([PENDING_STORE], "readwrite");
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.add(operation);

      request.onsuccess = (event) => {
        resolve(event.target.result);
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync
              .register("sync-users")
              .catch((error) =>
                console.error("Background sync ni uspel:", error)
              );
          });
        }
      };

      request.onerror = (event) => {
        reject("Napaka pri shranjevanju čakajoče operacije");
      };
    });
  });
}

function getPendingOperations() {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction([PENDING_STORE], "readonly");
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject("Napaka pri pridobivanju čakajočih operacij");
      };
    });
  });
}

function deletePendingOperation(id) {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction([PENDING_STORE], "readwrite");
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.delete(id);

      request.onsuccess = (event) => {
        resolve(true);
      };

      request.onerror = (event) => {
        reject("Napaka pri brisanju čakajoče operacije");
      };
    });
  });
}

function isOnline() {
  return navigator.onLine;
}

function setupNetworkListeners() {
  window.addEventListener("online", () => {
    console.log("Povezava je ponovno vzpostavljena");
    syncData();
  });

  window.addEventListener("offline", () => {
    console.log("Povezava je prekinjena");
    showNotification("Delate v načinu brez povezave", "warning");
  });
}

async function syncData() {
  if (!isOnline()) return;

  try {
    const pendingOps = await getPendingOperations();

    for (const op of pendingOps) {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("Ni žetona za sinhronizacijo");
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        let response;

        switch (op.operation) {
          case "CREATE":
            response = await fetch(API_URL, {
              method: "POST",
              headers,
              body: JSON.stringify(op.userData),
            });
            break;

          case "UPDATE":
            response = await fetch(`${API_URL}/${op.userId}`, {
              method: "PUT",
              headers,
              body: JSON.stringify(op.userData),
            });
            break;

          case "DELETE":
            response = await fetch(`${API_URL}/${op.userId}`, {
              method: "DELETE",
              headers,
            });
            break;
        }

        if (response && response.ok) {
          await deletePendingOperation(op.id);
          console.log(`Operacija ${op.operation} uspešno sinhronizirana`);
        }
      } catch (error) {
        console.error(
          `Napaka pri sinhronizaciji operacije ${op.operation}:`,
          error
        );
      }
    }

    if (
      window.location.pathname === "/index.html" ||
      window.location.pathname === "/"
    ) {
      fetchUsers();
    }
  } catch (error) {
    console.error("Napaka pri sinhronizaciji:", error);
  }
}

function initPWA() {
  setupNetworkListeners();

  if (
    (window.location.pathname === "/index.html" ||
      window.location.pathname === "/") &&
    isOnline()
  ) {
    syncData();
  }
}

initPWA();
