describe("ServeRest API tests", () => {
  it("creates a user and retrieves it by id", () => {
    const apiUrl = "https://serverest.dev";
    const id = Cypress._.random(100, 999);
    const user = {
      nome: `user${id}`,
      email: `user${id}@test.com`,
      password: "Password@123",
      administrador: "true",
    };

    cy.request({
      method: "POST",
      url: `${apiUrl}/usuarios`,
      body: user,
    })
      .then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        expect(createResponse.body.message).to.eq(
          "Cadastro realizado com sucesso",
        );
        expect(createResponse.body).to.have.property("_id");

        return cy.request({
          url: `${apiUrl}/usuarios/${createResponse.body._id}`,
        });
      })
      .then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        expect(getResponse.body).to.include({
          nome: user.nome,
          email: user.email,
          administrador: "true",
        });
      });
  });

  it("rejects a second user with an already registered email", () => {
    const apiUrl = "https://serverest.dev";
    const id = Cypress._.random(100, 999);
    const existingUser = {
      nome: `user${id}`,
      email: `user${id}@test.com`,
      password: "Password@123",
      administrador: "true",
    };

    const duplicateUser = {
      nome: `duplicateduser${id}`,
      email: existingUser.email,
      password: "Password@123",
      administrador: "true",
    };

    cy.request({
      method: "POST",
      url: `${apiUrl}/usuarios`,
      body: existingUser,
      failOnStatusCode: false,
    })
      .then((createResponse) => {
        expect(createResponse.status).to.eq(201);

        return cy.request({
          method: "POST",
          url: `${apiUrl}/usuarios`,
          body: duplicateUser,
          failOnStatusCode: false,
        });
      })
      .then((duplicateResponse) => {
        expect(duplicateResponse.status).to.eq(400);
        expect(duplicateResponse.body.message).to.eq(
          "Este email já está sendo usado",
        );
      });
  });

  it("only lets an authenticated admin create products", () => {
    const apiUrl = "https://serverest.dev";
    const id = Cypress._.random(100, 999);
    const admin = {
      nome: `admin${id}`,
      email: `admin${id}@test.com`,
      password: "Password@123",
      administrador: "true",
    };
    const product = {
      nome: `Mouse ${id}`,
      preco: 150,
      descricao: "Mouse sem fio",
      quantidade: 20,
    };

    let token;

    cy.request({ // try to create product with no token 
      method: "POST",
      url: `${apiUrl}/produtos`,
      body: product,
      failOnStatusCode: false,
    })
      .then((response) => {
        expect(response.status).to.eq(401); // proves endpoint is protected
        return cy.request({
          method: "POST",
          url: `${apiUrl}/usuarios`, // create admin user
          body: admin,
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(201);
        return cy.request({
          method: "POST",
          url: `${apiUrl}/login`, // login admin user
          body: { email: admin.email, password: admin.password },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        token = response.body.authorization; // get token for future requests

        return cy.request({
          method: "POST",
          url: `${apiUrl}/produtos`, // create product with token
          body: product,
          headers: { Authorization: token },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.eq("Cadastro realizado com sucesso");

        return cy.request({
          method: "DELETE",
          url: `${apiUrl}/produtos/${response.body._id}`, // delete product with token
          headers: { Authorization: token },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
      });
  });
});
