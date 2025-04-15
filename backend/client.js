const axios = require("axios");

class UserApiClient {
  constructor(baseURL = "http://localhost:3000/api") {
    this.baseURL = baseURL;
    this.token = null;
    this.client = axios.create({
      baseURL: baseURL,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async register(userData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/register`,
        userData
      );
      this.token = response.data.token;
      this.updateAuthHeader();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async login(email, geslo) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        geslo,
      });
      this.token = response.data.token;
      this.updateAuthHeader();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  updateAuthHeader() {
    if (this.token) {
      this.client.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${this.token}`;
    } else {
      delete this.client.defaults.headers.common["Authorization"];
    }
  }

  async getAllUsers(page = 1, limit = 10) {
    try {
      const response = await this.client.get("/users", {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserById(id) {
    try {
      const response = await this.client.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(userData) {
    try {
      const response = await this.client.post("/users", userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await this.client.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteUser(id) {
    try {
      const response = await this.client.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      console.error("Napaka strežnika:", error.response.data);
      throw new Error(error.response.data.message || "Napaka pri zahtevi");
    } else if (error.request) {
      console.error("Napaka pri zahtevi:", error.request);
      throw new Error("Ni odgovora od strežnika");
    } else {
      console.error("Napaka:", error.message);
      throw error;
    }
  }
}

module.exports = UserApiClient;
