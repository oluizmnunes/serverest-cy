import { uniqueUser, uniqueProduct } from '../support/helpers';

describe("ServeRest API tests", () => {
  let constants = require('../fixtures/constants.json');

  it("creates a user and retrieves it by id", () => {
    const user = uniqueUser();

    cy.request({
      method: "POST",
      url: constants.API.USERS,
      body: user,
    })
      .then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        expect(createResponse.body.message).to.eq(
          constants.MESSAGES.SUCCESS_REGISTER,
        );
        expect(createResponse.body).to.have.property("_id");

        return cy.request({
          url: `${constants.API.USERS}/${createResponse.body._id}`,
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
    const existingUser = uniqueUser();
    const duplicateUser = {
      ...uniqueUser(),
      email: existingUser.email,
    };

    cy.request({
      method: "POST",
      url: constants.API.USERS,
      body: existingUser,
      failOnStatusCode: false,
    })
      .then((createResponse) => {
        expect(createResponse.status).to.eq(201);

        return cy.request({
          method: "POST",
          url: constants.API.USERS,
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
    const admin = uniqueUser();
    const product = uniqueProduct();

    let token;

    cy.request({ // try to create product with no token 
      method: "POST",
      url: constants.API.PRODUCTS,
      body: product,
      failOnStatusCode: false,
    })
      .then((response) => {
        expect(response.status).to.eq(401); // proves endpoint is protected
        return cy.request({
          method: "POST",
          url: constants.API.USERS, // create admin user
          body: admin,
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(201);
        return cy.request({
          method: "POST",
          url: constants.API.LOGIN, // login admin user
          body: { email: admin.email, password: admin.password },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        token = response.body.authorization; // get token for future requests

        return cy.request({
          method: "POST",
          url: constants.API.PRODUCTS, // create product with token
          body: product,
          headers: { Authorization: token },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.eq(constants.MESSAGES.SUCCESS_REGISTER);

        return cy.request({
          method: "DELETE",
          url: `${constants.API.PRODUCTS}/${response.body._id}`, // delete product with token
          headers: { Authorization: token },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
      });
  });
});
