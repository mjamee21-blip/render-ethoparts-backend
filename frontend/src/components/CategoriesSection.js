import { Cog, Disc, Gauge, Zap, Car, Filter, Lightbulb, Circle, ArrowRight } from "lucide-react";

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
  // Bento grid layout - first 2 are large, rest are small
  const getBentoClass = (index) => {
    if (index === 0) return "col-span-2 row-span-2";
    if (index === 1) return "col-span-2";
    return "col-span-1";
  };

  return (
    <section id="categories" className="py-20 px-6" data-testid="categories-section">
      <div className="max-w-7xl mx-auto">
        {/* Section Header - Minimal */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-2">Categories</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Find What You Need</h2>
          </div>
          <button 
            onClick={() => onSelectCategory("")}
            className="hidden sm:flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 auto-rows-[100px]">
          {/* All Parts - Featured */}
          <button
            onClick={() => onSelectCategory("")}
            className={`group relative overflow-hidden rounded-2xl p-5 transition-all ${
              selectedCategory === ""
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
            } col-span-2 row-span-2`}
            data-testid="category-all"
          >
            <div className="flex flex-col h-full justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selectedCategory === "" ? "bg-emerald-500/20" : "bg-white/[0.04] group-hover:bg-white/[0.06]"
              }`}>
                <Cog className={`h-6 w-6 ${selectedCategory === "" ? "text-emerald-400" : "text-zinc-400 group-hover:text-white"}`} strokeWidth={1.5} />
              </div>
              <div className="text-left">
                <p className={`text-lg font-semibold ${selectedCategory === "" ? "text-emerald-400" : "text-white"}`}>All Parts</p>
                <p className="text-zinc-500 text-sm mt-1">Browse entire catalog</p>
              </div>
            </div>
            {/* Data point badge */}
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 bg-white/[0.06] rounded-md text-[10px] font-medium text-zinc-400">500+ items</span>
            </div>
          </button>

          {categories.slice(0, 6).map((category, index) => {
            const Icon = iconMap[category.icon] || Cog;
            const isSelected = selectedCategory === category.id;
            const isLarge = index === 0;

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`group relative overflow-hidden rounded-2xl p-4 transition-all text-left ${
                  isSelected
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                } ${isLarge ? "col-span-2" : "col-span-1"}`}
                data-testid={`category-${category.id}`}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? "bg-emerald-500/20" : "bg-white/[0.04] group-hover:bg-white/[0.06]"
                  }`}>
                    <Icon className={`h-5 w-5 ${isSelected ? "text-emerald-400" : "text-zinc-400 group-hover:text-white"}`} strokeWidth={1.5} />
                  </div>
                  <p className={`text-sm font-medium mt-3 ${isSelected ? "text-emerald-400" : "text-zinc-300 group-hover:text-white"}`}>
                    {category.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
