export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  {
    return (
      <div className="min-h-full flex flex-col">
        <h1 className="flex justify-center m-4 text-blue-200">Login Layout</h1>
        {children}
      </div>
    );
  }
}
