describe('ServeRest API tests', () => {
    it('creates a user and retrieves it by id', () => {
      const apiUrl = 'https://serverest.dev';
      const id = Cypress._.random(100, 999);
      const user = {
        nome: `user${id}`,
        email: `user${id}@test.com`,
        password: 'Password@123',
        administrador: 'true',
      };
    });
  });