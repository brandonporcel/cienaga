import { type Icon } from "@tabler/icons-react";
import { type Icon as LucideIconType } from "lucide-react";

export default interface NavItem {
  title: string;
  href: string;
  icon: Icon | typeof LucideIconType;
  items?: NavItem[];
  isExternal?: boolean;
}
