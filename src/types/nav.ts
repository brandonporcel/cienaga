import { type Icon } from "@tabler/icons-react";

export default interface NavItem {
  title: string;
  href: string;
  icon: Icon;
  items?: NavItem[];
  isExternal?: boolean;
}
