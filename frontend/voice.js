let recognition;
let speechSynthesis = window.speechSynthesis;
let isListening = false;
let voiceCommandsEnabled =
  localStorage.getItem("voiceCommandsEnabled") === "true";

function initSpeechRecognition() {
  try {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "sl-SI";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = function (event) {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Prepoznan ukaz:", command);
        processVoiceCommand(command);
      };

      recognition.onerror = function (event) {
        console.error("Napaka pri prepoznavi govora:", event.error);
        speakResponse("Prišlo je do napake pri prepoznavi govora.");
      };

      recognition.onend = function () {
        if (isListening) {
          recognition.start();
        }
      };

      console.log("Prepoznava govora je inicializirana");
      return true;
    } else {
      console.error("Prepoznava govora ni podprta v tem brskalniku");
      return false;
    }
  } catch (error) {
    console.error("Napaka pri inicializaciji prepoznave govora:", error);
    return false;
  }
}

function startListening() {
  if (!recognition) {
    if (!initSpeechRecognition()) {
      showNotification(
        "Prepoznava govora ni podprta v tem brskalniku.",
        "error"
      );
      return false;
    }
  }

  try {
    recognition.start();
    isListening = true;
    console.log("Poslušanje glasovnih ukazov...");
    showNotification("Poslušanje glasovnih ukazov...", "success");
    document.getElementById("voiceBtn").classList.add("active");
    return true;
  } catch (error) {
    console.error("Napaka pri začetku poslušanja:", error);
    showNotification("Napaka pri začetku poslušanja.", "error");
    return false;
  }
}

function stopListening() {
  if (recognition) {
    try {
      recognition.stop();
      isListening = false;
      console.log("Poslušanje ustavljeno");
      showNotification("Poslušanje ustavljeno.", "warning");
      document.getElementById("voiceBtn").classList.remove("active");
    } catch (error) {
      console.error("Napaka pri ustavljanju poslušanja:", error);
    }
  }
}

function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function toggleVoiceCommands() {
  voiceCommandsEnabled = !voiceCommandsEnabled;
  localStorage.setItem("voiceCommandsEnabled", voiceCommandsEnabled);

  const voiceBtn = document.getElementById("voiceBtn");
  if (voiceCommandsEnabled) {
    voiceBtn.style.display = "block";
    showNotification("Glasovni ukazi so omogočeni.", "success");
    speakResponse("Glasovni ukazi so omogočeni.");
  } else {
    voiceBtn.style.display = "none";
    stopListening();
    showNotification("Glasovni ukazi so onemogočeni.", "warning");
    speakResponse("Glasovni ukazi so onemogočeni.");
  }
}

function speakResponse(text) {
  if (!voiceCommandsEnabled) return;

  if (speechSynthesis) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "sl-SI";
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);
  }
}

function processVoiceCommand(command) {
  console.log("Procesiranje ukaza:", command);

  if (command.includes("išči")) {
    let searchTerm = command.replace(/išči/gi, "").trim();
    if (searchTerm) {
      speakResponse("Iščem uporabnike: " + searchTerm);
      document.getElementById("search").value = searchTerm;
      document.getElementById("search").dispatchEvent(new Event("input"));
    } else {
      speakResponse("Prosim, povejte kaj naj poiščem.");
    }
    return;
  } else if (command.includes("dodaj uporabnika")) {
    speakResponse("Pripravljen obrazec za novega uporabnika.");
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("ime").focus();
    return;
  } else if (command.includes("osveži")) {
    speakResponse("Osvežujem seznam uporabnikov.");
    fetchUsers();
    return;
  } else if (command.includes("odjava")) {
    speakResponse("Odjavljanje.");
    setTimeout(() => {
      if (confirm("Se želite odjaviti?")) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
      }
    }, 1000);
    return;
  } else if (command.includes("pomoč") || command.includes("navodila")) {
    speakResponse(
      "Na voljo so naslednji ukazi: išči, dodaj uporabnika, osveži seznam, odjava in pomoč."
    );
    showNotification(
      "Glasovni ukazi: išči, nov uporabnik, osveži, odjava, pomoč",
      "info"
    );
    return;
  } else {
    /* speakResponse(
      "Nisem prepoznal ukaza. Za prikaz razpoložljivih ukazov recite 'pomoč'."
    ); */
    /* showNotification(
      "Neprepoznan ukaz. Recite 'pomoč' za prikaz ukazov.",
      "warning"
    ); */
  }
}

function initVoiceFeatures() {
  const voiceBtn = document.createElement("button");
  voiceBtn.id = "voiceBtn";
  voiceBtn.innerHTML = "🎤";
  voiceBtn.title = "Glasovni ukazi";
  voiceBtn.className = "voice-btn";

  const searchInput = document.getElementById("search");
  if (searchInput && searchInput.parentNode) {
    searchInput.parentNode.insertBefore(voiceBtn, searchInput.nextSibling);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn && logoutBtn.parentNode) {
    const voiceToggleBtn = document.createElement("button");
    voiceToggleBtn.id = "voiceToggleBtn";
    voiceToggleBtn.innerHTML = "🔊 Glasovni ukazi";
    voiceToggleBtn.title = "Vklopi/izklopi glasovne ukaze";
    voiceToggleBtn.className = "voice-toggle-btn";

    logoutBtn.parentNode.insertBefore(voiceToggleBtn, logoutBtn);

    voiceToggleBtn.addEventListener("click", toggleVoiceCommands);
  }

  if (voiceCommandsEnabled) {
    voiceBtn.style.display = "block";
  } else {
    voiceBtn.style.display = "none";
  }

  voiceBtn.addEventListener("click", toggleListening);

  initSpeechRecognition();
}

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const isMainPage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/";

  if (token && isMainPage) {
    initVoiceFeatures();
  }
});
