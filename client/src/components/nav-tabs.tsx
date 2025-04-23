import { Link } from "wouter";

interface NavTabsProps {
  currentPath: string;
}

const NavTabs: React.FC<NavTabsProps> = ({ currentPath }) => {
  return (
    <div className="flex justify-center mb-6">
      <nav className="inline-flex bg-white/20 rounded-lg p-1 backdrop-blur-sm">
        <Link href="/">
          <a
            className={`px-4 py-2 rounded-lg font-medium ${
              currentPath === "/"
                ? "text-white bg-secondary"
                : "text-white/80 hover:bg-white/10 transition"
            }`}
          >
            Today
          </a>
        </Link>
        <Link href="/archive">
          <a
            className={`px-4 py-2 rounded-lg font-medium ${
              currentPath === "/archive"
                ? "text-white bg-secondary"
                : "text-white/80 hover:bg-white/10 transition"
            }`}
          >
            Archive
          </a>
        </Link>
        <Link href="/about">
          <a
            className={`px-4 py-2 rounded-lg font-medium ${
              currentPath === "/about"
                ? "text-white bg-secondary"
                : "text-white/80 hover:bg-white/10 transition"
            }`}
          >
            About
          </a>
        </Link>
      </nav>
    </div>
  );
};

export default NavTabs;
