import { Link, useLocation } from 'wouter';
import logo from '@/assets/atlantic-rock-logo.png';
import { CONFIG } from '@/config';

export function SiteHeader() {
  const [loc] = useLocation();
  const item = (href: string, label: string, id: string) => (
    <Link href={href} data-testid={id}
      className={`relative px-3 py-2 text-sm font-medium transition-colors ${loc === href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
      {label}
      <span className={`absolute inset-x-3 -bottom-px h-0.5 bg-primary origin-left transition-transform duration-300 ${loc === href ? 'scale-x-100' : 'scale-x-0'}`} />
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur" data-testid="site-header">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-2 lg:px-6">
        <Link href="/" className="flex items-center gap-3" data-testid="link-home">
          <img src={logo} alt="Atlantic Rock Group logo" className="h-11 w-11 object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-bold tracking-tight">Atlantic Rock Group</span>
            <span className="eyebrow block">Decal Studio</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          {item('/', 'Designer', 'link-nav-designer')}
          {item('/quote', 'Quote', 'link-nav-quote')}
          <a href={CONFIG.SITE_URL} target="_blank" rel="noopener noreferrer" data-testid="link-main-site"
            className="ml-2 hidden rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:block">
            Main site
          </a>
        </nav>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-primary via-primary to-gold" />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/50 px-4 py-6 text-xs text-muted-foreground lg:px-6" data-testid="site-footer">
      <p className="mx-auto max-w-[1500px]">
        Design preview tool. Dimensions are approximate until confirmed by {CONFIG.COMPANY_NAME}. Regular text and raster artwork are not
        production-ready cut data. Nothing here is a quote or a price, and nothing is sent until you submit through the external quote page.
      </p>
    </footer>
  );
}
