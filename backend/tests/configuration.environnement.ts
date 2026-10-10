process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test'
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'cle_de_test_acces_avec_32_caracteres_minimum'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'cle_de_test_rafraichissement_32_caracteres_min'
