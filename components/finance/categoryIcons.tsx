import {
  Utensils,
  Car,
  ShoppingBag,
  ShoppingCart,
  Tv,
  Receipt,
  Briefcase,
  TrendingUp,
  Gift,
  Landmark,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

export const getCategoryIcon = (category: string) => {
  const p = { size: 18 };
  switch (category) {
    case "F&B":
      return <Utensils {...p} className="text-orange-500" />;
    case "Transport":
      return <Car {...p} className="text-blue-500" />;
    case "Groceries":
      return <ShoppingBag {...p} className="text-emerald-500" />;
    case "Shopping":
      return <ShoppingCart {...p} className="text-pink-500" />;
    case "Entertainment":
      return <Tv {...p} className="text-indigo-500" />;
    case "Bills":
      return <Receipt {...p} className="text-amber-500" />;
    case "Salary":
      return <Briefcase {...p} className="text-blue-600" />;
    case "Investment":
      return <TrendingUp {...p} className="text-emerald-600" />;
    case "Gift":
      return <Gift {...p} className="text-rose-400" />;
    case "Subsidy":
      return <Landmark {...p} className="text-violet-500" />;
    case "Other":
      return <PlusCircle {...p} className="text-zinc-400" />;
    default:
      return <HelpCircle {...p} className="text-zinc-400" />;
  }
};
