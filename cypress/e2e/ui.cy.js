describe("ServeRest frontend", () => {
  it("registers a new admin user and lands on the admin home", () => {
    const id = Cypress._.random(100, 999);
    const user = {
      nome: `user${id}`,
      email: `user${id}@test.com`,
      password: "Password@123",
    };

    cy.visit("/cadastrarusuarios");
    cy.get('[data-testid="nome"]').type(user.nome);
    cy.get('[data-testid="email"]').type(user.email);
    cy.get('[data-testid="password"]').type(user.password);
    cy.get('[data-testid="checkbox"]').check();
    cy.get('[data-testid="cadastrar"]').click();

    cy.contains("Cadastro realizado com sucesso").should("be.visible");
    cy.url().should("include", "/admin/home");
    cy.contains(`Bem Vindo ${user.nome}`).should("be.visible");
  });

  it("shows an error and stays on the login page for invalid credentials", () => {
    cy.visit("/login");
    cy.get('[data-testid="email"]').type("nobody@test.com");
    cy.get('[data-testid="senha"]').type("Password@123");
    cy.get('[data-testid="entrar"]').click();

    cy.contains('Email e/ou senha inválidos').should("be.visible");
    cy.url().should("include", "/login");
  });
});
