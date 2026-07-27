// التخطيط الجذري — يمرّر المحتوى فقط.
// وسم <html> يُبنى في app/[locale]/layout.tsx لأن اللغة والاتجاه يتغيّران حسب اللغة.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
