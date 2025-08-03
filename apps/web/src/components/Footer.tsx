import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <img src="/logo.svg" alt="Hibiji" className="h-8 w-auto" />
            </div>
            <p className="text-gray-600 text-sm">
              Connect, share, and build your digital persona with friends around the world.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-gray-600 hover:text-gray-900 text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900 text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/community-guidelines" className="text-gray-600 hover:text-gray-900 text-sm">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-gray-600 hover:text-gray-900 text-sm">
                  Safety Center
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-gray-600 hover:text-gray-900 text-sm">
                  Accessibility
                </Link>
              </li>
              <li>
                <Link href="/developers" className="text-gray-600 hover:text-gray-900 text-sm">
                  Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-gray-900 text-sm">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-gray-600 hover:text-gray-900 text-sm">
                  DMCA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">
                © {currentYear} Hibiji. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com/hibiji"
                  className="text-gray-400 hover:text-gray-500"
                  aria-label="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com/hibiji"
                  className="text-gray-400 hover:text-gray-500"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.328-1.291C4.24 14.896 3.751 13.745 3.751 12.448s.489-2.448 1.37-3.329c.88-.88 2.031-1.37 3.328-1.37s2.447.49 3.328 1.37c.88.881 1.37 2.032 1.37 3.329s-.49 2.448-1.37 3.329c-.881.8-2.031 1.291-3.328 1.291zm7.598-8.094h-1.294V7.6h1.294v1.294zm-1.294 3.554c0 .748-.271 1.387-.813 1.918-.542.53-1.181.796-1.918.796-.748 0-1.387-.265-1.918-.796-.531-.531-.797-1.17-.797-1.918s.266-1.387.797-1.918c.531-.531 1.17-.797 1.918-.797.737 0 1.376.266 1.918.797.542.531.813 1.17.813 1.918z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <span>English (US)</span>
              <button className="hover:text-gray-700">Language</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}