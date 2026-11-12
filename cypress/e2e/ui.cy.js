import LoginPage from '../page_objects/LoginPage';
import RegisterPage from '../page_objects/RegisterPage';
import AdminPage from '../page_objects/AdminPage';
import ProductsPage from '../page_objects/ProductsPage';
import { uniqueUser, uniqueProduct } from '../support/helpers';

describe("ServeRest frontend", () => {
  const loginPage = new LoginPage();
  const registerPage = new RegisterPage();
  const adminPage = new AdminPage();
  const productsPage = new ProductsPage();
  
  let constants = require('../fixtures/constants.json');
  it("registers a new admin user and lands on the admin home", () => {
    const user = uniqueUser();

    registerPage.register(user);

    cy.contains(constants.MESSAGES.SUCCESS_REGISTER).should("be.visible");
    cy.url().should("include", "/admin/home");
    cy.contains(`Bem Vindo ${user.nome}`).should("be.visible");
  });

  it("shows an error and stays on the login page for invalid credentials", () => {
    loginPage.login({ email: "nobody@test.com", password: "Password@123" });

    cy.contains(constants.MESSAGES.INVALID_CREDENTIALS).should("be.visible");
    cy.url().should("include", "/login");
  });

  describe("as an authenticated admin", () => {
    beforeEach(() => {
      const admin = uniqueUser("true");

      cy.request({
        method: "POST",
        url: constants.API.USERS,
        body: admin,
      }).then((response) => {
        expect(response.status).to.eq(201);

        cy.visit("/login");
        cy.get('[data-testid="email"]').type(admin.email);
        cy.get('[data-testid="senha"]').type(admin.password);
        cy.get('[data-testid="entrar"]').click();
      });
    });

    it("creates a product and sees it in the product list", () => {
      const product = uniqueProduct();

      adminPage.openProductRegistration();
      productsPage.create(product);

      cy.url().should("include", "/admin/listarprodutos");
      cy.contains("td", product.nome).should("be.visible");
    });
  });
});
