import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 px-10">
      <div className="flex-1">
        <Link href="/" className="p-0">
          <Image
            src="/gc.svg"
            alt="GiveCare logo"
            width={90}
            height={30}
            className="h-[30px] w-auto"
            priority
          />
        </Link>
      </div>
      <div className="flex-1"></div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <button
            type="button"
            className="btn-editorial-small flex items-center gap-2"
            aria-expanded="false"
            aria-haspopup="true"
            aria-label="Open navigation menu"
          >
            <span>Menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div tabIndex={0} className="dropdown-content mt-3 z-[1] p-3 shadow-lg bg-white rounded-lg w-56 border border-amber-200">
            <ul className="menu menu-sm">
              <li><Link href="/about" className="hover:bg-amber-50 rounded-lg text-amber-900">About</Link></li>
              <li><Link href="/how-it-works" className="hover:bg-amber-50 rounded-lg text-amber-900">How It Works</Link></li>
              <li><Link href="/words" className="hover:bg-amber-50 rounded-lg text-amber-900">Words</Link></li>
              <li><Link href="/partners" className="hover:bg-amber-50 rounded-lg text-amber-900">Partners</Link></li>
            </ul>
            <div className="mt-3 pt-3 border-t border-amber-200">
              <Link
                href="/assessment"
                className="btn-editorial-small text-center block w-full"
              >
                Start Assessment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
