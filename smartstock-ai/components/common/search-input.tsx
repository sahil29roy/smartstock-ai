import React from "react";
import { Input, InputProps } from "../ui/input";
import { Search } from "lucide-react";

export interface SearchInputProps extends Omit<InputProps, "icon"> {}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", placeholder = "Search...", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        icon={<Search className="h-4 w-4" />}
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
