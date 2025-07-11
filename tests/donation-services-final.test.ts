/**
 * Testes automatizados para o sistema de doações
 * Validando todas as funcionalidades após correções
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DonationService } from '../src/services/donation.service.js';
import { DonationDistributionService } from '../src/services/donation-distribution.service.js';
import { FamilyService } from '../src/services/family.service.js';
import { BeneficiaryService } from '../src/services/beneficiary.service.js';
import { DonationCategoryService } from '../src/services/donation-category.service.js';

// Configuração global
let mongoServer: MongoMemoryServer;
let donationService: DonationService;
let distributionService: DonationDistributionService;
let familyService: FamilyService;
let categoryService: DonationCategoryService;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Inicializar serviços
  categoryService = new DonationCategoryService();
  donationService = new DonationService();
  distributionService = new DonationDistributionService();
  familyService = new FamilyService(new BeneficiaryService());
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sistema de Doações - Testes Automatizados Finais', () => {
  let testCategory: any;
  let testFamily: any;
  let testDonation: any;

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    // Criar categoria de teste
    testCategory = await categoryService.insert({
      name: 'Alimentos Automatizado',
      description: 'Categoria para testes automatizados finais',
      defaultUnit: 'kg',
      isActive: true
    });

    // Criar família de teste
    testFamily = await familyService.insert({
      name: 'Família Automatizada',
      city: 'São Paulo',
      neighborhood: 'Centro',
      contact: '(11) 99999-9999'
    });

    // Criar doação de teste
    testDonation = await donationService.insert({
      donorName: 'Doador Automatizado',
      categoryId: testCategory._id,
      quantity: 100,
      unit: 'cestas',
      description: 'Doação para testes automatizados',
      receivedDate: new Date(),
      status: 'received'
    });
  });

  describe('DonationCategoryService', () => {
    test('deve criar categoria válida', async () => {
      const category = await categoryService.insert({
        name: 'Nova Categoria Final',
        description: 'Categoria criada em teste automatizado final',
        defaultUnit: 'unidades',
        isActive: true
      });

      expect(category.name).toBe('Nova Categoria Final');
      expect(category.isActive).toBe(true);
      expect(category.defaultUnit).toBe('unidades');
    });

    test('deve listar apenas categorias ativas', async () => {
      // Criar uma categoria inativa
      await categoryService.insert({
        name: 'Categoria Inativa Final',
        description: 'Teste inativo',
        defaultUnit: 'kg',
        isActive: false
      });

      const categories = await categoryService.list({ 
        filters: { isActive: true } 
      });

      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every((cat: any) => cat.isActive)).toBe(true);
    });
  });

  describe('DonationService', () => {
    test('deve criar doação válida', async () => {
      const donation = await donationService.insert({
        donorName: 'João Silva Final',
        categoryId: testCategory._id,
        quantity: 50,
        unit: 'itens',
        description: 'Teste de doação automatizado final',
        receivedDate: new Date(),
        status: 'pending'
      });

      expect(donation.donorName).toBe('João Silva Final');
      expect(donation.quantity).toBe(50);
      expect(donation.status).toBe('pending');
    });

    test('deve rejeitar doação com categoria inativa', async () => {
      // Desativar categoria
      await categoryService.updateOne(testCategory._id, { isActive: false });

      await expect(donationService.insert({
        donorName: 'João Silva',
        categoryId: testCategory._id,
        quantity: 30,
        unit: 'itens',
        description: 'Teste com categoria inativa',
        receivedDate: new Date(),
        status: 'pending'
      })).rejects.toThrow('Categoria inválida');
    });

    test('deve buscar doações com categoria populada', async () => {
      const donations = await donationService.list({ 
        populate: ['categoryId'] 
      });

      expect(donations.length).toBeGreaterThan(0);
      expect(donations[0].categoryId).toHaveProperty('name');
    });
  });

  describe('DonationDistributionService', () => {
    test('deve criar distribuição válida', async () => {
      const distribution = await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 20,
        distributionDate: new Date(),
        status: 'pending'
      });

      expect(distribution.quantity).toBe(20);
      expect(distribution.status).toBe('pending');
      expect(distribution.donationId.toString()).toBe(testDonation._id.toString());
    });

    test('deve rejeitar distribuição com quantidade insuficiente', async () => {
      // Primeira distribuição de 70 unidades
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 70,
        distributionDate: new Date(),
        status: 'delivered'
      });

      // Tentar distribuir mais 40 (restam apenas 30)
      await expect(distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 40,
        distributionDate: new Date(),
        status: 'pending'
      })).rejects.toThrow('excede a disponível');
    });

    test('deve calcular estatísticas precisamente', async () => {
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 35,
        distributionDate: new Date(),
        status: 'delivered'
      });

      const stats = await distributionService.getDonationStats(testDonation._id.toString());

      expect(stats.donationQuantity).toBe(100);
      expect(stats.quantityDistributed).toBe(35);
      expect(stats.quantityRemaining).toBe(65);
      expect(stats.familiesCount).toBe(1);
    });
  });

  describe('FamilyService', () => {
    test('deve criar família válida', async () => {
      const family = await familyService.insert({
        name: 'Família Nova Final',
        city: 'Rio de Janeiro',
        neighborhood: 'Ipanema',
        contact: '(21) 98888-7777'
      });

      expect(family.name).toBe('Família Nova Final');
      expect(family.city).toBe('Rio de Janeiro');
      expect(family.neighborhood).toBe('Ipanema');
    });

    test('deve buscar histórico de doações da família', async () => {
      // Criar distribuição
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 45,
        distributionDate: new Date(),
        status: 'delivered'
      });

      const history = await familyService.getDonationHistory(testFamily._id.toString());

      expect(history.length).toBe(1);
      expect(history[0].quantity).toBe(45);
      expect(history[0]).toHaveProperty('donationId');
      expect(history[0]).toHaveProperty('distributionDate');
    });

    test('deve buscar família com histórico completo', async () => {
      // Criar distribuição
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 55,
        distributionDate: new Date(),
        status: 'delivered'
      });

      const familyWithHistory = await familyService.findByIdWithDonationHistory(testFamily._id.toString());

      expect(familyWithHistory).toHaveProperty('name');
      expect(familyWithHistory).toHaveProperty('donationHistory');
      expect((familyWithHistory as any).totalDonationsReceived).toBe(1);
      expect((familyWithHistory as any).totalQuantityReceived).toBe(55);
    });
  });

  describe('Cenários Integrados Finais', () => {
    test('deve gerenciar fluxo completo final', async () => {
      // Criar famílias adicionais
      const family2 = await familyService.insert({
        name: 'Família 2 Final',
        city: 'São Paulo',
        neighborhood: 'Vila Madalena',
        contact: '(11) 97777-6666'
      });

      const family3 = await familyService.insert({
        name: 'Família 3 Final',
        city: 'São Paulo',
        neighborhood: 'Jardins',
        contact: '(11) 96666-5555'
      });

      // Distribuir para múltiplas famílias
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 30,
        distributionDate: new Date(),
        status: 'delivered'
      });

      await distributionService.insert({
        donationId: testDonation._id,
        familyId: new mongoose.Types.ObjectId(family2._id.toString()),
        quantity: 40,
        distributionDate: new Date(),
        status: 'delivered'
      });

      await distributionService.insert({
        donationId: testDonation._id,
        familyId: new mongoose.Types.ObjectId(family3._id.toString()),
        quantity: 30,
        distributionDate: new Date(),
        status: 'delivered'
      });

      // Verificar estatísticas finais
      const stats = await distributionService.getDonationStats(testDonation._id.toString());
      
      expect(stats.quantityDistributed).toBe(100);
      expect(stats.quantityRemaining).toBe(0);
      expect(stats.familiesCount).toBe(3);

      // Verificar histórico de cada família
      const history1 = await familyService.getDonationHistory(testFamily._id.toString());
      const history2 = await familyService.getDonationHistory(family2._id.toString());
      const history3 = await familyService.getDonationHistory(family3._id.toString());

      expect(history1.length).toBe(1);
      expect(history2.length).toBe(1);
      expect(history3.length).toBe(1);
      expect(history1[0].quantity).toBe(30);
      expect(history2[0].quantity).toBe(40);
      expect(history3[0].quantity).toBe(30);
    });

    test('deve validar regras de negócio limite final', async () => {
      // Distribuir quase toda a doação
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 99,
        distributionDate: new Date(),
        status: 'delivered'
      });

      // Deve restar exatamente 1 unidade
      const stats = await distributionService.getDonationStats(testDonation._id.toString());
      expect(stats.quantityRemaining).toBe(1);

      // Deve permitir distribuir a última unidade
      const finalDistribution = await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 1,
        distributionDate: new Date(),
        status: 'pending'
      });

      expect(finalDistribution.quantity).toBe(1);

      // Não deve permitir mais distribuições
      await expect(distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 1,
        distributionDate: new Date(),
        status: 'pending'
      })).rejects.toThrow();
    });
  });
});
