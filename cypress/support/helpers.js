import { faker } from "@faker-js/faker";

export const uniqueUser = (administrador = "true") => ({
  nome: faker.person.fullName(),
  email: faker.internet.email({ provider: "test.com" }),
  password: "Password@123",
  administrador,
});

export const uniqueProduct = () => ({
  nome: faker.commerce.productName(),
  preco: faker.number.int({ min: 1, max: 1000 }),
  descricao: faker.commerce.productDescription(),
  quantidade: faker.number.int({ min: 1, max: 100 }),
});