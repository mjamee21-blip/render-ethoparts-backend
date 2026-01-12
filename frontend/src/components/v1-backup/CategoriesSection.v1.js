import { Cog, Disc, Gauge, Zap, Car, Filter, Lightbulb, Circle } from "lucide-react";

const iconMap = {
  engine: Cog,
  brake: Disc,
  suspension: Gauge,
  electrical: Zap,
  body: Car,
  filter: Filter,
  light: Lightbulb,
  tire: Circle,
};

export default function CategoriesSection({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section id="categories" className="py-20 bg-slate-900" data-testid="categories-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            Shop by Category
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-2 tracking-tight">
            Find What You Need
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* All Categories */}
          <button
            onClick={() => onSelectCategory("")}
            className={`group flex flex-col items-center p-4 rounded-xl transition-all ${
              selectedCategory === ""
                ? "bg-emerald-500/20 border-emerald-500"
                : "bg-slate-800/50 border-slate-700 hover:border-emerald-500/50"
            } border`}
            data-testid="category-all"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
              selectedCategory === "" ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400"
            }`}>
              <Cog className="h-6 w-6" />
            </div>
            <span className={`text-sm font-medium ${selectedCategory === "" ? "text-emerald-400" : "text-slate-300"}`}>
              All Parts
            </span>
          </button>

          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Cog;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`group flex flex-col items-center p-4 rounded-xl transition-all ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-slate-800/50 border-slate-700 hover:border-emerald-500/50"
                } border`}
                data-testid={`category-${category.id}`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  isSelected ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400"
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-sm font-medium text-center ${isSelected ? "text-emerald-400" : "text-slate-300"}`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
