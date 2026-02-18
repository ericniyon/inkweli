import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col animate-fade-in">
      <SiteHeader variant="white" />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
