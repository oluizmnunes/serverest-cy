import LoginPage from '../page_objects/LoginPage';
import RegisterPage from '../page_objects/RegisterPage';
import AdminPage from '../page_objects/AdminPage';
import ProductsPage from '../page_objects/ProductsPage';

describe("ServeRest frontend", () => {
  const loginPage = new LoginPage();
  const registerPage = new RegisterPage();
  const adminPage = new AdminPage();
  const productsPage = new ProductsPage();
  
  it("registers a new admin user and lands on the admin home", () => {
    const id = Cypress._.random(100, 999);
    const user = {
      nome: `user${id}`,
      email: `user${id}@test.com`,
      password: "Password@123",
    };

    registerPage.register(user);

    cy.contains("Cadastro realizado com sucesso").should("be.visible");
    cy.url().should("include", "/admin/home");
    cy.contains(`Bem Vindo ${user.nome}`).should("be.visible");
  });

  it("shows an error and stays on the login page for invalid credentials", () => {
    loginPage.login({ email: "nobody@test.com", password: "Password@123" });

    cy.contains("Email e/ou senha inválidos").should("be.visible");
    cy.url().should("include", "/login");
  });

  describe("as an authenticated admin", () => {
    beforeEach(() => {
      const id = Cypress._.random(100, 999);
      const admin = {
        nome: `user${id}`,
        email: `user${id}@test.com`,
        password: "Password@123",
        administrador: "true",
      };

      cy.request({
        method: "POST",
        url: `https://serverest.dev/usuarios`,
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
      const product = {
        nome: 'Teclado' + Cypress._.random(100, 999),
        preco: "250",
        descricao: "Teclado mecânico",
        quantidade: "10",
      };

      adminPage.openProductRegistration();
      productsPage.create(product);

      cy.url().should("include", "/admin/listarprodutos");
      cy.contains("td", product.nome).should("be.visible");
    });
  });
});
