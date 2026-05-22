import { Link } from 'react-router-dom';
import { Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-line-soft mt-28">
      <div className="container-page py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Link to="/" className="text-base font-semibold tracking-tight">
            TechKart
          </Link>
          <p className="text-sm text-muted max-w-xs leading-relaxed">
            Tech, considered. AI-guided discovery, real-time price tracking, and one-tap
            ordering for the things you'll actually use.
          </p>
          <div className="flex gap-2 mt-1">
            <SocialIcon icon={<Github size={14} />} />
            <SocialIcon icon={<Twitter size={14} />} />
            <SocialIcon icon={<Mail size={14} />} />
          </div>
        </div>

        <FooterCol title="Shop">
          <FooterLink to="/products?category=laptops" label="Laptops" />
          <FooterLink to="/products?category=smartphones" label="Smartphones" />
          <FooterLink to="/products?category=audio" label="Audio" />
          <FooterLink to="/products?category=tablets" label="Tablets" />
          <FooterLink to="/products?category=televisions" label="TVs" />
        </FooterCol>
        <FooterCol title="Account">
          <FooterLink to="/orders" label="Orders" />
          <FooterLink to="/cart" label="Cart" />
          <FooterLink to="/compare" label="Compare" />
          <FooterLink to="/profile" label="Profile" />
        </FooterCol>
        <FooterCol title="About">
          <FooterLink to="/" label="Press" />
          <FooterLink to="/" label="Careers" />
          <FooterLink to="/" label="Contact" />
          <FooterLink to="/" label="Privacy" />
        </FooterCol>
      </div>

      <div className="border-t border-line-soft py-5 text-center text-xs text-faint">
        © {new Date().getFullYear()} TechKart. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h4 className="text-[13px] font-semibold mb-1">{title}</h4>
      {children}
    </div>
  );
}

function FooterLink({ to, label }) {
  return (
    <Link to={to} className="text-[13px] text-muted hover:text-ink transition">
      {label}
    </Link>
  );
}

function SocialIcon({ icon }) {
  return (
    <span className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-2 hover:bg-surface-3 transition cursor-pointer">
      {icon}
    </span>
  );
}
