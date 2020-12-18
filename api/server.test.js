const request = require("supertest");
const server = require("./server");
const db = require("./../data/dbConfig");

const Creds1 = { username: "CerealKiller", password: "love" };
const Creds2 = { username: "LordNikon", password: "secret" };
const NoUsername = { password: "garbage" };
const NoPassword = { username: "Joey" };

test("sanity", () => {
  expect(true).toBe(true);
});

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("users").truncate();
});
afterAll(async () => [await db.destroy()]);

describe("auth endpoints", () => {
  describe("[POST] /auth/register", () => {
    it("responds with 201 and user object", async () => {
      const response = await request(server)
        .post("/api/auth/register")
        .send(Creds1);
      expect(response.status).toBe(201);
      expect(response.body.username).toBe("CerealKiller");
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("password");
    });
    it("responds with 401 and message if incomplete creds", async () => {
      const response = await request(server)
        .post("/api/auth/register")
        .send(NoUsername);
      expect(response.status).toBe(401);
      expect(JSON.stringify(response.body)).toMatch(
        /username and password required/
      );
    });
  });
  describe("[POST] /auth/login", () => {
    it("responds with 200, message and token on successful login", async () => {
      // register
      await request(server).post("/api/auth/register").send(Creds1);
      // login
      const response = await request(server)
        .post("/api/auth/login")
        .send(Creds1);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(JSON.stringify(response.body.message)).toMatch(/welcome/);
    });
    it("responds with 401 and message with bad credentials", async () => {
      // register
      await request(server).post("/api/auth/register").send(Creds1);
      // login
      const response = await request(server)
        .post("/api/auth/login")
        .send(Creds2);
      expect(response.status).toBe(401);
      expect(JSON.stringify(response.body.message)).toMatch(
        /invalid credentials/
      );
    });
  });
});

describe("jokes endpoints", () => {
  it("responds with jokes array with valid token", async () => {
    // register
    await request(server).post("/api/auth/register").send(Creds1);
    // login
    const response = await request(server).post("/api/auth/login").send(Creds1);
    const token = response.body.token
  
    // const res2 = await request(server).post("/api/jokes").header()
    const res2 = await request(server).get("/api/jokes").set("Authorization", token)
    expect(res2.body).toHaveLength(3);
    expect(res2.body[0]).toHaveProperty("id", "0189hNRf2g")
  });
  it("responds with 401 and message if no token", async () => {
    const response = await request(server).get("/api/jokes");
    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).toMatch(
      /token required/
    );
  })
});
