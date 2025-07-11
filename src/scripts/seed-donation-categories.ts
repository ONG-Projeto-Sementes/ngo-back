import { connection } from "../core/connection.js";
import DonationCategoryService from "../services/donation-category.service.js";

const defaultCategories = [
  {
    name: "Alimentos",
    description: "Cestas básicas, alimentos não perecíveis, produtos de limpeza",
    defaultUnit: "unidades",
    icon: "shopping-basket",
    color: "#10B981",
    isActive: true
  },
  {
    name: "Roupas",
    description: "Roupas novas ou usadas em bom estado",
    defaultUnit: "peças",
    icon: "shirt",
    color: "#3B82F6",
    isActive: true
  },
  {
    name: "Dinheiro",
    description: "Doações em dinheiro",
    defaultUnit: "reais",
    icon: "dollar-sign",
    color: "#F59E0B",
    isActive: true
  },
  {
    name: "Higiene",
    description: "Produtos de higiene pessoal e limpeza",
    defaultUnit: "unidades",
    icon: "droplets",
    color: "#8B5CF6",
    isActive: true
  },
  {
    name: "Medicamentos",
    description: "Medicamentos e produtos farmacêuticos",
    defaultUnit: "unidades",
    icon: "pill",
    color: "#EF4444",
    isActive: true
  },
  {
    name: "Brinquedos",
    description: "Brinquedos novos ou usados em bom estado",
    defaultUnit: "unidades",
    icon: "gamepad-2",
    color: "#EC4899",
    isActive: true
  },
  {
    name: "Livros",
    description: "Livros didáticos, literatura e material educativo",
    defaultUnit: "unidades",
    icon: "book",
    color: "#06B6D4",
    isActive: true
  },
  {
    name: "Móveis",
    description: "Móveis e eletrodomésticos",
    defaultUnit: "unidades",
    icon: "sofa",
    color: "#84CC16",
    isActive: true
  }
];

async function seedCategories() {
  try {
    console.log("🌱 Iniciando seed das categorias padrão...");

    for (const category of defaultCategories) {
      try {
        // Verifica se a categoria já existe
        const existing = await DonationCategoryService.findOne({
          filters: { name: { $regex: new RegExp(`^${category.name}$`, 'i') } }
        });

        if (!existing) {
          await DonationCategoryService.insert(category);
          console.log(`✅ Categoria "${category.name}" criada com sucesso`);
        } else {
          console.log(`⚠️  Categoria "${category.name}" já existe`);
        }
      } catch (error) {
        console.error(`❌ Erro ao criar categoria "${category.name}":`, error);
      }
    }

    console.log("🎉 Seed das categorias concluído!");
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
  }
}

// Execute apenas se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  void connection(async () => {
    await seedCategories();
    process.exit(0);
  });
}

export { seedCategories };
