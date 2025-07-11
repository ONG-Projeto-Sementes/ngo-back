import { config } from 'dotenv';

// Configurar variáveis de ambiente para testes
config({ path: '.env.test' });

// Mock simples do logger para testes
export const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {}
};
