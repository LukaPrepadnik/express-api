const UserApiClient = require("./client");

async function testApiClient() {
  const client = new UserApiClient();

  try {
    console.log("--- AVTENTIKACIJA ---");
    const email = `test${Date.now()}@primer.com`;
    const geslo = "Geslo123";

    const authResult = await client.register({
      ime: "Testni",
      priimek: "Uporabnik",
      email: email,
      geslo: geslo,
    });
    console.log("Rezultat registracije:", authResult);

    console.log("\n--- USTVARJANJE UPORABNIKA ---");
    const newUser = await client.createUser({
      ime: "Drugi",
      priimek: "Uporabnik",
      email: `drugi${Date.now()}@primer.com`,
      geslo: "Geslo456",
    });
    console.log("Ustvarjen nov uporabnik:", newUser);

    console.log("\n--- PRIDOBIVANJE VSEH UPORABNIKOV ---");
    const users = await client.getAllUsers();
    console.log("Uporabniki:", users);

    if (newUser && newUser.data && newUser.data._id) {
      const userId = newUser.data._id;

      console.log("\n--- PRIDOBIVANJE POSAMEZNEGA UPORABNIKA ---");
      const user = await client.getUserById(userId);
      console.log("Najden uporabnik:", user);

      console.log("\n--- POSODABLJANJE UPORABNIKA ---");
      const updatedUser = await client.updateUser(userId, {
        ime: "Posodobljeni",
        priimek: "Uporabnik",
      });
      console.log("Posodobljen uporabnik:", updatedUser);

      console.log("\n--- BRISANJE UPORABNIKA ---");
      const deleteResult = await client.deleteUser(userId);
      console.log("Rezultat brisanja:", deleteResult);
    } else {
      console.error("Uporabnik ni bil uspešno ustvarjen ali manjka ID");
    }
  } catch (error) {
    console.error("Napaka med testiranjem:", error.message);
  }
}

testApiClient();
