import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  action?: ReactNode;
}

export default function Header({ title, subtitle, searchQuery, onSearchChange, action }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {subtitle}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search tasks..."
                className="pl-10 w-64"
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          
          {/* Actions */}
          {action}
        </div>
      </div>
    </header>
  );
}
