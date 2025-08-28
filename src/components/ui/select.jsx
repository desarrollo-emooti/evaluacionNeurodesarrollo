import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef(({ className, children, value, onValueChange, disabled, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8",
          className
        )}
        value={value || ''}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
    </div>
  );
});
Select.displayName = "Select";

const SelectContent = ({ children, ...props }) => {
  return <>{children}</>;
};

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  return (
    <option ref={ref} value={value} className={className} {...props}>
      {children}
    </option>
  );
});
SelectItem.displayName = "SelectItem";

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, ...props }) => {
  return <option value="" disabled hidden>{placeholder}</option>;
};

const SelectGroup = ({ children, ...props }) => {
  return <optgroup {...props}>{children}</optgroup>;
};

const SelectLabel = ({ children, ...props }) => {
  return <option disabled {...props}>{children}</option>;
};

const SelectSeparator = () => {
  return null; // HTML select doesn't support separators
};

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}