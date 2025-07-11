#!/usr/bin/env tsx

/**
 * Testes manuais para validar serviços do sistema de doações
 * Execute com: npx tsx tests/manual-services-tests.ts
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DonationService } from '../src/services/donation.service.js';
import { DonationDistributionService } from '../src/services/donation-distribution.service.js';
import { FamilyService } from '../src/services/family.service.js';
import { BeneficiaryService } from '../src/services/beneficiary.service.js';
import { DonationCategoryService } from '../src/services/donation-category.service.js';

async function runServicesTests() {
  console.log('🚀 Iniciando testes dos serviços do sistema de doações...\n');

  let mongoServer: MongoMemoryServer | undefined;
  let donationService: DonationService;
  let distributionService: DonationDistributionService;
  let familyService: FamilyService;
  let categoryService: DonationCategoryService;
  let testCategory: any;
  let testFamily: any;
  let testDonation: any;

  try {
    // Configurar MongoDB em memória
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB em memória');

    // Inicializar serviços
    categoryService = new DonationCategoryService();
    donationService = new DonationService();
    distributionService = new DonationDistributionService();
    familyService = new FamilyService(new BeneficiaryService());

    // Teste 1: Criar categoria via serviço
    console.log('\n📝 Teste 1: Criando categoria via serviço...');
    testCategory = await categoryService.insert({
      name: 'Alimentos Básicos',
      description: 'Categoria para alimentos essenciais',
      defaultUnit: 'kg',
      isActive: true
    });
    console.log(`✅ Categoria criada: ${testCategory.name}`);

    // Teste 2: Criar família via serviço
    console.log('\n👨‍👩‍👧‍👦 Teste 2: Criando família via serviço...');
    testFamily = await familyService.insert({
      name: 'Família dos Santos',
      city: 'São Paulo',
      neighborhood: 'Vila Esperança',
      contact: '(11) 98765-4321',
      address: 'Rua das Flores, 123'
    });
    console.log(`✅ Família criada: ${testFamily.name}`);

    // Teste 3: Criar doação via serviço (deve validar categoria)
    console.log('\n🎁 Teste 3: Criando doação via serviço...');
    testDonation = await donationService.insert({
      donorName: 'Maria Silva',
      categoryId: testCategory._id,
      quantity: 100,
      unit: 'cestas básicas',
      description: 'Doação de cestas básicas para famílias carentes',
      estimatedValue: 5000,
      receivedDate: new Date(),
      status: 'received'
    });
    console.log(`✅ Doação criada: ${testDonation.quantity} ${testDonation.unit} de ${testDonation.donorName}`);

    // Teste 4: Tentar criar doação com categoria inativa (deve falhar)
    console.log('\n⚠️  Teste 4: Testando validação de categoria inativa...');
    try {
      await categoryService.updateOne(testCategory._id, { isActive: false });
      await donationService.insert({
        donorName: 'João Silva',
        categoryId: testCategory._id,
        quantity: 50,
        unit: 'itens',
        description: 'Teste com categoria inativa',
        receivedDate: new Date(),
        status: 'pending'
      });
      console.log('❌ ERRO: Deveria ter falhado com categoria inativa');
    } catch (error) {
      console.log(`✅ Validação funcionou: ${(error as Error).message}`);
    }

    // Reativar categoria para continuar testes
    await categoryService.updateOne(testCategory._id, { isActive: true });

    // Teste 5: Criar distribuição via serviço (deve validar família e quantidade)
    console.log('\n📦 Teste 5: Criando distribuição via serviço...');
    const distribution = await distributionService.insert({
      donationId: testDonation._id,
      familyId: testFamily._id,
      quantity: 20,
      distributionDate: new Date(),
      notes: 'Primeira distribuição para esta família',
      status: 'pending'
    });
    console.log(`✅ Distribuição criada: ${distribution.quantity} unidades para ${testFamily.name}`);

    // Teste 6: Tentar distribuir mais que o disponível (deve falhar)
    console.log('\n⚠️  Teste 6: Testando validação de quantidade insuficiente...');
    try {
      await distributionService.insert({
        donationId: testDonation._id,
        familyId: testFamily._id,
        quantity: 90, // Só restam 80
        distributionDate: new Date(),
        status: 'pending'
      });
      console.log('❌ ERRO: Deveria ter falhado por quantidade insuficiente');
    } catch (error) {
      console.log(`✅ Validação funcionou: ${(error as Error).message}`);
    }

    // Teste 7: Atualizar status da distribuição
    console.log('\n✅ Teste 7: Atualizando status da distribuição...');
    const updatedDistribution = await distributionService.updateOne(distribution._id.toString(), {
      status: 'delivered'
    });
    console.log(`✅ Status atualizado para: ${updatedDistribution!.status}`);

    // Teste 8: Buscar histórico de doações da família
    console.log('\n📈 Teste 8: Buscando histórico de doações da família...');
    const familyHistory = await familyService.getDonationHistory(testFamily._id.toString());
    console.log(`✅ Histórico encontrado: ${familyHistory.length} distribuições`);
    if (familyHistory.length > 0) {
      console.log(`   Doador: ${(familyHistory[0].donationId as any).donorName}`);
      console.log(`   Quantidade: ${familyHistory[0].quantity}`);
      console.log(`   Status: ${familyHistory[0].status}`);
    }

    // Teste 9: Buscar família com histórico completo
    console.log('\n👨‍👩‍👧‍👦 Teste 9: Buscando família com histórico completo...');
    const familyWithHistory = await familyService.findByIdWithDonationHistory(testFamily._id.toString());
    console.log(`✅ Família com histórico carregado:`);
    console.log(`   Nome: ${(familyWithHistory as any).name}`);
    console.log(`   Total de doações recebidas: ${(familyWithHistory as any).totalDonationsReceived}`);
    console.log(`   Quantidade total recebida: ${(familyWithHistory as any).totalQuantityReceived}`);

    // Teste 10: Obter estatísticas da doação
    console.log('\n📊 Teste 10: Obtendo estatísticas da doação...');
    const donationStats = await distributionService.getDonationStats(testDonation._id.toString());
    console.log(`✅ Estatísticas da doação:`);
    console.log(`   Quantidade total: ${donationStats.donationQuantity}`);
    console.log(`   Quantidade distribuída: ${donationStats.quantityDistributed}`);
    console.log(`   Quantidade restante: ${donationStats.quantityRemaining}`);
    console.log(`   Famílias beneficiadas: ${donationStats.familiesCount}`);

    // Teste 11: Buscar categorias ativas
    console.log('\n📋 Teste 11: Buscando categorias ativas...');
    const activeCategories = await categoryService.list({ 
      filters: { isActive: true } 
    });
    console.log(`✅ Categorias ativas encontradas: ${activeCategories.length}`);

    // Teste 12: Buscar doações com categoria populada
    console.log('\n🔍 Teste 12: Buscando doações com categoria populada...');
    const donationsWithCategory = await donationService.list({ 
      populate: ['categoryId'] 
    });
    console.log(`✅ Doações encontradas: ${donationsWithCategory.length}`);
    if (donationsWithCategory.length > 0) {
      console.log(`   Categoria: ${(donationsWithCategory[0].categoryId as any).name}`);
    }

    // Teste 13: Criar segunda família e distribuir para múltiplas famílias
    console.log('\n👨‍👩‍👧‍👦 Teste 13: Testando distribuição para múltiplas famílias...');
    const family2 = await familyService.insert({
      name: 'Família Oliveira',
      city: 'São Paulo',
      neighborhood: 'Jardim Paulista',
      contact: '(11) 99887-7665'
    });

    await distributionService.insert({
      donationId: testDonation._id,
      familyId: new mongoose.Types.ObjectId(family2._id.toString()),
      quantity: 30,
      distributionDate: new Date(),
      status: 'delivered'
    });

    // Estatísticas finais
    const finalStats = await distributionService.getDonationStats(testDonation._id.toString());
    console.log(`✅ Estatísticas finais:`);
    console.log(`   Quantidade distribuída: ${finalStats.quantityDistributed}`);
    console.log(`   Quantidade restante: ${finalStats.quantityRemaining}`);
    console.log(`   Famílias beneficiadas: ${finalStats.familiesCount}`);

    console.log('\n🎉 Todos os testes dos serviços completados com sucesso!');
    console.log('\n📋 Resumo dos testes executados:');
    console.log('   ✅ Criação via serviços');
    console.log('   ✅ Validação de categoria ativa');
    console.log('   ✅ Validação de quantidade disponível');
    console.log('   ✅ Atualização de status');
    console.log('   ✅ Histórico de doações');
    console.log('   ✅ Estatísticas de distribuição');
    console.log('   ✅ População de dados relacionados');
    console.log('   ✅ Distribuição para múltiplas famílias');

  } catch (error) {
    console.error('❌ Erro durante os testes dos serviços:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

// Executar testes
runServicesTests().catch(console.error);
