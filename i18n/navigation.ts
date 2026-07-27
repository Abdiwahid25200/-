import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// استخدم هذه بدل next/link و next/navigation — تحافظ على اللغة الحالية تلقائياً
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
