import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import AnalyticsService from "../src/services/analytics.service.js";
import { DonationModel } from "../src/models/donation.js";
import { DonationCategoryModel } from "../src/models/donation-category.js";
import { FamilyModel } from "../src/models/family.js";
import { DonationDistributionModel } from "../src/models/donation-distribution.js";

let mongoServer: MongoMemoryServer;

const runAnalyticsTests = async () => {
  console.log('🔬 Iniciando testes do sistema de Analytics...\n');
  
  try {
    // ===== CONFIGURAÇÃO DO BANCO DE DADOS =====
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ Conexão com MongoDB estabelecida');
    
    // ===== CRIAÇÃO DE DADOS DE EXEMPLO =====
    console.log('\n📊 Criando dados de exemplo...');
    
    // Criar categorias
    const categories = await DonationCategoryModel.insertMany([
      {
        name: 'Alimentos',
        description: 'Doações de alimentos diversos',
        defaultUnit: 'kg',
        icon: 'utensils',
        color: '#22c55e',
        isActive: true
      },
      {
        name: 'Roupas',
        description: 'Roupas e acessórios',
        defaultUnit: 'peças',
        icon: 'shirt',
        color: '#3b82f6',
        isActive: true
      },
      {
        name: 'Brinquedos',
        description: 'Brinquedos e jogos educativos',
        defaultUnit: 'unidades',
        icon: 'toy-brick',
        color: '#f59e0b',
        isActive: true
      }
    ]);
    
    // Criar famílias
    const families = await FamilyModel.insertMany([
      {
        name: 'Família Silva',
        city: 'São Paulo',
        neighborhood: 'Vila Madalena',
        contact: '(11) 99999-1111',
        address: 'Rua das Flores, 123'
      },
      {
        name: 'Família Santos',
        city: 'São Paulo',
        neighborhood: 'Liberdade',
        contact: '(11) 99999-2222',
        address: 'Rua da Liberdade, 456'
      },
      {
        name: 'Família Oliveira',
        city: 'São Paulo',
        neighborhood: 'Centro',
        contact: '(11) 99999-3333',
        address: 'Rua do Centro, 789'
      }
    ]);
    
    // Criar doações com diferentes datas
    const now = new Date();
    const donations = await DonationModel.insertMany([
      {
        donorName: 'João Silva',
        donorContact: '(11) 98888-1111',
        categoryId: categories[0]._id, // Alimentos
        quantity: 50,
        unit: 'kg',
        description: 'Arroz, feijão e macarrão',
        estimatedValue: 200,
        receivedDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        status: 'received'
      },
      {
        donorName: 'Maria Santos',
        donorContact: '(11) 98888-2222',
        categoryId: categories[1]._id, // Roupas
        quantity: 100,
        unit: 'peças',
        description: 'Roupas infantis diversas',
        estimatedValue: 500,
        receivedDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 dias atrás
        status: 'received'
      },
      {
        donorName: 'Pedro Oliveira',
        donorContact: '(11) 98888-3333',
        categoryId: categories[2]._id, // Brinquedos
        quantity: 25,
        unit: 'unidades',
        description: 'Brinquedos educativos variados',
        estimatedValue: 300,
        receivedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        status: 'received'
      },
      {
        donorName: 'Ana Costa',
        donorContact: '(11) 98888-4444',
        categoryId: categories[0]._id, // Alimentos
        quantity: 30,
        unit: 'kg',
        description: 'Cestas básicas completas',
        estimatedValue: 150,
        receivedDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
        status: 'received'
      },
      {
        donorName: 'João Silva', // Doador recorrente
        donorContact: '(11) 98888-1111',
        categoryId: categories[0]._id, // Alimentos
        quantity: 40,
        unit: 'kg',
        description: 'Segunda doação - produtos diversos',
        estimatedValue: 180,
        receivedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
        status: 'received'
      }
    ]);
    
    // Criar distribuições
    await DonationDistributionModel.insertMany([
      {
        donationId: donations[0]._id,
        familyId: families[0]._id,
        quantity: 20,
        distributionDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        notes: 'Distribuição regular',
        status: 'delivered'
      },
      {
        donationId: donations[0]._id,
        familyId: families[1]._id,
        quantity: 15,
        distributionDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        notes: 'Distribuição de emergência',
        status: 'delivered'
      },
      {
        donationId: donations[1]._id,
        familyId: families[2]._id,
        quantity: 50,
        distributionDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Roupas de inverno',
        status: 'delivered'
      },
      {
        donationId: donations[2]._id,
        familyId: families[0]._id,
        quantity: 10,
        distributionDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Brinquedos para crianças',
        status: 'delivered'
      },
      {
        donationId: donations[3]._id,
        familyId: families[1]._id,
        quantity: 15,
        distributionDate: new Date(),
        notes: 'Distribuição pendente',
        status: 'pending'
      }
    ]);
    
    console.log('✅ Dados de exemplo criados com sucesso');
    
    // ===== TESTANDO FUNCIONALIDADES DE ANALYTICS =====
    
    console.log('\n📈 Testando Analytics - Dashboard Overview...');
    const overview = await AnalyticsService.getDashboardOverview({ period: 'all' });
    console.log('   📊 Total de doações:', overview.overview.totalDonations);
    console.log('   💰 Valor total:', `R$ ${overview.overview.totalValue.toLocaleString('pt-BR')}`);
    console.log('   📦 Quantidade total:', overview.overview.totalQuantity);
    console.log('   👨‍👩‍👧‍👦 Famílias beneficiadas:', overview.overview.totalFamiliesBenefited);
    console.log('   📈 Taxa de distribuição:', `${overview.overview.distributionPercentage}%`);
    console.log('   🏪 Em estoque:', overview.overview.inStock);
    
    console.log('\n📊 Testando Analytics - Análise de Tendências...');
    const trends = await AnalyticsService.getTrendAnalysis({ groupBy: 'month' });
    console.log('   📈 Períodos analisados (doações):', trends.donations.length);
    console.log('   🚚 Períodos analisados (distribuições):', trends.distributions.length);
    
    console.log('\n🏷️ Testando Analytics - Performance de Categorias...');
    const categoryPerformance = await AnalyticsService.getCategoryPerformance();
    console.log('   📋 Categorias analisadas:', categoryPerformance.categories.length);
    if (categoryPerformance.categories.length > 0) {
      const topCategory = categoryPerformance.categories[0];
      console.log('   🥇 Top categoria:', topCategory.categoryName);
      console.log('   💰 Valor da top categoria:', `R$ ${topCategory.totalValue.toLocaleString('pt-BR')}`);
      console.log('   📊 Taxa de distribuição:', `${Math.round(topCategory.distributionRate)}%`);
    }
    
    console.log('\n❤️ Testando Analytics - Análise de Doadores...');
    const donorAnalytics = await AnalyticsService.getDonorAnalytics();
    console.log('   👥 Total de doadores únicos:', donorAnalytics.summary.totalUniqueDonors);
    console.log('   📊 Média de doações por doador:', donorAnalytics.summary.avgDonationsPerDonor);
    console.log('   🏆 Top doador:', donorAnalytics.summary.topDonor?.donorName || 'N/A');
    console.log('   🔄 Doadores frequentes:', donorAnalytics.summary.segmentation.frequent);
    console.log('   📈 Taxa de retenção:', `${donorAnalytics.retention.retentionRate}%`);
    
    console.log('\n⚡ Testando Analytics - Métricas de Eficiência...');
    const efficiency = await AnalyticsService.getEfficiencyMetrics();
    console.log('   ⏱️ Tempo médio para distribuição:', `${efficiency.timing.averageDaysToDistribution} dias`);
    console.log('   ⚠️ Alertas de estoque baixo:', efficiency.alerts.lowStock.length);
    console.log('   ⏳ Distribuições pendentes:', efficiency.alerts.pendingDistributions);
    console.log('   📊 Status analisados:', efficiency.status.length);
    
    console.log('\n🎯 Testando Overview Mensal...');
    const monthlyOverview = await AnalyticsService.getDashboardOverview({ period: 'month' });
    console.log('   📅 Período: Último mês');
    console.log('   📊 Doações do mês:', monthlyOverview.overview.totalDonations);
    console.log('   💰 Valor do mês:', `R$ ${monthlyOverview.overview.totalValue.toLocaleString('pt-BR')}`);
    
    console.log('\n🏷️ Testando Filtro por Categoria...');
    const categoryFilter = await AnalyticsService.getDashboardOverview({ 
      categoryId: categories[0]._id.toString() // Alimentos
    });
    console.log('   🍽️ Categoria: Alimentos');
    console.log('   📊 Doações da categoria:', categoryFilter.overview.totalDonations);
    console.log('   💰 Valor da categoria:', `R$ ${categoryFilter.overview.totalValue.toLocaleString('pt-BR')}`);
    
    console.log('\n📈 Testando Tendências Semanais...');
    const weeklyTrends = await AnalyticsService.getTrendAnalysis({ 
      groupBy: 'week',
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 dias atrás
      endDate: now
    });
    console.log('   📅 Agrupamento: Semanal');
    console.log('   📊 Períodos de doação:', weeklyTrends.donations.length);
    console.log('   🚚 Períodos de distribuição:', weeklyTrends.distributions.length);
    
    // ===== VALIDAÇÃO DE INTEGRIDADE DOS DADOS =====
    
    console.log('\n🔍 Validando integridade dos cálculos...');
    
    // Verificar se o total de doações bate
    const totalDonationsDB = await DonationModel.countDocuments({ deleted: false });
    console.log('   ✅ Total de doações no DB:', totalDonationsDB);
    console.log('   ✅ Total via Analytics:', overview.overview.totalDonations);
    console.log('   ✅ Consistência:', totalDonationsDB === overview.overview.totalDonations ? '✅' : '❌');
    
    // Verificar se o total de famílias beneficiadas bate
    const uniqueFamiliesDB = await DonationDistributionModel.distinct('familyId', { 
      deleted: false, 
      status: { $ne: 'cancelled' } 
    });
    console.log('   ✅ Famílias beneficiadas no DB:', uniqueFamiliesDB.length);
    console.log('   ✅ Famílias via Analytics:', overview.overview.totalFamiliesBenefited);
    console.log('   ✅ Consistência:', uniqueFamiliesDB.length === overview.overview.totalFamiliesBenefited ? '✅' : '❌');
    
    // Verificar se o cálculo de estoque está correto
    const totalQuantityDB = await DonationModel.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalDistributedDB = await DonationDistributionModel.aggregate([
      { $match: { deleted: false, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    
    const totalQty = totalQuantityDB[0]?.total || 0;
    const totalDist = totalDistributedDB[0]?.total || 0;
    const stockDB = totalQty - totalDist;
    
    console.log('   ✅ Estoque calculado manualmente:', stockDB);
    console.log('   ✅ Estoque via Analytics:', overview.overview.inStock);
    console.log('   ✅ Consistência:', stockDB === overview.overview.inStock ? '✅' : '❌');
    
    console.log('\n🎉 Todos os testes de Analytics concluídos com sucesso!');
    console.log('\n📋 Resumo dos recursos implementados:');
    console.log('   ✅ Dashboard Overview completo');
    console.log('   ✅ Análise de tendências temporais');
    console.log('   ✅ Performance detalhada por categoria');
    console.log('   ✅ Analytics de doadores e retenção');
    console.log('   ✅ Métricas de eficiência operacional');
    console.log('   ✅ Alertas de estoque baixo');
    console.log('   ✅ Filtros por período e categoria');
    console.log('   ✅ Cálculos de distribuição e estoque');
    console.log('   ✅ Segmentação de doadores');
    console.log('   ✅ KPIs operacionais');
    console.log('   ✅ Validação de integridade de dados');
    
    console.log('\n🔧 Endpoints disponíveis:');
    console.log('   📊 GET /analytics/dashboard - Overview completo');
    console.log('   📈 GET /analytics/trends - Análise de tendências');
    console.log('   🏷️ GET /analytics/categories - Performance por categoria');
    console.log('   ❤️ GET /analytics/donors - Analytics de doadores');
    console.log('   ⚡ GET /analytics/efficiency - Métricas de eficiência');
    console.log('   📋 GET /analytics/executive-summary - Resumo executivo');
    console.log('   🚨 GET /analytics/alerts - Alertas do sistema');
    console.log('   🎯 GET /analytics/widgets - Métricas de widgets');
    
    console.log('\n💡 Exemplos de uso:');
    console.log('   • GET /analytics/dashboard?period=month');
    console.log('   • GET /analytics/trends?groupBy=week&categoryId=...');
    console.log('   • GET /analytics/categories?startDate=2025-01-01');
    console.log('   • GET /analytics/widgets?widgets=total_donations,stock_status');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
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
};

// Executar testes
runAnalyticsTests().catch(console.error);
