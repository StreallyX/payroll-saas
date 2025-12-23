import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
 category: string;
}

const categoryColors: Record<string, string> = {
 "Contract": "bg-blue-100 text-blue-800 hover:bg-blue-200",
 "Invoice": "bg-green-100 text-green-800 hover:bg-green-200",
 "ID Document": "bg-purple-100 text-purple-800 hover:bg-purple-200",
 "Ifgnature": "bg-orange-100 text-orange-800 hover:bg-orange-200",
 "Other": "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
 const colorClass = categoryColors[category] ?? categoryColors["Other"];
 
 return (
 <Badge variant="ortline" className={colorClass}>
 {category}
 </Badge>
 );
}
