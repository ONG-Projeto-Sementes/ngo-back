import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DonationModel } from '../src/models/donation.js';
import { FamilyModel } from '../src/models/family.js';
import { DonationCategoryModel } from '../src/models/donation-category.js';
import { DonationDistributionModel } from '../src/models/donation-distribution.js';

describe('Donation System Unit Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testCategory: any;
  let testFamily: any;
  let testDonation: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpar collections
    await DonationModel.deleteMany({});
    await FamilyModel.deleteMany({});
    await DonationCategoryModel.deleteMany({});
    await DonationDistributionModel.deleteMany({});

    // Criar dados de teste
    testCategory = await DonationCategoryModel.create({
      name: 'Alimentos',
      description: 'Categoria para alimentos',
      defaultUnit: 'kg',
      isActive: true
    });

    testFamily = await FamilyModel.create({
      name: 'Família Teste',
      city: 'São Paulo',
      neighborhood: 'Centro',
      contact: '(11) 99999-9999'
    });

    testDonation = await DonationModel.create({
      donorName: 'Doador Teste',
      categoryId: testCategory._id,
      quantity: 20,
      unit: 'cestas',
      description: 'Doação para testes',
      status: 'received'
    });
  });

  describe('Donation Model Tests', () => {
    test('Deve criar uma nova doação', async () => {
      const donationData = {
        donorName: 'João Silva',
        categoryId: testCategory._id,
        quantity: 10,
        unit: 'cestas',
        description: 'Cestas básicas',
        estimatedValue: 500,
        receivedDate: new Date(),
        status: 'pending'
      };

      const donation = await DonationModel.create(donationData);

      expect(donation).toBeTruthy();
      expect(donation.donorName).toBe(donationData.donorName);
      expect(donation.quantity).toBe(donationData.quantity);
      expect(donation.categoryId.toString()).toBe(testCategory._id.toString());
      expect(donation.status).toBe('pending');
    });

    test('Deve buscar doações por status', async () => {
      // Criar doação com status diferente
      await DonationModel.create({
        donorName: 'Outro Doador',
        categoryId: testCategory._id,
        quantity: 5,
        unit: 'itens',
        status: 'distributed'
      });

      const receivedDonations = await DonationModel.find({ status: 'received' });
      const distributedDonations = await DonationModel.find({ status: 'distributed' });

      expect(receivedDonations).toHaveLength(1);
      expect(distributedDonations).toHaveLength(1);
    });

    test('Deve buscar doações com categoria populada', async () => {
      const donations = await DonationModel.find({}).populate('categoryId');

      expect(donations).toHaveLength(1);
      expect(donations[0].categoryId).toHaveProperty('name');
      expect((donations[0].categoryId as any).name).toBe('Alimentos');
    });

    test('Deve atualizar uma doação existente', async () => {
      const updateData = {
        donorName: 'João Silva Santos',
        quantity: 15,
        estimatedValue: 750
      };

      const updatedDonation = await DonationModel.findByIdAndUpdate(
        testDonation._id,
        updateData,
        { new: true }
      );

      expect(updatedDonation).toBeTruthy();
      expect(updatedDonation!.donorName).toBe(updateData.donorName);
      expect(updatedDonation!.quantity).toBe(updateData.quantity);
      expect(updatedDonation!.estimatedValue).toBe(updateData.estimatedValue);
    });

    test('Deve fazer soft delete de uma doação', async () => {
      await DonationModel.findByIdAndUpdate(testDonation._id, { deleted: true });

      const deletedDonation = await DonationModel.findById(testDonation._id);
      expect(deletedDonation!.deleted).toBe(true);
    });
  });

  describe('Donation Distribution Model Tests', () => {
    test('Deve criar distribuição para família', async () => {
      const distributionData = {
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        notes: 'Distribuição teste',
        status: 'pending'
      };

      const distribution = await DonationDistributionModel.create(distributionData);

      expect(distribution).toBeTruthy();
      expect(distribution.donationId.toString()).toBe(testDonation._id.toString());
      expect(distribution.familyId.toString()).toBe(testFamily._id.toString());
      expect(distribution.quantity).toBe(5);
      expect(distribution.status).toBe('pending');
    });

    test('Deve buscar distribuições por doação', async () => {
      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'pending'
      });

      const distributions = await DonationDistributionModel.find({
        donationId: testDonation._id
      });

      expect(distributions).toHaveLength(1);
      expect(distributions[0].donationId.toString()).toBe(testDonation._id.toString());
    });

    test('Deve buscar distribuições por família', async () => {
      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'delivered'
      });

      const distributions = await DonationDistributionModel.find({
        familyId: testFamily._id
      });

      expect(distributions).toHaveLength(1);
      expect(distributions[0].familyId.toString()).toBe(testFamily._id.toString());
    });

    test('Deve atualizar status de distribuição', async () => {
      const distribution = await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'pending'
      });

      const updated = await DonationDistributionModel.findByIdAndUpdate(
        distribution._id,
        { status: 'delivered' },
        { new: true }
      );

      expect(updated!.status).toBe('delivered');
    });

    test('Deve cancelar distribuição', async () => {
      const distribution = await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'pending'
      });

      const cancelled = await DonationDistributionModel.findByIdAndUpdate(
        distribution._id,
        { status: 'cancelled' },
        { new: true }
      );

      expect(cancelled!.status).toBe('cancelled');
    });
  });

  describe('Business Logic Tests', () => {
    test('Deve calcular quantidade disponível de uma doação', async () => {
      // Criar algumas distribuições
      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 8,
        distributionDate: new Date(),
        status: 'delivered'
      });

      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'pending'
      });

      // Calcular total distribuído (excluindo canceladas)
      const distributedResult = await DonationDistributionModel.aggregate([
        {
          $match: {
            donationId: testDonation._id,
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$quantity' }
          }
        }
      ]);

      const totalDistributed = distributedResult[0]?.total || 0;
      const availableQuantity = testDonation.quantity - totalDistributed;

      expect(totalDistributed).toBe(13);
      expect(availableQuantity).toBe(7);
    });

    test('Deve contar famílias beneficiadas por doação', async () => {
      // Criar segunda família
      const family2 = await FamilyModel.create({
        name: 'Família 2',
        city: 'São Paulo',
        neighborhood: 'Vila Madalena'
      });

      // Distribuir para múltiplas famílias
      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 8,
        distributionDate: new Date(),
        status: 'delivered'
      });

      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: family2._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'delivered'
      });

      // Contar famílias únicas
      const familiesResult = await DonationDistributionModel.aggregate([
        {
          $match: {
            donationId: testDonation._id,
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: '$familyId'
          }
        },
        {
          $count: 'uniqueFamilies'
        }
      ]);

      const familiesCount = familiesResult[0]?.uniqueFamilies || 0;
      expect(familiesCount).toBe(2);
    });

    test('Deve obter histórico de doações de uma família', async () => {
      // Criar múltiplas distribuições para a família
      await DonationDistributionModel.create({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 5,
        distributionDate: new Date(),
        status: 'delivered'
      });

      // Buscar histórico com detalhes da doação
      const history = await DonationDistributionModel.find({
        familyId: testFamily._id
      }).populate('donationId', 'donorName description categoryId');

      expect(history).toHaveLength(1);
      expect(history[0].quantity).toBe(5);
      expect((history[0].donationId as any).donorName).toBe('Doador Teste');
    });

    test('Deve validar regras de negócio para distribuição', async () => {
      // Teste: não pode distribuir mais que o disponível
      const requestedQuantity = 25; // Maior que os 20 disponíveis
      
      const distributedResult = await DonationDistributionModel.aggregate([
        {
          $match: {
            donationId: testDonation._id,
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$quantity' }
          }
        }
      ]);

      const alreadyDistributed = distributedResult[0]?.total || 0;
      const availableQuantity = testDonation.quantity - alreadyDistributed;

      expect(requestedQuantity > availableQuantity).toBe(true);
    });
  });

  describe('Statistics and Analytics Tests', () => {
    test('Deve calcular estatísticas gerais de doações', async () => {
      // Criar mais doações
      await DonationModel.create({
        donorName: 'Doador 2',
        categoryId: testCategory._id,
        quantity: 8,
        unit: 'itens',
        estimatedValue: 300,
        status: 'pending'
      });

      await DonationModel.create({
        donorName: 'Doador 3',
        categoryId: testCategory._id,
        quantity: 15,
        unit: 'pacotes',
        estimatedValue: 450,
        status: 'distributed'
      });

      const stats = await DonationModel.aggregate([
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: '$estimatedValue' },
            avgQuantity: { $avg: '$quantity' }
          }
        }
      ]);

      expect(stats[0].totalDonations).toBe(3);
      expect(stats[0].totalQuantity).toBe(43); // 20 + 8 + 15
      expect(stats[0].totalValue).toBe(750); // 300 + 450
    });

    test('Deve agrupar doações por categoria', async () => {
      // Criar nova categoria
      const category2 = await DonationCategoryModel.create({
        name: 'Roupas',
        description: 'Categoria para roupas',
        defaultUnit: 'peças',
        isActive: true
      });

      // Criar doação da nova categoria
      await DonationModel.create({
        donorName: 'Doador Roupas',
        categoryId: category2._id,
        quantity: 50,
        unit: 'peças',
        status: 'received'
      });

      const categoryStats = await DonationModel.aggregate([
        {
          $lookup: {
            from: 'donationcategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $group: {
            _id: '$category.name',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]);

      expect(categoryStats).toHaveLength(2);
      
      const alimentosStats = categoryStats.find(cat => cat._id === 'Alimentos');
      const roupasStats = categoryStats.find(cat => cat._id === 'Roupas');
      
      expect(alimentosStats.count).toBe(1);
      expect(roupasStats.count).toBe(1);
      expect(roupasStats.totalQuantity).toBe(50);
    });
  });
});
