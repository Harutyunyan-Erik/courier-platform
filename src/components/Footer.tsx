import { site } from "@/lib/site";
import type { Dictionary } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Footer({ t }: { t: Dictionary }) {
  return (
    <footer id="contact" className="mt-20 bg-brand-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-3 text-sm">{t.home.heroSubtitle}</p>
        </div>
        <div>
          <h3 className="font-semibold text-white">{t.home.contactTitle}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            <li><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-white">{site.phone}</a></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-white">{site.email}</a></li>
            <li>{site.address}</li>
          </ul>
        </div>
        <div className="text-sm md:text-right">
          © {new Date().getFullYear()} {site.name}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
